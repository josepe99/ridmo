import "server-only"

import { sendNotification } from "web-push"
import {
  buildNewOrderPayload,
  type NewOrderNotificationInput,
  type PushPayload,
} from "../domain/new-order-payload"
import { listSubscriptions, removeSubscription } from "./subscriptions"
import { getVapidConfig } from "./vapid"

/** Push services answer these when a subscription is gone for good. */
const GONE_STATUS_CODES = new Set([404, 410])
const PUSH_TTL_SECONDS = 60 * 60 * 24

function statusCodeOf(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const code = (error as { statusCode: unknown }).statusCode
    return typeof code === "number" ? code : null
  }
  return null
}

/**
 * Sends a push to every stored admin subscription and prunes the dead ones.
 * Resolves with how many were delivered. Never rejects: a broken push channel
 * must not affect the caller.
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
  try {
    const vapid = getVapidConfig()
    if (!vapid) return 0

    const subscriptions = await listSubscriptions()
    if (subscriptions.length === 0) return 0

    const body = JSON.stringify(payload)
    const outcomes = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await sendNotification(
            { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
            body,
            { TTL: PUSH_TTL_SECONDS, vapidDetails: vapid }
          )
        } catch (error) {
          const status = statusCodeOf(error)
          if (status !== null && GONE_STATUS_CODES.has(status)) {
            await removeSubscription(subscription.endpoint)
          }
          throw error
        }
      })
    )

    const failures = outcomes.filter((outcome) => outcome.status === "rejected")
    if (failures.length > 0) {
      console.warn(
        `[notifications] ${failures.length}/${outcomes.length} push deliveries failed:`,
        failures.map((failure) => statusCodeOf(failure.reason) ?? String(failure.reason))
      )
    }

    return outcomes.length - failures.length
  } catch (error) {
    console.error("[notifications] Failed to send push notifications:", error)
    return 0
  }
}

/** Tells every subscribed admin browser that a new order arrived. Never throws. */
export function notifyNewOrder(order: NewOrderNotificationInput): Promise<number> {
  return sendPushToAdmins(buildNewOrderPayload(order))
}
