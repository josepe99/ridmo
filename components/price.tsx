"use client"

import { useMemo } from "react";
import { useCountry } from "@/context/country-context";

type UIPrice = {
  precio_final_texto: string;
  precio_anterior_texto?: string | null;
  descuento_porcentaje?: number | null;
  cuotas?: { habilitadas: boolean; mensual_texto?: string; total_texto?: string } | null;
  badges?: string[] | null;
  tokens_ui: {
    currency: string;
    major: string;
    minor?: string | null;
    separador_miles?: string;
    separador_decimales?: string;
    sr_text?: string;
  };
  contexto: "listing" | "pdp" | "checkout";
};

type PriceProps =
  | { ui: UIPrice; value?: never; className?: string }
  | { value: number; className?: string; ui?: never };

export default function Price(props: PriceProps) {
  const { currencySymbol, convertPrice, formatPrice } = useCountry();

  // Derive a UI model when only numeric value is provided (backward compatible usage)
  const ui: UIPrice = useMemo(() => {
    if ("ui" in props && props.ui) return props.ui;
    const raw = (props as { value: number }).value;
    // Use context formatter to ensure charm pricing and correct locale per country
    const formattedDisplay = formatPrice(raw);
    const major = formattedDisplay
      .replace(currencySymbol, "")
      .replace(/\u00A0/g, " ")
      .trim();

    return {
      precio_final_texto: `${currencySymbol}${major}`,
      precio_anterior_texto: null,
      descuento_porcentaje: null,
      cuotas: null,
      badges: null,
      tokens_ui: {
        currency: currencySymbol,
        major,
        minor: null,
        sr_text: `Precio: ${currencySymbol}${major}.`,
      },
      contexto: "listing",
    } satisfies UIPrice;
  }, [props, currencySymbol, convertPrice, formatPrice]);

  const className = ("className" in props ? props.className : undefined) || "";

  const hasDiscount = Boolean(
    ui.precio_anterior_texto &&
      typeof ui.descuento_porcentaje === "number" &&
      ui.descuento_porcentaje > 0
  );

  const isLong = (ui.tokens_ui?.major?.replace(/\D/g, "") || "").length >= 5;

  // Render the accessible, responsive block with scoped CSS inside
  return (
    <section
      className={`price${className ? " " + className : ""}`}
      data-context={ui.contexto}
      data-long={isLong ? "true" : "false"}
      aria-label="Precio"
    >
      <style>{`
        .price{display:inline-flex;flex-direction:column;gap:.35rem;font-variant-numeric:tabular-nums lining-nums}
        .price__row{display:flex;align-items:baseline;gap:.35rem;flex-wrap:wrap}
        .price__lead{display:inline-flex;align-items:baseline;gap:.15rem;line-height:1}
        .price__currency{font-size:.75em;opacity:.9}
        .price__major{font-size:clamp(1.4rem,2.2vw,2.4rem);font-weight:700;letter-spacing:-0.01em}
        .price__minor{font-size:.62em;vertical-align:super;line-height:0}
        .price__compare{opacity:.6;text-decoration:line-through}
        .price__badge{display:inline-block;font-size:.72em;padding:.15em .45em;border:1px solid currentColor;border-radius:4px}
        .price__installments{font-size:.9rem;opacity:.95}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        /* Ajuste si el entero es muy largo */
        .price[data-long="true"] .price__major{font-size:clamp(1.2rem,1.8vw,2.0rem)}
        /* Variantes por contexto */
        .price[data-context="listing"] .price__installments{display:none}
        .price[data-context="checkout"] .price__badge{display:none}
      `}</style>

      {ui.tokens_ui?.sr_text ? (
        <span className="sr-only">{ui.tokens_ui.sr_text}</span>
      ) : null}

      <div className="price__row">
        <div className="price__lead">
          <span className="price__currency">{ui.tokens_ui.currency}</span>
          <span className="price__major" data-digits={ui.tokens_ui.major?.length || 0}>
            {ui.tokens_ui.major}
          </span>
          {ui.tokens_ui.minor ? (
            <span className="price__minor">{ui.tokens_ui.minor}</span>
          ) : null}
        </div>

        {hasDiscount && ui.precio_anterior_texto ? (
          <del className="price__compare">{ui.precio_anterior_texto}</del>
        ) : null}

        {hasDiscount && typeof ui.descuento_porcentaje === "number" ? (
          <span className="price__badge">-{ui.descuento_porcentaje}%</span>
        ) : null}

        {(ui.badges || [])?.map((b, i) => (
          <span key={i} className="price__badge">{b}</span>
        ))}
      </div>

      {ui.cuotas?.habilitadas ? (
        <div className="price__installments">
          {ui.cuotas.mensual_texto}
          {ui.cuotas.mensual_texto && ui.cuotas.total_texto ? " • " : ""}
          {ui.cuotas.total_texto}
        </div>
      ) : null}
    </section>
  );
}

