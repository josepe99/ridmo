import { beforeEach, describe, expect, it, vi } from "vitest"

const storage = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  getImage: vi.fn(),
  getImages: vi.fn(),
  removeImage: vi.fn(),
}))

vi.mock("./s3.datasource", () => ({ S3Service: storage }))

import { FileDatasource } from "./file.datasource"

const datasource = new FileDatasource()

beforeEach(() => {
  for (const fn of Object.values(storage)) fn.mockReset()
})

describe("FileDatasource", () => {
  it("delegates uploads with their options", async () => {
    storage.uploadImage.mockResolvedValue({ url: "u" })

    await expect(datasource.uploadImage("file", { folder: "f" })).resolves.toEqual({ url: "u" })
    expect(storage.uploadImage).toHaveBeenCalledWith("file", { folder: "f" })
  })

  it("defaults the upload options to an empty object", async () => {
    await datasource.uploadImage("file")

    expect(storage.uploadImage).toHaveBeenCalledWith("file", {})
  })

  it("delegates reads, listing and removal", async () => {
    storage.getImage.mockResolvedValue({ publicId: "p" })
    storage.getImages.mockResolvedValue([{ publicId: "p" }])
    storage.removeImage.mockResolvedValue(undefined)

    await expect(datasource.getImage("p")).resolves.toEqual({ publicId: "p" })
    await expect(datasource.getImages({ folder: "f" })).resolves.toEqual([{ publicId: "p" }])
    await expect(datasource.removeImage("p")).resolves.toBeUndefined()
    expect(storage.getImages).toHaveBeenCalledWith({ folder: "f" })
    expect(storage.removeImage).toHaveBeenCalledWith("p")
  })

  it("lets provider errors propagate to the controller", async () => {
    storage.getImage.mockRejectedValue(new Error("down"))

    await expect(datasource.getImage("p")).rejects.toThrow("down")
  })
})
