import "server-only"

import nodemailer from "nodemailer"
import { buildOrderReceivedEmail, type OrderReceivedEmailInput } from "../domain/order-received-email"

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  from: string
}

/** SMTP configuration from the environment, or null when email is not configured. */
export function getSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  const host = env.SMTP_HOST
  const from = env.EMAIL_FROM
  if (!host || !from) return null
  const port = Number.parseInt(env.SMTP_PORT ?? "587", 10)
  return {
    host,
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
    user: env.SMTP_USER || undefined,
    pass: env.SMTP_PASSWORD || undefined,
    from,
  }
}

/**
 * Tells the customer that their order is being verified and an advisor will contact them.
 * Resolves true when the email was handed to the SMTP server. Never rejects: a broken mail
 * channel must not affect the order.
 */
export async function notifyCustomerOrderReceived(
  order: OrderReceivedEmailInput & { customerEmail: string | null }
): Promise<boolean> {
  try {
    if (!order.customerEmail) return false
    const config = getSmtpConfig()
    if (!config) {
      console.warn("[notifications] SMTP is not configured; order-received email skipped.")
      return false
    }

    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
    })
    const content = buildOrderReceivedEmail(order)
    await transport.sendMail({ from: config.from, to: order.customerEmail, ...content })
    return true
  } catch (error) {
    console.error("[notifications] Failed to send order-received email:", error)
    return false
  }
}
