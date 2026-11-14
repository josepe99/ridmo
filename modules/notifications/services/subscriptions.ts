import "server-only"

import { prisma } from "@/shared/lib/prisma"

export type StoredPushSubscription = {
  endpoint: string
  p256dh: string
  auth: string
}

/** Stores (or refreshes) the Web Push subscription of an admin browser. */
export async function saveSubscription(userId: string, subscription: StoredPushSubscription) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { ...subscription, userId },
    update: { p256dh: subscription.p256dh, auth: subscription.auth, userId },
  })
}

export async function listSubscriptions(): Promise<StoredPushSubscription[]> {
  return prisma.pushSubscription.findMany({
    select: { endpoint: true, p256dh: true, auth: true },
  })
}

/** Drops a subscription the push service reported as expired. */
export async function removeSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
}
