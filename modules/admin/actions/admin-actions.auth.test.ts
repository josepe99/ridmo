import { beforeEach, describe, expect, it, vi } from "vitest"

const controllers = vi.hoisted(() => ({
  collection: { getCollectionById: vi.fn(), getByAdmin: vi.fn() },
  file: { uploadImage: vi.fn(), getImage: vi.fn(), getImages: vi.fn(), removeImage: vi.fn() },
  item: { getItems: vi.fn(), getItemById: vi.fn() },
}))

vi.mock("@/modules/users/server", () => ({ requireAdmin: vi.fn() }))
vi.mock("../services/controllers/collection.controller", () => ({
  CollectionController: class {
    getCollectionById = controllers.collection.getCollectionById
    getByAdmin = controllers.collection.getByAdmin
  },
}))
vi.mock("../services/controllers/file.controller", () => ({
  FileController: class {
    uploadImage = controllers.file.uploadImage
    getImage = controllers.file.getImage
    getImages = controllers.file.getImages
    removeImage = controllers.file.removeImage
  },
}))
vi.mock("../services/controllers/item.controller", () => ({
  ItemController: class {
    getItems = controllers.item.getItems
    getItemById = controllers.item.getItemById
  },
}))
vi.mock("../services/datasources/cloudinary.datasource", () => ({}))

import { requireAdmin } from "@/modules/users/server"
import * as collectionActions from "./collections.actions"
import * as fileActions from "./file.actions"
import * as itemActions from "./items.actions"

// Every exported server action of the admin module. A new export that is not listed here is
// still covered by the "exports nothing but async functions" check below.
const ACTIONS: Array<[string, (...args: never[]) => Promise<unknown>, unknown[]]> = [
  ["getCollectionById", collectionActions.getCollectionById, ["c1"]],
  ["getByAdminAction", collectionActions.getByAdminAction, ["c1"]],
  ["getItems", itemActions.getItems, [{}]],
  ["getItemById", itemActions.getItemById, ["i1"]],
  ["getItemsByCollectionId", itemActions.getItemsByCollectionId, ["c1"]],
  ["uploadImage", fileActions.uploadImage, ["data:image/png;base64,AAAA"]],
  ["getImage", fileActions.getImage, ["folder/id"]],
  ["getImages", fileActions.getImages, [{}]],
  ["removeImage", fileActions.removeImage, ["folder/id"]],
]

const denied = Object.assign(new Error("FORBIDDEN"), { name: "AuthorizationError", code: "FORBIDDEN" })

beforeEach(() => {
  vi.mocked(requireAdmin).mockReset().mockRejectedValue(denied)
  for (const group of Object.values(controllers)) for (const fn of Object.values(group)) fn.mockReset()
})

describe("admin server actions require an admin", () => {
  it.each(ACTIONS)("%s rejects a caller who is not an admin and never reaches the controller", async (_name, action, args) => {
    await expect((action as (...a: unknown[]) => Promise<unknown>)(...args)).rejects.toBe(denied)

    for (const group of Object.values(controllers)) {
      for (const fn of Object.values(group)) expect(fn).not.toHaveBeenCalled()
    }
  })

  it.each(ACTIONS)("%s asks requireAdmin before doing anything else", async (_name, action, args) => {
    vi.mocked(requireAdmin).mockResolvedValue("admin_1")
    for (const group of Object.values(controllers)) for (const fn of Object.values(group)) fn.mockResolvedValue({})

    await (action as (...a: unknown[]) => Promise<unknown>)(...args)

    expect(requireAdmin).toHaveBeenCalledTimes(1)
  })

  it("covers every export of the three action files", () => {
    const exported = [...Object.keys(collectionActions), ...Object.keys(itemActions), ...Object.keys(fileActions)].sort()
    expect(exported).toEqual(ACTIONS.map(([name]) => name).sort())
  })
})
