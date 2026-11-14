import { afterEach, describe, expect, it, vi } from "vitest"
import { getBankTransferDetails } from "./bank-details"

afterEach(() => vi.unstubAllEnvs())

describe("getBankTransferDetails", () => {
  it("returns empty strings when nothing is configured", () => {
    for (const name of [
      "BANK_TRANSFER_BANK_NAME",
      "BANK_TRANSFER_ACCOUNT_HOLDER",
      "BANK_TRANSFER_ACCOUNT_NUMBER",
      "BANK_TRANSFER_ALIAS",
      "BANK_TRANSFER_NOTES",
    ]) {
      vi.stubEnv(name, undefined as unknown as string)
    }

    expect(getBankTransferDetails()).toEqual({
      bankName: "",
      accountHolder: "",
      accountNumber: "",
      alias: "",
      notes: "",
    })
  })

  it("reads every field from its BANK_TRANSFER_* variable", () => {
    vi.stubEnv("BANK_TRANSFER_BANK_NAME", "Banco Familiar")
    vi.stubEnv("BANK_TRANSFER_ACCOUNT_HOLDER", "RIDMO SA")
    vi.stubEnv("BANK_TRANSFER_ACCOUNT_NUMBER", "123-456")
    vi.stubEnv("BANK_TRANSFER_ALIAS", "ridmo.pay")
    vi.stubEnv("BANK_TRANSFER_NOTES", "Enviar comprobante")

    expect(getBankTransferDetails()).toEqual({
      bankName: "Banco Familiar",
      accountHolder: "RIDMO SA",
      accountNumber: "123-456",
      alias: "ridmo.pay",
      notes: "Enviar comprobante",
    })
  })

  it("reads the environment on every call (no stale cache)", () => {
    vi.stubEnv("BANK_TRANSFER_ALIAS", "uno")
    expect(getBankTransferDetails().alias).toBe("uno")

    vi.stubEnv("BANK_TRANSFER_ALIAS", "dos")
    expect(getBankTransferDetails().alias).toBe("dos")
  })
})
