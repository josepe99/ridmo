"use client"

import { createContext, useContext, useEffect, useState } from "react";

export type Country = "AR" | "PY";

type CountryContextValue = {
  country: Country;
  setCountry: (c: Country) => void;
  currencyCode: string;
  currencySymbol: string;
  formatPrice: (price: number) => string;
  convertPrice: (price: number) => number;
};

const CountryContext = createContext<CountryContextValue | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState<Country>("AR");
  const [rate, setRate] = useState<number>(1);

  // Load stored country or autodetect
  useEffect(() => {
    const stored = localStorage.getItem("country") as Country | null;
    if (stored) {
      setCountry(stored);
    } else {
      // Simple IP-based detection
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data?.country_code === "PY") {
            setCountry("PY");
          } else {
            setCountry("AR");
          }
        })
        .catch(() => {
          setCountry("AR");
        });
    }
  }, []);

  // Persist country selection
  useEffect(() => {
    localStorage.setItem("country", country);
  }, [country]);

  // Fetch exchange rate PYG->ARS (base prices are in PYG)
  useEffect(() => {
    if (country === "AR") {
      fetch("https://open.er-api.com/v6/latest/PYG")
        .then(res => res.json())
        .then(data => {
          const r = data?.rates?.ARS;
          if (typeof r === "number") setRate(r);
        })
        .catch(() => {
          setRate(0.00025); // fallback approximate PYG->ARS
        });
    }
  }, [country]);

  const convertPrice = (price: number) => {
    // Base prices are in PYG; convert to ARS for Argentina
    return country === "AR" ? price * rate : price;
  };

  // Charm pricing rounding to attractive endings using consumer psychology
  const charmRound = (value: number) => {
    if (!isFinite(value)) return 0;
    const abs = Math.abs(value);
    let step = 1;
    let tail = 0;
    if (abs >= 1000) {
      step = 1000; tail = 990; // 12,990; 49,990
    } else if (abs >= 100) {
      step = 100; tail = 99;   // 199; 899
    } else if (abs >= 10) {
      step = 10; tail = 9;     // 19; 49
    } else {
      return Math.round(value); // tiny values
    }
    const base = (value - tail) / step;
    const floorAnchor = Math.floor(base) * step + tail;
    const ceilAnchor = Math.ceil(base) * step + tail;
    const downDiff = Math.abs(value - floorAnchor);
    const upDiff = Math.abs(ceilAnchor - value);
    const chosen = (downDiff <= upDiff ? floorAnchor : ceilAnchor);
    return chosen < 0 ? -Math.abs(chosen) : chosen;
  };

  const formatPrice = (price: number) => {
    const value = convertPrice(price);
    const charmed = charmRound(value);
    const currency = country === "AR" ? "ARS" : "PYG";
    return new Intl.NumberFormat(country === "AR" ? "es-AR" : "es-PY", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(charmed);
  };

  const value: CountryContextValue = {
    country,
    setCountry,
    currencyCode: country === "AR" ? "ARS" : "PYG",
    currencySymbol: country === "AR" ? "$" : "Gs",
    formatPrice,
    convertPrice,
  };

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}

