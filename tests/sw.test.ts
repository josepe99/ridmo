import { beforeEach, describe, expect, it, vi } from "vitest"

// public/sw.js is a plain script. It is imported with a fake ServiceWorkerGlobalScope installed as
// `self`, so the push and notificationclick handlers run without a browser (and are instrumented
// for coverage). This test lives outside public/ on purpose: files under public/ are served.
const ORIGIN = "https://ridmo.test"

type Listener = (event: Record<string, unknown>) => void

type WindowClient = {
  url: string
  focus: ReturnType<typeof vi.fn>
  navigate?: ReturnType<typeof vi.fn>
}

async function loadServiceWorker() {
  const listeners = new Map<string, Listener>()
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: vi.fn(),
    clients: {
      claim: vi.fn(async () => undefined),
      matchAll: vi.fn(async (): Promise<WindowClient[]> => []),
      openWindow: vi.fn(async () => undefined),
    },
    registration: { showNotification: vi.fn(async () => undefined) },
  }
  vi.stubGlobal("self", self)
  vi.resetModules()
  await import("../public/sw.js")

  /** Dispatches an event and resolves whatever was passed to `event.waitUntil`. */
  const dispatch = async (type: string, event: Record<string, unknown>) => {
    let pending: Promise<unknown> = Promise.resolve()
    listeners.get(type)?.({ ...event, waitUntil: (promise: Promise<unknown>) => (pending = promise) })
    await pending
  }

  return { self, listeners, dispatch }
}

const pushEvent = (data: unknown) => ({
  data: data === undefined ? null : { json: () => data, text: () => String(data) },
})

const brokenPush = (text: string) => ({
  data: {
    json: () => {
      throw new SyntaxError("bad json")
    },
    text: () => text,
  },
})

const clickEvent = (data?: { url?: string } | null) => ({
  notification: { close: vi.fn(), data },
})

let sw: Awaited<ReturnType<typeof loadServiceWorker>>

beforeEach(async () => {
  sw = await loadServiceWorker()
})

describe("service worker lifecycle", () => {
  it("registers install, activate, push and notificationclick listeners", () => {
    expect([...sw.listeners.keys()].sort()).toEqual(["activate", "install", "notificationclick", "push"])
  })

  it("activates immediately on install", async () => {
    await sw.dispatch("install", {})

    expect(sw.self.skipWaiting).toHaveBeenCalled()
  })

  it("claims open clients on activate", async () => {
    await sw.dispatch("activate", {})

    expect(sw.self.clients.claim).toHaveBeenCalled()
  })
})

describe("push handler", () => {
  it("shows a notification built from the JSON payload", async () => {
    await sw.dispatch(
      "push",
      pushEvent({ title: "Nuevo pedido", body: "RID-000001", tag: "order-RID-000001", url: "/admin/orders/o1" })
    )

    expect(sw.self.registration.showNotification).toHaveBeenCalledWith("Nuevo pedido", {
      body: "RID-000001",
      icon: "/images/ridmo-logo.png",
      badge: "/images/ridmo-logo.png",
      tag: "order-RID-000001",
      data: { url: "/admin/orders/o1" },
    })
  })

  it("falls back to a default title, empty body and the admin orders url", async () => {
    await sw.dispatch("push", pushEvent({}))

    const [title, options] = sw.self.registration.showNotification.mock.calls[0] as unknown as [
      string,
      { body: string; data: { url: string } },
    ]
    expect(title).toBe("Nuevo pedido")
    expect(options.body).toBe("")
    expect(options.data.url).toBe("/admin/orders")
  })

  it("still notifies when the push has no data at all", async () => {
    await sw.dispatch("push", pushEvent(undefined))

    expect(sw.self.registration.showNotification).toHaveBeenCalledWith(
      "Nuevo pedido",
      expect.objectContaining({ body: "" })
    )
  })

  it("uses the raw text as the body when the payload is not JSON", async () => {
    await sw.dispatch("push", brokenPush("plain text alert"))

    expect(sw.self.registration.showNotification).toHaveBeenCalledWith(
      "Nuevo pedido",
      expect.objectContaining({ body: "plain text alert" })
    )
  })
})

describe("notificationclick handler", () => {
  const client = (url: string, withNavigate = true): WindowClient => {
    const focused = withNavigate ? { navigate: vi.fn(async () => undefined) } : {}
    return {
      url,
      focus: vi.fn(async () => focused),
      navigate: withNavigate ? (focused as { navigate: ReturnType<typeof vi.fn> }).navigate : undefined,
    }
  }

  it("closes the notification", async () => {
    const event = clickEvent({ url: "/admin/orders/o1" })

    await sw.dispatch("notificationclick", event)

    expect(event.notification.close).toHaveBeenCalled()
  })

  it("opens a new window when no tab of the site is open", async () => {
    await sw.dispatch("notificationclick", clickEvent({ url: "/admin/orders/o1" }))

    expect(sw.self.clients.openWindow).toHaveBeenCalledWith(`${ORIGIN}/admin/orders/o1`)
  })

  it("focuses an existing same-origin tab and navigates it to the target", async () => {
    const open = client(`${ORIGIN}/`)
    sw.self.clients.matchAll.mockResolvedValue([open])

    await sw.dispatch("notificationclick", clickEvent({ url: "/admin/orders/o1" }))

    expect(open.focus).toHaveBeenCalled()
    expect(open.navigate).toHaveBeenCalledWith(`${ORIGIN}/admin/orders/o1`)
    expect(sw.self.clients.openWindow).not.toHaveBeenCalled()
  })

  it("ignores tabs of other origins and opens a new window instead", async () => {
    const foreign = client("https://other.example/")
    sw.self.clients.matchAll.mockResolvedValue([foreign])

    await sw.dispatch("notificationclick", clickEvent({ url: "/admin/orders/o1" }))

    expect(foreign.focus).not.toHaveBeenCalled()
    expect(sw.self.clients.openWindow).toHaveBeenCalled()
  })

  it("defaults to the admin orders list when the notification carries no url", async () => {
    await sw.dispatch("notificationclick", clickEvent(null))

    expect(sw.self.clients.openWindow).toHaveBeenCalledWith(`${ORIGIN}/admin/orders`)
  })

  it("never opens a cross-origin url from a tampered payload", async () => {
    await sw.dispatch("notificationclick", clickEvent({ url: "https://evil.example/phish" }))

    expect(sw.self.clients.matchAll).not.toHaveBeenCalled()
    expect(sw.self.clients.openWindow).not.toHaveBeenCalled()
  })
})
