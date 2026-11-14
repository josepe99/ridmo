"use server"

import { z } from "zod"
import { requireAdmin } from "@/modules/users/server"
import { saveSubscription } from "../services/subscriptions"

const subscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
})

export type SaveSubscriptionResult = { ok: true } | { ok: false; error: string }

/** Admin-only: registers the browser's push subscription so it receives order alerts. */
export async function savePushSubscriptionAction(input: unknown): Promise<SaveSubscriptionResult> {
  const userId = await requireAdmin()

  const parsed = subscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Suscripción inválida" }
  }

  try {
    await saveSubscription(userId, {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    })
    return { ok: true }
  } catch (error) {
    console.error("[notifications] Failed to save subscription:", error)
    return { ok: false, error: "No se pudo guardar la suscripción" }
  }
}
