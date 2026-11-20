import { formatMoney } from "@/shared/lib/currency"

/** Data needed to tell a customer that their order was received. */
export type OrderReceivedEmailInput = {
  orderNumber: string
  customerName: string
  total: number
  currency: string
}

export type EmailContent = { subject: string; text: string; html: string }

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** Email sent right after checkout: the order is being verified and an advisor will get in touch. */
export function buildOrderReceivedEmail(order: OrderReceivedEmailInput): EmailContent {
  const firstName = order.customerName.trim().split(/\s+/)[0] || ""
  const greeting = firstName ? `Hola ${firstName},` : "Hola,"
  const total = formatMoney(order.total, order.currency)
  const lines = [
    `Recibimos tu pedido ${order.orderNumber} por un total de ${total}.`,
    "Estamos verificando tu pedido y en unos momentos un asesor de RIDMO se pondrá en contacto con vos.",
    "¡Gracias por elegirnos!",
  ]

  return {
    subject: `Estamos verificando tu pedido ${order.orderNumber} · RIDMO`,
    text: [greeting, "", ...lines, "", "— Equipo RIDMO"].join("\n"),
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      ...lines.map((line) => `<p>${escapeHtml(line)}</p>`),
      "<p>— Equipo RIDMO</p>",
    ].join(""),
  }
}
