import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// The server action (and with it the admin gate) is replaced at the module boundary.
vi.mock("../actions/save-subscription.action", () => ({ savePushSubscriptionAction: vi.fn() }))

import { savePushSubscriptionAction } from "../actions/save-subscription.action"
import { EnableNotificationsButton } from "./enable-notifications-button"

// URL-safe base64 of the bytes [1, 2, 3, 250]
const VAPID_KEY = "AQID-g"

type Permission = "default" | "granted" | "denied"

const subscriptionJson = { endpoint: "https://push.example/1", keys: { p256dh: "p", auth: "a" } }
const fakeSubscription = { toJSON: () => subscriptionJson }

const pushManager = { getSubscription: vi.fn(), subscribe: vi.fn() }
const registration = { pushManager }
const serviceWorker = {
  getRegistration: vi.fn(),
  register: vi.fn(),
  ready: Promise.resolve(registration),
}

function stubBrowser(permission: Permission, requestResult: Permission = "granted") {
  Object.defineProperty(navigator, "serviceWorker", { value: serviceWorker, configurable: true })
  vi.stubGlobal("PushManager", class {})
  vi.stubGlobal("Notification", {
    permission,
    requestPermission: vi.fn(async () => requestResult),
  })
}

beforeEach(() => {
  pushManager.getSubscription.mockReset().mockResolvedValue(null)
  pushManager.subscribe.mockReset().mockResolvedValue(fakeSubscription)
  serviceWorker.getRegistration.mockReset().mockResolvedValue(registration)
  serviceWorker.register.mockReset().mockResolvedValue(registration)
  vi.mocked(savePushSubscriptionAction).mockReset().mockResolvedValue({ ok: true })
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  Reflect.deleteProperty(navigator, "serviceWorker")
})

const button = () => screen.getByRole("button")

describe("EnableNotificationsButton: detection", () => {
  it("reports unsupported browsers and disables the button", async () => {
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)

    expect(await screen.findByText("Este navegador no admite notificaciones push.")).toBeInTheDocument()
    expect(button()).toBeDisabled()
  })

  it("reports missing VAPID configuration", async () => {
    stubBrowser("default")
    render(<EnableNotificationsButton vapidPublicKey={null} />)

    expect(await screen.findByText("Faltan las claves VAPID en el servidor.")).toBeInTheDocument()
    expect(button()).toBeDisabled()
  })

  it("reports blocked notifications", async () => {
    stubBrowser("denied")
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)

    expect(await screen.findByText(/Bloqueaste las notificaciones/)).toBeInTheDocument()
    expect(button()).toBeDisabled()
  })

  it("is ready to activate when permission has not been asked yet", async () => {
    stubBrowser("default")
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)

    await waitFor(() => expect(button()).toBeEnabled())
    expect(button()).toHaveTextContent("Activar notificaciones")
  })

  it("re-syncs an existing subscription with the server and shows it as active", async () => {
    stubBrowser("granted")
    pushManager.getSubscription.mockResolvedValue(fakeSubscription)
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)

    expect(await screen.findByText("Notificaciones activas")).toBeInTheDocument()
    expect(savePushSubscriptionAction).toHaveBeenCalledWith(subscriptionJson)
    expect(button()).toBeDisabled()
  })

  it("stays idle when permission is granted but there is no subscription", async () => {
    stubBrowser("granted")
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)

    await waitFor(() => expect(button()).toBeEnabled())
    expect(savePushSubscriptionAction).not.toHaveBeenCalled()
  })

  it("stays idle when looking up the registration fails", async () => {
    stubBrowser("granted")
    serviceWorker.getRegistration.mockRejectedValue(new Error("sw broken"))
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)

    await waitFor(() => expect(button()).toBeEnabled())
  })

  it("stays idle when the server rejects the existing subscription", async () => {
    stubBrowser("granted")
    pushManager.getSubscription.mockResolvedValue(fakeSubscription)
    vi.mocked(savePushSubscriptionAction).mockResolvedValue({ ok: false, error: "Suscripción inválida" })
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)

    await waitFor(() => expect(button()).toBeEnabled())
  })
})

describe("EnableNotificationsButton: enabling", () => {
  it("asks permission, registers the worker, subscribes with the VAPID key and saves", async () => {
    stubBrowser("default", "granted")
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)
    await waitFor(() => expect(button()).toBeEnabled())

    await userEvent.click(button())

    expect(await screen.findByText("Notificaciones activas")).toBeInTheDocument()
    expect(serviceWorker.register).toHaveBeenCalledWith("/sw.js")
    const options = pushManager.subscribe.mock.calls[0][0]
    expect(options.userVisibleOnly).toBe(true)
    expect(Array.from(options.applicationServerKey as Uint8Array)).toEqual([1, 2, 3, 250])
    expect(savePushSubscriptionAction).toHaveBeenCalledWith(subscriptionJson)
  })

  it("reuses an existing browser subscription instead of subscribing again", async () => {
    stubBrowser("default", "granted")
    pushManager.getSubscription.mockResolvedValue(fakeSubscription)
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)
    await waitFor(() => expect(button()).toBeEnabled())

    await userEvent.click(button())

    expect(await screen.findByText("Notificaciones activas")).toBeInTheDocument()
    expect(pushManager.subscribe).not.toHaveBeenCalled()
  })

  it("shows the blocked hint when the shopper denies the permission prompt", async () => {
    stubBrowser("default", "denied")
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)
    await waitFor(() => expect(button()).toBeEnabled())

    await userEvent.click(button())

    expect(await screen.findByText(/Bloqueaste las notificaciones/)).toBeInTheDocument()
    expect(serviceWorker.register).not.toHaveBeenCalled()
  })

  it("goes back to idle when the prompt is dismissed", async () => {
    stubBrowser("default", "default")
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)
    await waitFor(() => expect(button()).toBeEnabled())

    await userEvent.click(button())

    await waitFor(() => expect(button()).toBeEnabled())
    expect(button()).toHaveTextContent("Activar notificaciones")
  })

  it("shows an error (and stays retryable) when the server refuses the subscription", async () => {
    stubBrowser("default", "granted")
    vi.mocked(savePushSubscriptionAction).mockResolvedValue({ ok: false, error: "No se pudo guardar la suscripción" })
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)
    await waitFor(() => expect(button()).toBeEnabled())

    await userEvent.click(button())

    expect(await screen.findByText("No se pudo activar. Intentá de nuevo.")).toBeInTheDocument()
    expect(button()).toBeEnabled()
  })

  it("shows an error when subscribing throws", async () => {
    stubBrowser("default", "granted")
    pushManager.subscribe.mockRejectedValue(new Error("push service down"))
    render(<EnableNotificationsButton vapidPublicKey={VAPID_KEY} />)
    await waitFor(() => expect(button()).toBeEnabled())

    await userEvent.click(button())

    expect(await screen.findByText("No se pudo activar. Intentá de nuevo.")).toBeInTheDocument()
  })
})
