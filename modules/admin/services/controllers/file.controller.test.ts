import { beforeEach, describe, expect, it, vi } from "vitest"

const datasource = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  getImage: vi.fn(),
  getImages: vi.fn(),
  removeImage: vi.fn(),
}))

vi.mock("../datasources/file.datasource", () => ({
  FileDatasource: class {
    uploadImage = datasource.uploadImage
    getImage = datasource.getImage
    getImages = datasource.getImages
    removeImage = datasource.removeImage
  },
}))

import { FileController } from "./file.controller"

const controller = new FileController()

beforeEach(() => {
  for (const fn of Object.values(datasource)) fn.mockReset()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("FileController", () => {
  it("delegates the happy paths to the datasource", async () => {
    datasource.uploadImage.mockResolvedValue({ url: "u" })
    datasource.getImage.mockResolvedValue({ publicId: "p" })
    datasource.getImages.mockResolvedValue([{ publicId: "p" }])
    datasource.removeImage.mockResolvedValue(undefined)

    await expect(controller.uploadImage("file", { folder: "f" })).resolves.toEqual({ url: "u" })
    await expect(controller.getImage("p")).resolves.toEqual({ publicId: "p" })
    await expect(controller.getImages({ folder: "f" })).resolves.toEqual([{ publicId: "p" }])
    await expect(controller.removeImage("p")).resolves.toBeUndefined()
    expect(datasource.uploadImage).toHaveBeenCalledWith("file", { folder: "f" })
  })

  it.each([
    ["uploadImage", () => controller.uploadImage("x"), "uploadImage", "No se pudo subir el archivo"],
    ["getImage", () => controller.getImage("x"), "getImage", "No se pudo obtener el archivo"],
    ["getImages", () => controller.getImages(), "getImages", "No se pudieron listar los archivos"],
    ["removeImage", () => controller.removeImage("x"), "removeImage", "No se pudo eliminar el archivo"],
  ] as const)("%s hides provider errors behind a generic message", async (_name, call, method, message) => {
    datasource[method].mockRejectedValue(new Error("storage secret"))

    await expect(call()).rejects.toThrow(message)
  })
})
