"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, BellRing } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { savePushSubscriptionAction } from "../actions/save-subscription.action"

type Status = "checking" | "unsupported" | "unconfigured" | "idle" | "working" | "active" | "denied" | "error"

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

const HINTS: Partial<Record<Status, string>> = {
  unsupported: "Este navegador no admite notificaciones push.",
  unconfigured: "Faltan las claves VAPID en el servidor.",
  denied: "Bloqueaste las notificaciones. Habilitalas desde los ajustes del sitio.",
  error: "No se pudo activar. Intentá de nuevo.",
}

type Props = {
  /** VAPID public key (read on the server); null when push is not configured. */
  vapidPublicKey: string | null
  className?: string
}

/** Admin-only control that subscribes this browser to new-order push notifications. */
export function EnableNotificationsButton({ vapidPublicKey, className }: Props) {
  const [status, setStatus] = useState<Status>("checking")

  const sync = useCallback(
    async (subscription: PushSubscription) => {
      const result = await savePushSubscriptionAction(subscription.toJSON())
      return result.ok
    },
    []
  )

  // Detect the current state; if this browser is already subscribed, make sure the server knows it.
  useEffect(() => {
    let cancelled = false
    const detect = async () => {
      if (!isSupported()) return setStatus("unsupported")
      if (!vapidPublicKey) return setStatus("unconfigured")
      if (Notification.permission === "denied") return setStatus("denied")
      if (Notification.permission !== "granted") return setStatus("idle")

      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js")
        const existing = await registration?.pushManager.getSubscription()
        if (cancelled) return
        if (existing && (await sync(existing))) return setStatus("active")
        setStatus("idle")
      } catch {
        if (!cancelled) setStatus("idle")
      }
    }
    void detect()
    return () => {
      cancelled = true
    }
  }, [vapidPublicKey, sync])

  const enable = async () => {
    if (!vapidPublicKey) return
    setStatus("working")
    try {
      // Ask first: some browsers only honour the prompt inside the click's user activation.
      const permission = await Notification.requestPermission()
      if (permission !== "granted") return setStatus(permission === "denied" ? "denied" : "idle")

      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }))

      setStatus((await sync(subscription)) ? "active" : "error")
    } catch (error) {
      console.error("[notifications] Could not enable push:", error)
      setStatus("error")
    }
  }

  const isActive = status === "active"
  const disabled = status !== "idle" && status !== "error"
  const hint = HINTS[status]

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <button
        type="button"
        onClick={enable}
        disabled={disabled}
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-2 border px-4 py-2 text-xs font-semibold uppercase tracking-label transition-colors duration-200",
          isActive
            ? "border-neutral-200 bg-neutral-100 text-neutral-500"
            : "border-black bg-black text-white hover:bg-neutral-800",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {isActive ? <BellRing className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
        {isActive ? "Notificaciones activas" : status === "working" ? "Activando..." : "Activar notificaciones"}
      </button>
      {hint ? (
        <p role="status" className="max-w-xs text-right text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
