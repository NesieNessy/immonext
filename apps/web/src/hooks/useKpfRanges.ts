import { getKpfRange, KpfRangeResult } from '@/lib/supabase/kpf_ranges.supabase';
import { calcKpf, calcPositionPct, yearToBucket } from '@/utils/kpf';
import type { PropertyCondition } from '@immonext/types';
import { useEffect, useState } from 'react';

interface KpfResult {
  kpf:          number | null;
  range:        KpfRangeResult | null;
  positionPct:  number | null;
  isLoading:    boolean;
  noData:       boolean;
}

export function useKpfResult(
  purchasePrice: number,
  coldRent: number,
  postalCode: string,
  condition: PropertyCondition | '',
  yearOfConstruction: number | null
): KpfResult {
  const [range, setRange]       = useState<KpfRangeResult | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [noData, setNoData]     = useState(false);

  // Live KPF — no async needed
  const kpf = calcKpf(purchasePrice, coldRent);

  // Range fetch — only when all three lookup inputs are valid
  const rangeInputsValid =
    /^\d{5}$/.test(postalCode) &&
    condition !== '' &&
    yearOfConstruction !== null;

  useEffect(() => {
    if (!rangeInputsValid || !condition) {
      setRange(null);
      setNoData(false);
      return;
    }

    const bucket = yearToBucket(yearOfConstruction!);

    // Debounce — wait 400ms after last keystroke on PLZ
    const timer = setTimeout(async () => {
      setLoading(true);
      setNoData(false);
      const result = await getKpfRange(postalCode, condition as PropertyCondition, bucket);
      setLoading(false);
      if (!result) {
        setNoData(true);
        setRange(null);
      } else {
        setRange(result);
        setNoData(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [postalCode, condition, yearOfConstruction, rangeInputsValid]);

  const positionPct =
    kpf !== null && range !== null
      ? calcPositionPct(kpf, range.minValue, range.maxValue)
      : null;

  return { kpf, range, positionPct, isLoading, noData };
}