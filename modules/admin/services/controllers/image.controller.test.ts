import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const storage = vi.hoisted(() => ({ uploadImage: vi.fn(), deleteImage: vi.fn() }))

vi.mock("@/modules/admin/services/datasources/s3.datasource", () => ({
  S3Service: storage,
}))

import { ImageController } from "./image.controller"

const controller = new ImageController()

const uploaded = (publicId: string) => ({
  url: `https://media.ridmo.test/ridmo-media/${publicId}.jpg`,
  publicId,
  format: "jpg",
  bytes: 1,
})

const imageFile = (name = "a.jpg", type = "image/jpeg", size = 10) => {
  const file = new File([new Uint8Array(1)], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

beforeEach(() => {
  storage.uploadImage.mockReset().mockImplementation(async (file: File) => uploaded(file.name))
  storage.deleteImage.mockReset().mockResolvedValue(undefined)
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("uploadSingleImage validation", () => {
  it.each(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"])("accepts %s", async (type) => {
    await expect(controller.uploadSingleImage(imageFile("x", type))).resolves.toMatchObject({ publicId: "x" })
  })

  it.each(["application/pdf", "text/html", "image/svg+xml", ""])("rejects the %j type", async (type) => {
    await expect(controller.uploadSingleImage(imageFile("x", type))).rejects.toThrow(
      "Tipo de archivo inválido. Solo se permiten imágenes."
    )
    expect(storage.uploadImage).not.toHaveBeenCalled()
  })

  it("rejects files over 10MB but accepts exactly 10MB", async () => {
    await expect(controller.uploadSingleImage(imageFile("big", "image/png", 10 * 1024 * 1024 + 1))).rejects.toThrow(
      "El archivo es demasiado grande. Máximo 10 MB."
    )
    await expect(
      controller.uploadSingleImage(imageFile("limit", "image/png", 10 * 1024 * 1024))
    ).resolves.toBeDefined()
  })

  it("uploads to the items folder, letting callers override", async () => {
    await controller.uploadSingleImage(imageFile())
    await controller.uploadSingleImage(imageFile(), { folder: "other" })

    expect(storage.uploadImage.mock.calls[0][1]).toEqual({ folder: "ridmo/items" })
    expect(storage.uploadImage.mock.calls[1][1]).toEqual({ folder: "other" })
  })
})

describe("uploadImages", () => {
  it("uploads every file and keeps the order", async () => {
    const result = await controller.uploadImages([imageFile("one"), imageFile("two")])

    expect(result.map((image) => image.publicId)).toEqual(["one", "two"])
  })

  it("fails the whole batch with a generic error when one upload fails", async () => {
    await expect(
      controller.uploadImages([imageFile("ok"), imageFile("bad", "application/pdf")])
    ).rejects.toThrow("No se pudieron subir las imágenes")
  })
})

describe("uploadFromBase64", () => {
  it("uploads the string with the default folder", async () => {
    await controller.uploadFromBase64("data:image/png;base64,AAA")

    expect(storage.uploadImage).toHaveBeenCalledWith("data:image/png;base64,AAA", {
      folder: "ridmo/items",
    })
  })

  it("rethrows provider errors", async () => {
    storage.uploadImage.mockRejectedValue(new Error("boom"))

    await expect(controller.uploadFromBase64("x")).rejects.toThrow("boom")
  })
})

describe("deleteImage / deleteImages", () => {
  it("deleteImage reports success as a boolean and never throws", async () => {
    await expect(controller.deleteImage("p")).resolves.toBe(true)

    storage.deleteImage.mockRejectedValue(new Error("x"))
    await expect(controller.deleteImage("p")).resolves.toBe(false)
  })

  it("deleteImages separates successes from failures and keeps going", async () => {
    storage.deleteImage
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("x"))
      .mockResolvedValueOnce(undefined)

    await expect(controller.deleteImages(["a", "b", "c"])).resolves.toEqual({
      success: ["a", "c"],
      failed: ["b"],
    })
  })
})

describe("processFormDataImages", () => {
  it("collects only File entries whose key starts with 'image'", async () => {
    const form = new FormData()
    form.append("image1", imageFile("a.jpg"))
    form.append("image-2", imageFile("b.jpg"))
    form.append("avatar", imageFile("c.jpg"))
    form.append("imageNote", "not a file")

    const files = await controller.processFormDataImages(form)

    expect(files.map((file) => file.name)).toEqual(["a.jpg", "b.jpg"])
  })
})

describe("POST", () => {
  const postWith = (form: FormData) =>
    controller.POST(new NextRequest("http://localhost/api/admin/images", { method: "POST", body: form }))

  it("answers 400 when there are no images", async () => {
    const response = await postWith(new FormData())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ success: false, error: "No se enviaron imágenes" })
  })

  it("uploads the images and reports the count", async () => {
    const form = new FormData()
    form.append("image1", imageFile("a.jpg"))

    const response = await postWith(form)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.count).toBe(1)
    expect(body.data.images[0].publicId).toBe("a.jpg")
  })

  it("answers 500 with the upload failure message", async () => {
    const form = new FormData()
    form.append("image1", imageFile("a.pdf", "application/pdf"))

    const response = await postWith(form)

    expect(response.status).toBe(500)
    expect((await response.json()).error).toBe("No se pudieron subir las imágenes")
  })
})

describe("DELETE", () => {
  const del = (query: string) =>
    controller.DELETE(new NextRequest(`http://localhost/api/admin/images${query}`, { method: "DELETE" }))

  it("deletes one image by publicId", async () => {
    const response = await del("?publicId=abc")

    expect(storage.deleteImage).toHaveBeenCalledWith("abc")
    expect(response.status).toBe(200)
  })

  it("answers 500 when the single delete fails", async () => {
    storage.deleteImage.mockRejectedValue(new Error("x"))

    const response = await del("?publicId=abc")

    expect(response.status).toBe(500)
  })

  it("deletes many images from a comma separated list", async () => {
    const response = await del("?publicIds=a,b")

    expect(await response.json()).toEqual({ success: true, data: { success: ["a", "b"], failed: [] } })
  })

  it("answers 400 when no id is given", async () => {
    const response = await del("")

    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe("Se requiere al menos un ID público")
  })
})
