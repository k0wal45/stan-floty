"use client";

import { useCallback, useState } from "react";

/**
 * Hook managing grosz ↔ PLN display conversion for currency inputs.
 * Returns { groszValue, displayValue, handleChange, reset }.
 */
export function useGroszInput(initialGroszValue?: number) {
  const [groszValue, setGroszValue] = useState(
    initialGroszValue != null ? initialGroszValue.toString() : ""
  );
  const [displayValue, setDisplayValue] = useState(
    initialGroszValue != null ? (initialGroszValue / 100).toFixed(2) : ""
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setGroszValue("");
      setDisplayValue("");
      return;
    }
    const numericVal = parseInt(val, 10).toString();
    setGroszValue(numericVal);
    setDisplayValue((parseInt(numericVal, 10) / 100).toFixed(2));
  }, []);

  const reset = useCallback((grosz?: number) => {
    if (grosz != null) {
      setGroszValue(grosz.toString());
      setDisplayValue((grosz / 100).toFixed(2));
    } else {
      setGroszValue("");
      setDisplayValue("");
    }
  }, []);

  return { groszValue, displayValue, handleChange, reset } as const;
}