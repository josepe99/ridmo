import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock, txMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { BaseDatasource } from "./base.datasource"

class TestDatasource extends BaseDatasource {
  paginate = this.findMany.bind(this)
  one = this.findUnique.bind(this)
  first = this.findFirst.bind(this)
  make = this.create.bind(this)
  change = this.update.bind(this)
  upsertOne = this.upsert.bind(this)
  remove = this.delete.bind(this)
  removeMany = this.deleteMany.bind(this)
  total = this.count.bind(this)
  agg = this.aggregate.bind(this)
  tx = this.transaction.bind(this)
}

const datasource = new TestDatasource()
const model = {
  findMany: vi.fn(),
  count: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  aggregate: vi.fn(),
}

beforeEach(() => {
  resetPrismaMock()
  for (const fn of Object.values(model)) fn.mockReset()
})

describe("findMany pagination", () => {
  it("computes skip/take from page and limit and reports pagination metadata", async () => {
    model.findMany.mockResolvedValue([{ id: 1 }])
    model.count.mockResolvedValue(25)

    const result = await datasource.paginate(model, { page: 2, limit: 10, where: { isActive: true } })

    expect(model.findMany).toHaveBeenCalledWith({ where: { isActive: true }, skip: 10, take: 10 })
    expect(model.count).toHaveBeenCalledWith({ where: { isActive: true } })
    expect(result).toEqual({
      data: [{ id: 1 }],
      pagination: { page: 2, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: true },
    })
  })

  it("defaults to the first page of 10 and has no previous/next page when empty", async () => {
    model.findMany.mockResolvedValue([])
    model.count.mockResolvedValue(0)

    const { pagination } = await datasource.paginate(model)

    expect(model.findMany).toHaveBeenCalledWith({ skip: 0, take: 10 })
    expect(pagination).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    })
  })

  it("has no next page on the last page", async () => {
    model.findMany.mockResolvedValue([])
    model.count.mockResolvedValue(21)

    const { pagination } = await datasource.paginate(model, { page: 3, limit: 10 })

    expect(pagination).toMatchObject({ totalPages: 3, hasNext: false, hasPrev: true })
  })
})

describe("thin CRUD wrappers", () => {
  it("findUnique and findFirst forward their options", async () => {
    model.findUnique.mockResolvedValue({ id: 1 })
    model.findFirst.mockResolvedValue({ id: 2 })

    await expect(datasource.one(model, { where: { id: "1" } })).resolves.toEqual({ id: 1 })
    await expect(datasource.first(model, { where: { id: "2" } })).resolves.toEqual({ id: 2 })
    expect(model.findUnique).toHaveBeenCalledWith({ where: { id: "1" } })
    expect(model.findFirst).toHaveBeenCalledWith({ where: { id: "2" } })
  })

  it("create wraps the payload in data and merges options", async () => {
    await datasource.make(model, { name: "x" }, { select: { id: true } })

    expect(model.create).toHaveBeenCalledWith({ data: { name: "x" }, select: { id: true } })
  })

  it("update and upsert forward where/data", async () => {
    await datasource.change(model, { id: "1" }, { name: "y" })
    await datasource.upsertOne(model, { id: "1" }, { name: "c" }, { name: "u" })

    expect(model.update).toHaveBeenCalledWith({ where: { id: "1" }, data: { name: "y" } })
    expect(model.upsert).toHaveBeenCalledWith({
      where: { id: "1" },
      create: { name: "c" },
      update: { name: "u" },
    })
  })

  it("delete, deleteMany, count and aggregate forward their arguments", async () => {
    model.count.mockResolvedValue(4)
    model.deleteMany.mockResolvedValue({ count: 2 })

    await datasource.remove(model, { id: "1" })
    await expect(datasource.removeMany(model, { tag: "a" })).resolves.toEqual({ count: 2 })
    await expect(datasource.total(model)).resolves.toBe(4)
    await datasource.agg(model, { _count: { id: true } })

    expect(model.delete).toHaveBeenCalledWith({ where: { id: "1" } })
    expect(model.deleteMany).toHaveBeenCalledWith({ where: { tag: "a" } })
    expect(model.count).toHaveBeenCalledWith({ where: {} })
    expect(model.aggregate).toHaveBeenCalledWith({ _count: { id: true } })
  })
})

describe("transaction", () => {
  it("runs all operations against the transaction client and returns their results", async () => {
    const results = await datasource.tx([
      async (client) => (client === txMock ? "a" : "wrong"),
      async () => "b",
    ])

    expect(results).toEqual(["a", "b"])
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })
})
