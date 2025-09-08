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

  // Fetch exchange rate ARS->PYG
  useEffect(() => {
    if (country === "PY") {
      fetch("https://open.er-api.com/v6/latest/ARS")
        .then(res => res.json())
        .then(data => {
          const r = data?.rates?.PYG;
          if (typeof r === "number") setRate(r);
        })
        .catch(() => {
          setRate(1000); // fallback
        });
    }
  }, [country]);

  const convertPrice = (price: number) => {
    return country === "PY" ? price * rate : price;
  };

  const formatPrice = (price: number) => {
    const value = convertPrice(price);
    const currency = country === "PY" ? "PYG" : "ARS";
    return new Intl.NumberFormat(country === "PY" ? "es-PY" : "es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const value: CountryContextValue = {
    country,
    setCountry,
    currencyCode: country === "PY" ? "PYG" : "ARS",
    currencySymbol: country === "PY" ? "Gs" : "$",
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

