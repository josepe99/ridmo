"use client"

import { useCountry } from "@/context/country-context";

export default function Price({ value, className }: { value: number; className?: string }) {
  const { formatPrice } = useCountry();
  return <span className={className}>{formatPrice(value)}</span>;
}

