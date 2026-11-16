import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ clientConfigs: [] as unknown[], send: vi.fn() }))
const getS3Config = vi.hoisted(() => vi.fn())

vi.mock("@aws-sdk/client-s3", () => {
  const command = (name: string) =>
    class {
      readonly name = name
      constructor(public input: Record<string, any>) {}
    }
  return {
    S3Client: class {
      constructor(config: unknown) {
        state.clientConfigs.push(config)
      }
      send = state.send
    },
    PutObjectCommand: command("PutObject"),
    HeadObjectCommand: command("HeadObject"),
    ListObjectsV2Command: command("ListObjectsV2"),
    DeleteObjectCommand: command("DeleteObject"),
    DeleteObjectsCommand: command("DeleteObjects"),
  }
})
vi.mock("@/shared/lib/settings", () => ({ getS3Config }))

import { S3Service } from "./s3.datasource"

const config = {
  endpoint: "http://minio:9000",
  region: "us-east-1",
  bucket: "ridmo-media",
  accessKeyId: "key",
  secretAccessKey: "secret",
  forcePathStyle: true,
  publicUrl: "https://media.ridmo.test/ridmo-media",
}

const sent = (index = 0) => state.send.mock.calls[index][0] as { name: string; input: Record<string, any> }

beforeEach(() => {
  state.send.mockReset().mockResolvedValue({})
  state.clientConfigs.length = 0
  getS3Config.mockReset().mockReturnValue(config)
  S3Service.resetClient()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("client configuration", () => {
  it("builds the client from the S3 settings and reuses it", async () => {
    await S3Service.uploadImage(Buffer.from("a"), { contentType: "image/png" })
    await S3Service.uploadImage(Buffer.from("b"), { contentType: "image/png" })

    expect(state.clientConfigs).toEqual([
      {
        endpoint: "http://minio:9000",
        region: "us-east-1",
        forcePathStyle: true,
        credentials: { accessKeyId: "key", secretAccessKey: "secret" },
      },
    ])
  })

  it("fails with a generic error when the S3 settings are missing", async () => {
    getS3Config.mockImplementation(() => {
      throw new Error("Missing required S3 environment variables: S3_BUCKET")
    })

    await expect(S3Service.uploadImage(Buffer.from("a"))).rejects.toThrow("Failed to upload image to storage")
    expect(console.error).toHaveBeenCalled()
  })
})

describe("S3Service.uploadImage", () => {
  it("uploads a File under folder/uuid.ext with its content type and returns the public URL", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "photo.jpeg", { type: "image/jpeg" })

    const result = await S3Service.uploadImage(file, { folder: "ridmo/items" })

    const command = sent()
    expect(command.name).toBe("PutObject")
    expect(command.input.Bucket).toBe("ridmo-media")
    expect(command.input.Key).toMatch(/^ridmo\/items\/[0-9a-f-]{36}\.jpg$/)
    expect(command.input.ContentType).toBe("image/jpeg")
    expect(Buffer.from(command.input.Body).length).toBe(3)
    expect(result).toEqual({
      url: `https://media.ridmo.test/ridmo-media/${command.input.Key}`,
      publicId: command.input.Key,
      format: "jpg",
      bytes: 3,
    })
  })

  it("uses a default folder and trims slashes from the given one", async () => {
    await S3Service.uploadImage(Buffer.from("a"), { contentType: "image/webp" })
    await S3Service.uploadImage(Buffer.from("a"), { folder: "/a/b/", contentType: "image/webp" })

    expect(sent(0).input.Key).toMatch(/^ridmo\/[0-9a-f-]{36}\.webp$/)
    expect(sent(1).input.Key).toMatch(/^a\/b\/[0-9a-f-]{36}\.webp$/)
  })

  it("supports videos and falls back to the file name extension", async () => {
    await S3Service.uploadImage(new File(["x"], "clip.mp4", { type: "video/mp4" }))
    await S3Service.uploadImage(new File(["x"], "doc.PDF", { type: "" }))

    expect(sent(0).input.Key).toMatch(/\.mp4$/)
    expect(sent(0).input.ContentType).toBe("video/mp4")
    expect(sent(1).input.Key).toMatch(/\.pdf$/)
    expect(sent(1).input.ContentType).toBe("application/octet-stream")
  })

  it("decodes a base64 data URI and uses its mime type", async () => {
    const result = await S3Service.uploadImage(`data:image/png;base64,${Buffer.from("png").toString("base64")}`)

    expect(sent().input.ContentType).toBe("image/png")
    expect(sent().input.Body.toString()).toBe("png")
    expect(result.format).toBe("png")
    expect(result.bytes).toBe(3)
  })

  it("defaults a Buffer to octet-stream unless a content type is given", async () => {
    await S3Service.uploadImage(Buffer.from("a"))

    expect(sent().input.ContentType).toBe("application/octet-stream")
    expect(sent().input.Key).toMatch(/\.bin$/)
  })

  it("rejects unsupported input types and non data-URI strings without calling S3", async () => {
    await expect(S3Service.uploadImage("https://example.com/a.jpg")).rejects.toThrow("Failed to upload image to storage")
    await expect(S3Service.uploadImage(123 as unknown as string)).rejects.toThrow("Failed to upload image to storage")
    expect(state.send).not.toHaveBeenCalled()
  })

  it("wraps S3 failures in a generic error", async () => {
    state.send.mockRejectedValue(new Error("AccessDenied secret"))

    await expect(S3Service.uploadImage(Buffer.from("a"))).rejects.toThrow("Failed to upload image to storage")
  })
})

