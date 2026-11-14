/* RIDMO service worker: Web Push notifications for admins (new orders). */

const NOTIFICATION_ICON = "/images/ridmo-logo.png"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : "" }
  }

  const title = payload.title || "Nuevo pedido"
  const options = {
    body: payload.body || "",
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    tag: payload.tag,
    data: { url: payload.url || "/admin/orders" },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  // Only ever open same-origin URLs.
  const target = new URL(event.notification.data?.url || "/admin/orders", self.location.origin)
  if (target.origin !== self.location.origin) return

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (new URL(client.url).origin === target.origin && "focus" in client) {
          return client.focus().then((focused) => {
            if (focused && "navigate" in focused) return focused.navigate(target.href)
            return focused
          })
        }
      }
      return self.clients.openWindow(target.href)
    })
  )
})
