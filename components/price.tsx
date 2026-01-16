type PriceProps = {
  value: number;
  className?: string;
};

const priceFormatter = new Intl.NumberFormat("es-PY", {
  maximumFractionDigits: 0,
});

export default function Price({ value, className }: PriceProps) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const formatted = priceFormatter.format(value);

  return <span className={className}>Gs. {formatted}</span>;
}
