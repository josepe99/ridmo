import "server-only"

export type VapidConfig = {
  subject: string
  publicKey: string
  privateKey: string
}

/** VAPID configuration from the environment, or null when push is not configured. */
export function getVapidConfig(): VapidConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return null
  return { publicKey, privateKey, subject }
}

/** Public key the browser needs to subscribe, or null when push is not configured. */
export function getVapidPublicKey(): string | null {
  return getVapidConfig()?.publicKey ?? null
}
