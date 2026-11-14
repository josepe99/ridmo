import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { BaseController } from "./base.controller"

class TestController extends BaseController {
  handle = this.handleRequest.bind(this)
  parse = this.parseRequestBody.bind(this)
  ok = this.createSuccessResponse.bind(this)
  fail = this.createErrorResponse.bind(this)
  auth = this.checkAuthentication.bind(this)
}

const controller = new TestController()

function request(init: { method?: string; contentType?: string; body?: BodyInit } = {}) {
  return new NextRequest("http://localhost/api/test", {
    method: init.method ?? "POST",
    headers: init.contentType ? { "content-type": init.contentType } : undefined,
    body: init.body,
  })
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("parseRequestBody", () => {
  it("parses JSON bodies", async () => {
    const body = await controller.parse(
      request({ contentType: "application/json", body: JSON.stringify({ a: 1 }) })
    )

    expect(body).toEqual({ a: 1 })
  })

  it("flattens urlencoded forms into a plain object", async () => {
    const body = await controller.parse(
      request({ contentType: "application/x-www-form-urlencoded", body: "name=Ana&city=Asuncion" })
    )

    expect(body).toEqual({ name: "Ana", city: "Asuncion" })
  })

  it("returns FormData for multipart bodies", async () => {
    const form = new FormData()
    form.set("name", "Ana")

    const body = await controller.parse(request({ body: form }))

    expect(body).toBeInstanceOf(FormData)
    expect(body.get("name")).toBe("Ana")
  })

  it("returns an empty object for unknown content types", async () => {
    await expect(controller.parse(request({ contentType: "text/plain", body: "hi" }))).resolves.toEqual({})
  })

  it("returns an empty object when the body cannot be parsed", async () => {
    const body = await controller.parse(request({ contentType: "application/json", body: "{broken" }))

    expect(body).toEqual({})
  })
})

describe("handleRequest", () => {
  it("runs the handler without validation when none is configured", async () => {
    const handler = vi.fn(async () => NextResponse.json({ ok: true }))

    const response = await controller.handle(request(), handler)

    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalledWith(expect.anything(), undefined)
  })

  it("validates the body and hands the parsed data to the handler", async () => {
    const schema = z.object({ name: z.string(), active: z.boolean().default(true) })
    const handler = vi.fn(async (_req: NextRequest, data?: unknown) => NextResponse.json(data))

    const response = await controller.handle(
      request({ contentType: "application/json", body: JSON.stringify({ name: "x" }) }),
      handler,
      { validation: schema }
    )

    expect(await response.json()).toEqual({ name: "x", active: true })
  })

  it("answers 400 with details and skips the handler when validation fails", async () => {
    const handler = vi.fn()

    const response = await controller.handle(
      request({ contentType: "application/json", body: JSON.stringify({ name: 3 }) }),
      handler,
      { validation: z.object({ name: z.string() }) }
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe("Validation failed")
    expect(body.details[0].path).toEqual(["name"])
    expect(handler).not.toHaveBeenCalled()
  })

  it("answers a generic 500 and hides the error when the handler throws", async () => {
    const response = await controller.handle(request(), async () => {
      throw new Error("secret internals")
    })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "Internal server error" })
  })
})

describe("response helpers", () => {
  it("wraps data in a success envelope with the given status", async () => {
    const response = controller.ok({ id: 1 }, 201)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ success: true, data: { id: 1 } })
  })

  it("wraps messages in an error envelope (400 by default)", async () => {
    const response = controller.fail("nope")

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ success: false, error: "nope" })
  })

  it("checkAuthentication always succeeds (auth lives elsewhere)", async () => {
    await expect(controller.auth(request())).resolves.toEqual({ success: true })
  })
})

describe("HTTP verbs", () => {
  it.each(["GET", "POST", "PUT", "PATCH", "DELETE"] as const)(
    "%s answers 501 until a subclass implements it",
    async (verb) => {
      const response = await controller[verb](request({ method: verb === "GET" ? "GET" : verb }))

      expect(response.status).toBe(501)
      expect(await response.json()).toEqual({ success: false, error: "Method not implemented" })
    }
  )
})
