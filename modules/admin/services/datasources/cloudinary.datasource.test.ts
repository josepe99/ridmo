import { beforeEach, describe, expect, it, vi } from "vitest"

const configCalls: unknown[] = vi.hoisted(() => [])

const cloudinaryMock = vi.hoisted(() => ({
  config: vi.fn((options: unknown) => { configCalls.push(options) }),
  url: vi.fn(),
  uploader: { upload: vi.fn(), destroy: vi.fn() },
  api: { resource: vi.fn(), resources: vi.fn(), delete_resources: vi.fn() },
}))

vi.mock("cloudinary", () => ({ v2: cloudinaryMock }))
vi.mock("@/shared/lib/settings", () => ({
  CLOUDINARY_CLOUD_NAME: "cloud",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
}))

import { CloudinaryService } from "./cloudinary.datasource"

const uploadResponse = {
  secure_url: "https://res.cloudinary.com/cloud/image/upload/a.jpg",
  public_id: "milowearco/a",
  width: 800,
  height: 600,
  format: "jpg",
  bytes: 1234,
}

beforeEach(() => {
  cloudinaryMock.url.mockReset().mockReturnValue("https://res.cloudinary.com/cloud/url")
  cloudinaryMock.uploader.upload.mockReset().mockResolvedValue(uploadResponse)
  cloudinaryMock.uploader.destroy.mockReset().mockResolvedValue({ result: "ok" })
  cloudinaryMock.api.resource.mockReset()
  cloudinaryMock.api.resources.mockReset()
  cloudinaryMock.api.delete_resources.mockReset()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("module configuration", () => {
  it("configures the SDK from the validated settings on import", () => {
    expect(configCalls).toEqual([{ cloud_name: "cloud", api_key: "key", api_secret: "secret" }])
  })
})

describe("CloudinaryService.uploadImage", () => {
  it("uploads a URL or base64 string as is and maps the response", async () => {
    const result = await CloudinaryService.uploadImage("https://example.com/a.jpg", { folder: "f" })

    expect(cloudinaryMock.uploader.upload).toHaveBeenCalledWith(
      "https://example.com/a.jpg",
      expect.objectContaining({ folder: "f", quality: "auto", transformation: [] })
    )
    expect(result).toEqual({
      url: uploadResponse.secure_url,
      publicId: "milowearco/a",
      width: 800,
      height: 600,
      format: "jpg",
      bytes: 1234,
    })
  })

  it("defaults the folder when none is given", async () => {
    await CloudinaryService.uploadImage("data:image/png;base64,AAA")

    expect(cloudinaryMock.uploader.upload.mock.calls[0][1].folder).toBe("milowearco")
  })

  it("encodes a File as a base64 data URI with its own mime type", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" })

    await CloudinaryService.uploadImage(file)

    expect(cloudinaryMock.uploader.upload.mock.calls[0][0]).toBe(
      `data:image/png;base64,${Buffer.from([1, 2, 3]).toString("base64")}`
    )
  })

  it("encodes a Buffer as a JPEG data URI", async () => {
    await CloudinaryService.uploadImage(Buffer.from([9, 9]))

    expect(cloudinaryMock.uploader.upload.mock.calls[0][0]).toBe(
      `data:image/jpeg;base64,${Buffer.from([9, 9]).toString("base64")}`
    )
  })

  it("only forwards an explicit format, never 'auto' (it is applied on delivery)", async () => {
    await CloudinaryService.uploadImage("x", { format: "auto" })
    await CloudinaryService.uploadImage("x", { format: "webp" })

    expect(cloudinaryMock.uploader.upload.mock.calls[0][1].format).toBe("auto")
    expect(cloudinaryMock.uploader.upload.mock.calls[1][1].format).toBe("webp")
  })

  it("wraps SDK failures in a generic error", async () => {
    cloudinaryMock.uploader.upload.mockRejectedValue(new Error("401 secret"))

    await expect(CloudinaryService.uploadImage("x")).rejects.toThrow("Failed to upload image to Cloudinary")
  })

  it("rejects unsupported input types", async () => {
    await expect(CloudinaryService.uploadImage(42 as never)).rejects.toThrow(
      "Failed to upload image to Cloudinary"
    )
    expect(cloudinaryMock.uploader.upload).not.toHaveBeenCalled()
  })
})

describe("CloudinaryService.uploadMultipleImages", () => {
  it("uploads every file and returns results in order", async () => {
    cloudinaryMock.uploader.upload
      .mockResolvedValueOnce({ ...uploadResponse, public_id: "one" })
      .mockResolvedValueOnce({ ...uploadResponse, public_id: "two" })

    const results = await CloudinaryService.uploadMultipleImages(["a", "b"])

    expect(results.map((result) => result.publicId)).toEqual(["one", "two"])
  })
})

describe("CloudinaryService reads", () => {
  const resource = {
    asset_id: "asset",
    public_id: "pid",
    secure_url: "https://secure/x.jpg",
    url: "http://insecure/x.jpg",
    format: "jpg",
    bytes: 10,
    width: 1,
    height: 2,
    created_at: "2026-01-01",
  }

  it("getImage maps the resource", async () => {
    cloudinaryMock.api.resource.mockResolvedValue(resource)

    await expect(CloudinaryService.getImage("pid")).resolves.toEqual({
      assetId: "asset",
      publicId: "pid",
      url: "https://secure/x.jpg",
      secureUrl: "https://secure/x.jpg",
      format: "jpg",
      bytes: 10,
      width: 1,
      height: 2,
      createdAt: "2026-01-01",
    })
  })

  it("getImage falls back to the plain url when there is no secure url", async () => {
    cloudinaryMock.api.resource.mockResolvedValue({ ...resource, secure_url: undefined })

    await expect(CloudinaryService.getImage("pid")).resolves.toMatchObject({ url: "http://insecure/x.jpg" })
  })

  it("getImage wraps failures", async () => {
    cloudinaryMock.api.resource.mockRejectedValue(new Error("404"))

    await expect(CloudinaryService.getImage("pid")).rejects.toThrow("Failed to get image from Cloudinary")
  })

  it("getImages lists uploads under a folder with a default max of 50", async () => {
    cloudinaryMock.api.resources.mockResolvedValue({ resources: [resource] })

    const images = await CloudinaryService.getImages({ folder: "f" })

    expect(cloudinaryMock.api.resources).toHaveBeenCalledWith({ type: "upload", prefix: "f", max_results: 50 })
    expect(images).toHaveLength(1)
  })

  it("getImages tolerates a response without resources and wraps failures", async () => {
    cloudinaryMock.api.resources.mockResolvedValueOnce({})
    await expect(CloudinaryService.getImages({ maxResults: 5 })).resolves.toEqual([])

    cloudinaryMock.api.resources.mockRejectedValueOnce(new Error("down"))
    await expect(CloudinaryService.getImages()).rejects.toThrow("Failed to list images from Cloudinary")
  })
})

describe("CloudinaryService deletes", () => {
  it("deleteImage destroys the asset and removeImage is an alias", async () => {
    await CloudinaryService.deleteImage("pid")
    await CloudinaryService.removeImage("pid2")

    expect(cloudinaryMock.uploader.destroy).toHaveBeenNthCalledWith(1, "pid")
    expect(cloudinaryMock.uploader.destroy).toHaveBeenNthCalledWith(2, "pid2")
  })

  it("deleteImage wraps failures", async () => {
    cloudinaryMock.uploader.destroy.mockRejectedValue(new Error("x"))

    await expect(CloudinaryService.deleteImage("pid")).rejects.toThrow("Failed to delete image from Cloudinary")
  })

  it("deleteMultipleImages deletes in one batch call and wraps failures", async () => {
    await CloudinaryService.deleteMultipleImages(["a", "b"])
    expect(cloudinaryMock.api.delete_resources).toHaveBeenCalledWith(["a", "b"])

    cloudinaryMock.api.delete_resources.mockRejectedValue(new Error("x"))
    await expect(CloudinaryService.deleteMultipleImages(["a"])).rejects.toThrow(
      "Failed to delete images from Cloudinary"
    )
  })
})

describe("CloudinaryService URL helpers", () => {
  it("generateUrl asks for automatic quality and format by default", () => {
    CloudinaryService.generateUrl("pid")

    expect(cloudinaryMock.url).toHaveBeenCalledWith("pid", { quality: "auto", fetch_format: "auto" })
  })

  it("generateThumbnail builds a 200x200 fill crop by default", () => {
    CloudinaryService.generateThumbnail("pid")

    expect(cloudinaryMock.url).toHaveBeenCalledWith(
      "pid",
      expect.objectContaining({ width: 200, height: 200, crop: "fill" })
    )
  })

  it("generateResponsiveUrls builds one scaled URL per width", () => {
    const urls = CloudinaryService.generateResponsiveUrls("pid", [100, 200])

    expect(urls.map((entry) => entry.width)).toEqual([100, 200])
    expect(cloudinaryMock.url).toHaveBeenCalledTimes(2)
    expect(cloudinaryMock.url.mock.calls[1][1]).toMatchObject({ width: 200, crop: "scale" })
  })

  it("generateResponsiveUrls defaults to 400/800/1200", () => {
    expect(CloudinaryService.generateResponsiveUrls("pid").map((entry) => entry.width)).toEqual([
      400, 800, 1200,
    ])
  })
})
