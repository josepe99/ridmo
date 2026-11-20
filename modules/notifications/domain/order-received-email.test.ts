import { describe, expect, it } from "vitest"
import { buildOrderReceivedEmail } from "./order-received-email"

const order = { orderNumber: "RID-000007", customerName: "Ana Perez", total: 150000, currency: "PYG" }

describe("buildOrderReceivedEmail", () => {
  it("says the order is being verified and an advisor will make contact", () => {
    const email = buildOrderReceivedEmail(order)

    expect(email.subject).toContain("RID-000007")
    expect(email.text).toContain("Hola Ana,")
    expect(email.text).toContain("Estamos verificando tu pedido")
    expect(email.text).toContain("asesor de RIDMO")
    expect(email.html).toContain("asesor de RIDMO")
  })

  it("escapes the customer's name in the HTML body", () => {
    const email = buildOrderReceivedEmail({ ...order, customerName: "<b>Ana</b>" })

    expect(email.html).not.toContain("<b>")
  })

  it("greets without a name when it is empty", () => {
    expect(buildOrderReceivedEmail({ ...order, customerName: " " }).text).toMatch(/^Hola,/)
  })
})