describe("S3Service.uploadMultipleImages", () => {
  it("uploads every file and keeps the order", async () => {
    const results = await S3Service.uploadMultipleImages([
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.gif", { type: "image/gif" }),
    ])

    expect(results.map((r) => r.format)).toEqual(["png", "gif"])
  })
})

describe("S3Service reads", () => {
  it("getImage heads the object and maps it", async () => {
    state.send.mockResolvedValue({
      ContentLength: 10,
      ContentType: "image/png",
      LastModified: new Date("2025-01-01T00:00:00Z"),
    })

    const resource = await S3Service.getImage("ridmo/a.png")

    expect(sent()).toMatchObject({ name: "HeadObject", input: { Bucket: "ridmo-media", Key: "ridmo/a.png" } })
    expect(resource).toEqual({
      publicId: "ridmo/a.png",
      url: "https://media.ridmo.test/ridmo-media/ridmo/a.png",
      format: "png",
      bytes: 10,
      contentType: "image/png",
      createdAt: "2025-01-01T00:00:00.000Z",
    })
  })

  it("getImage wraps failures", async () => {
    state.send.mockRejectedValue(new Error("NotFound"))

    await expect(S3Service.getImage("x")).rejects.toThrow("Failed to get image from storage")
  })

  it("getImages lists a prefix with a default max of 50", async () => {
    state.send.mockResolvedValue({
      Contents: [{ Key: "f/a.jpg", Size: 5, LastModified: new Date("2025-01-01T00:00:00Z") }],
    })

    const resources = await S3Service.getImages({ folder: "f" })

    expect(sent().input).toEqual({ Bucket: "ridmo-media", Prefix: "f/", MaxKeys: 50 })
    expect(resources).toEqual([
      expect.objectContaining({
        publicId: "f/a.jpg",
        url: "https://media.ridmo.test/ridmo-media/f/a.jpg",
        bytes: 5,
        format: "jpg",
      }),
    ])
  })

  it("getImages tolerates an empty listing, honors maxResults and wraps failures", async () => {
    await expect(S3Service.getImages({ maxResults: 5 })).resolves.toEqual([])
    expect(sent().input).toEqual({ Bucket: "ridmo-media", Prefix: undefined, MaxKeys: 5 })

    state.send.mockRejectedValue(new Error("x"))
    await expect(S3Service.getImages()).rejects.toThrow("Failed to list images from storage")
  })
})

describe("S3Service deletes", () => {
  it("deleteImage removes the key and removeImage is an alias", async () => {
    await S3Service.deleteImage("f/a.jpg")
    await S3Service.removeImage("f/b.jpg")

    expect(sent(0)).toMatchObject({ name: "DeleteObject", input: { Bucket: "ridmo-media", Key: "f/a.jpg" } })
    expect(sent(1).input.Key).toBe("f/b.jpg")
  })

  it("deleting an id that is not in the bucket (e.g. a legacy Cloudinary public id) is a harmless no-op", async () => {
    await expect(S3Service.deleteImage("milowearco/items/legacy")).resolves.toBeUndefined()
  })

  it("deleteImage wraps failures", async () => {
    state.send.mockRejectedValue(new Error("x"))

    await expect(S3Service.deleteImage("a")).rejects.toThrow("Failed to delete image from storage")
  })

  it("deleteMultipleImages deletes in one batch call and wraps failures", async () => {
    await S3Service.deleteMultipleImages(["a", "b"])

    expect(sent()).toMatchObject({
      name: "DeleteObjects",
      input: { Bucket: "ridmo-media", Delete: { Objects: [{ Key: "a" }, { Key: "b" }], Quiet: true } },
    })

    state.send.mockRejectedValue(new Error("x"))
    await expect(S3Service.deleteMultipleImages(["a"])).rejects.toThrow("Failed to delete images from storage")
  })

  it("deleteMultipleImages does nothing for an empty list", async () => {
    await S3Service.deleteMultipleImages([])

    expect(state.send).not.toHaveBeenCalled()
  })
})

describe("S3Service.generateUrl", () => {
  it("builds the public URL from the key without double slashes", () => {
    expect(S3Service.generateUrl("/f/a.jpg")).toBe("https://media.ridmo.test/ridmo-media/f/a.jpg")
  })
})
