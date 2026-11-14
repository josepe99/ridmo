import { beforeEach, describe, expect, it, vi } from "vitest"

const cloudinary = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  getImage: vi.fn(),
  getImages: vi.fn(),
  removeImage: vi.fn(),
}))

vi.mock("./cloudinary.datasource", () => ({ CloudinaryService: cloudinary }))

import { FileDatasource } from "./file.datasource"

const datasource = new FileDatasource()

beforeEach(() => {
  for (const fn of Object.values(cloudinary)) fn.mockReset()
})

describe("FileDatasource", () => {
  it("delegates uploads with their options", async () => {
    cloudinary.uploadImage.mockResolvedValue({ url: "u" })

    await expect(datasource.uploadImage("file", { folder: "f" })).resolves.toEqual({ url: "u" })
    expect(cloudinary.uploadImage).toHaveBeenCalledWith("file", { folder: "f" })
  })

  it("defaults the upload options to an empty object", async () => {
    await datasource.uploadImage("file")

    expect(cloudinary.uploadImage).toHaveBeenCalledWith("file", {})
  })

  it("delegates reads, listing and removal", async () => {
    cloudinary.getImage.mockResolvedValue({ publicId: "p" })
    cloudinary.getImages.mockResolvedValue([{ publicId: "p" }])
    cloudinary.removeImage.mockResolvedValue(undefined)

    await expect(datasource.getImage("p")).resolves.toEqual({ publicId: "p" })
    await expect(datasource.getImages({ folder: "f" })).resolves.toEqual([{ publicId: "p" }])
    await expect(datasource.removeImage("p")).resolves.toBeUndefined()
    expect(cloudinary.getImages).toHaveBeenCalledWith({ folder: "f" })
    expect(cloudinary.removeImage).toHaveBeenCalledWith("p")
  })

  it("lets provider errors propagate to the controller", async () => {
    cloudinary.getImage.mockRejectedValue(new Error("down"))

    await expect(datasource.getImage("p")).rejects.toThrow("down")
  })
})
