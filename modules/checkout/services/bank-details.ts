import "server-only"

export type BankTransferDetails = {
  bankName: string
  accountHolder: string
  accountNumber: string
  alias: string
  notes: string
}

/**
 * Bank-transfer instructions shown on the order confirmation page.
 * Read from `BANK_TRANSFER_*` env vars on the server only; empty strings when unset.
 */
export function getBankTransferDetails(): BankTransferDetails {
  return {
    bankName: process.env.BANK_TRANSFER_BANK_NAME ?? "",
    accountHolder: process.env.BANK_TRANSFER_ACCOUNT_HOLDER ?? "",
    accountNumber: process.env.BANK_TRANSFER_ACCOUNT_NUMBER ?? "",
    alias: process.env.BANK_TRANSFER_ALIAS ?? "",
    notes: process.env.BANK_TRANSFER_NOTES ?? "",
  }
}
