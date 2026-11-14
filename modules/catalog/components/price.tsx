import { formatGuaranies } from "@/shared/lib/currency";
import { cn } from "@/shared/lib/utils";

type PriceProps = {
  value: number;
  className?: string;
};

export default function Price({ value, className }: PriceProps) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return <span className={cn("font-display", className)}>{formatGuaranies(value)}</span>;
}
