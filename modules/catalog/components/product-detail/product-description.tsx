type ProductDescriptionProps = {
  description: string | null
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  if (!description) return null

  return (
    <div className="lg:col-start-1 lg:mt-12">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Descripción</p>
      <p className="mt-4 text-sm leading-7 text-neutral-600">{description}</p>
    </div>
  )
}
