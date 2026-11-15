import Price from "../price"

type ProductSummaryProps = {
  name: string
  price: number
}

export default function ProductSummary({ name, price }: ProductSummaryProps) {
  return (
    <div>
      <h1 className="text-2xl font-medium text-neutral-900 sm:text-3xl md:text-4xl">{name}</h1>
      <div className="mt-4">
        <Price value={price} className="text-neutral-900" />
      </div>
    </div>
  )
}
