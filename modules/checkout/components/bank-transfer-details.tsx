import type { BankTransferDetails } from "../services/bank-details"
import { EYEBROW } from "./step-heading"

function BankRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-200 py-4 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className={EYEBROW}>{label}</dt>
      <dd className="break-all text-base text-neutral-900 sm:text-right">{value}</dd>
    </div>
  )
}

/** Bank account rows (or a fallback message when the business has not configured them) plus notes. */
export function BankTransferDetailsList({ bank }: { bank: BankTransferDetails }) {
  const hasBankDetails = Boolean(bank.bankName || bank.accountNumber || bank.alias || bank.accountHolder)

  return (
    <>
      {hasBankDetails ? (
        <dl className="mt-6 border-t border-neutral-200">
          <BankRow label="Banco" value={bank.bankName} />
          <BankRow label="Titular" value={bank.accountHolder} />
          <BankRow label="Cuenta" value={bank.accountNumber} />
          <BankRow label="Alias / ID" value={bank.alias} />
        </dl>
      ) : (
        <p className="mt-6 border-t border-neutral-200 pt-6 text-sm text-neutral-900">
          Te enviaremos los datos bancarios por WhatsApp o Instagram en breve.
        </p>
      )}
      {bank.notes ? <p className="mt-4 text-sm leading-6 text-neutral-500">{bank.notes}</p> : null}
    </>
  )
}
