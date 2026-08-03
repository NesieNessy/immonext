export type StateCode =
  | 'BY' | 'BE' | 'HH' | 'HB' | 'SH' | 'MV' | 'BB' | 'ST'
  | 'TH' | 'SN' | 'NI' | 'NW' | 'HE' | 'RP' | 'SL' | 'BW';

export interface AcquisitionCostInput {
  purchasePrice: number;
  parkingPurchasePrice: number;
  brokerPercent: number;
  livingAreaM2?: number | null;
  postalCode?: string | null;
  notaryPercent: number;
  landRegistryPercent: number;
  propertyTransferTaxPercent?: number | null;
}

export interface AcquisitionCostComputed {
  purchasePricePerM2: number | null;
  brokerAmount: number;
  notaryAmount: number;
  landRegistryAmount: number;
  propertyTransferTaxAmount: number;
  totalAdditionalCosts: number;
  totalCosts: number;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseDecimalInput(value: string): number {
  const trimmed = value.trim().replace(/\s/g, '');
  let normalized: string;

  if (trimmed.includes(',')) {
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else {
    const dotParts = trimmed.split('.');
    const hasGermanThousandsGrouping = dotParts.length > 1
      && dotParts.slice(1).every((part) => /^\d{3}$/.test(part));
    normalized = hasGermanThousandsGrouping ? dotParts.join('') : trimmed;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDecimalInput(value: string, maximumFractionDigits = 2): string {
  if (!value.trim()) return '';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(parseDecimalInput(value));
}

export function resolveStateFromPostalCode(postalCode?: string | null): StateCode | null {
  if (!postalCode || !/^\d{5}$/.test(postalCode)) return null;
  const prefix = Number(postalCode.slice(0, 2));

  if (prefix >= 10 && prefix <= 14) return 'BE';
  if (prefix >= 20 && prefix <= 22) return 'HH';
  if (prefix === 27 || prefix === 28) return 'HB';
  if ((prefix >= 16 && prefix <= 19) || prefix === 14) return 'BB';
  if (prefix >= 23 && prefix <= 25) return 'SH';
  if (prefix >= 17 && prefix <= 19) return 'MV';
  if (prefix >= 26 && prefix <= 31) return 'NI';
  if (prefix >= 32 && prefix <= 33) return 'NW';
  if (prefix >= 34 && prefix <= 37) return 'HE';
  if (prefix >= 38 && prefix <= 39) return 'ST';
  if (prefix >= 40 && prefix <= 53) return 'NW';
  if (prefix >= 54 && prefix <= 56) return 'RP';
  if (prefix >= 57 && prefix <= 59) return 'NW';
  if (prefix >= 60 && prefix <= 65) return 'HE';
  if (prefix >= 66 && prefix <= 66) return 'SL';
  if (prefix >= 67 && prefix <= 69) return 'RP';
  if (prefix >= 70 && prefix <= 79) return 'BW';
  if (prefix >= 80 && prefix <= 97) return 'BY';
  if (prefix >= 98 && prefix <= 99) return 'TH';
  if (prefix >= 1 && prefix <= 4) return 'SN';

  return null;
}

export function computeAcquisitionCosts(input: AcquisitionCostInput): AcquisitionCostComputed {
  const purchasePrice = Math.max(0, input.purchasePrice || 0);
  const parkingPurchasePrice = Math.max(0, input.parkingPurchasePrice || 0);
  const base = purchasePrice + parkingPurchasePrice;
  const propertyTransferTaxPercent = input.propertyTransferTaxPercent ?? 0;

  const brokerAmount = roundCurrency(base * ((input.brokerPercent || 0) / 100));
  const notaryAmount = roundCurrency(base * ((input.notaryPercent || 0) / 100));
  const landRegistryAmount = roundCurrency(base * ((input.landRegistryPercent || 0) / 100));
  const propertyTransferTaxAmount = roundCurrency(base * (propertyTransferTaxPercent / 100));
  const totalAdditionalCosts = roundCurrency(
    brokerAmount + notaryAmount + landRegistryAmount + propertyTransferTaxAmount,
  );

  return {
    purchasePricePerM2:
      input.livingAreaM2 && input.livingAreaM2 > 0
        ? roundCurrency(purchasePrice / input.livingAreaM2)
        : null,
    brokerAmount,
    notaryAmount,
    landRegistryAmount,
    propertyTransferTaxAmount,
    totalAdditionalCosts,
    totalCosts: roundCurrency(base + totalAdditionalCosts),
  };
}
