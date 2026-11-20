import { beforeEach, describe, expect, it, vi } from "vitest"

const sendMail = vi.fn()
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn(() => ({ sendMail })) } }))

import { getSmtpConfig, notifyCustomerOrderReceived } from "./send-email"

const order = {
  orderNumber: "RID-000007",
  customerName: "Ana Perez",
  customerEmail: "ana@example.com",
  total: 150000,
  currency: "PYG",
}

beforeEach(() => {
  sendMail.mockReset().mockResolvedValue({})
  vi.unstubAllEnvs()
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("getSmtpConfig", () => {
  it("is null without host and sender", () => {
    expect(getSmtpConfig({})).toBeNull()
    expect(getSmtpConfig({ SMTP_HOST: "smtp.test" })).toBeNull()
  })

  it("defaults to port 587 and implicit TLS only on 465", () => {
    expect(getSmtpConfig({ SMTP_HOST: "h", EMAIL_FROM: "a@b.co" })).toMatchObject({ port: 587, secure: false })
    expect(getSmtpConfig({ SMTP_HOST: "h", EMAIL_FROM: "a@b.co", SMTP_PORT: "465" })).toMatchObject({ secure: true })
  })
})

describe("notifyCustomerOrderReceived", () => {
  it("sends the email to the customer when SMTP is configured", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.test")
    vi.stubEnv("EMAIL_FROM", "RIDMO <pedidos@ridmo.test>")

    await expect(notifyCustomerOrderReceived(order)).resolves.toBe(true)

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ana@example.com", from: "RIDMO <pedidos@ridmo.test>" })
    )
  })

  it("skips quietly when SMTP is not configured", async () => {
    await expect(notifyCustomerOrderReceived(order)).resolves.toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it("skips when the order has no email", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.test")
    vi.stubEnv("EMAIL_FROM", "a@b.co")
    await expect(notifyCustomerOrderReceived({ ...order, customerEmail: null })).resolves.toBe(false)
  })

  it("never rejects when the mail server fails", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.test")
    vi.stubEnv("EMAIL_FROM", "a@b.co")
    sendMail.mockRejectedValue(new Error("smtp down"))

    await expect(notifyCustomerOrderReceived(order)).resolves.toBe(false)
  })
})
