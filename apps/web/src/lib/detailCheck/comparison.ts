import { roundCurrency } from './acquisitionCosts';
import { isDenseMarket } from './rentCalculator';

export type SubjectProperty = {
  address: string;
  streetHouseNumber: string;
  postalCode: string;
  city: string;
  purchasePrice: number;
  coldRent: number;
  livingAreaM2: number;
  yearOfConstruction: number;
  denseMarket: boolean;
  purchasePricePerM2: number;
  rentPerM2: number;
  purchasePriceRentQuotient: number;
};

export type ReferenceProperty = SubjectProperty & {
  id: string;
  similarityScore: number;
  deviationLabel: string;
};

export function buildSubjectProperty(args: {
  streetHouseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  purchasePrice?: number | null;
  coldRent?: number | null;
  livingAreaM2?: number | null;
  yearOfConstruction?: number | null;
}): SubjectProperty {
  const streetHouseNumber = args.streetHouseNumber ?? '';
  const postalCode = args.postalCode ?? '';
  const city = args.city ?? '';
  const purchasePrice = Number(args.purchasePrice ?? 0);
  const coldRent = Number(args.coldRent ?? 0);
  const livingAreaM2 = Number(args.livingAreaM2 ?? 0);
  const yearOfConstruction = Number(args.yearOfConstruction ?? 0);
  const purchasePricePerM2 = livingAreaM2 > 0 ? roundCurrency(purchasePrice / livingAreaM2) : 0;
  const rentPerM2 = livingAreaM2 > 0 ? roundCurrency(coldRent / livingAreaM2) : 0;
  const annualRent = coldRent * 12;
  const purchasePriceRentQuotient = annualRent > 0 ? roundCurrency(purchasePrice / annualRent) : 0;

  return {
    address: [streetHouseNumber, postalCode, city].filter(Boolean).join(', '),
    streetHouseNumber,
    postalCode,
    city,
    purchasePrice,
    coldRent,
    livingAreaM2,
    yearOfConstruction,
    denseMarket: isDenseMarket(city),
    purchasePricePerM2,
    rentPerM2,
    purchasePriceRentQuotient,
  };
}

function relativeDeviation(a: number, b: number): number {
  if (!a && !b) return 0;
  if (!a || !b) return 1;
  return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b));
}

export function scoreReference(subject: SubjectProperty, reference: SubjectProperty): number {
  const quotientDeviation = relativeDeviation(subject.purchasePriceRentQuotient, reference.purchasePriceRentQuotient);
  const rentDeviation = Math.abs(subject.coldRent - reference.coldRent) / 200;
  const areaDeviation = Math.abs(subject.livingAreaM2 - reference.livingAreaM2) / 10;
  const yearDeviation = Math.abs(subject.yearOfConstruction - reference.yearOfConstruction) / 5;
  const priceDeviation = relativeDeviation(subject.purchasePrice, reference.purchasePrice);
  return roundCurrency((quotientDeviation * 45) + (rentDeviation * 20) + (areaDeviation * 15) + (yearDeviation * 10) + (priceDeviation * 10));
}

export function deviationLabel(score: number): string {
  if (score <= 20) return 'Sehr ähnlich';
  if (score <= 45) return 'Ähnlich';
  return 'Abweichend';
}

export function referenceMatches(subject: SubjectProperty, reference: SubjectProperty): boolean {
  const locationMatch = subject.denseMarket
    ? reference.postalCode === subject.postalCode
    : reference.postalCode === subject.postalCode || reference.city.toLowerCase() === subject.city.toLowerCase();

  return (
    locationMatch &&
    Math.abs(reference.coldRent - subject.coldRent) <= 200 &&
    Math.abs(reference.livingAreaM2 - subject.livingAreaM2) <= 10 &&
    Math.abs(reference.yearOfConstruction - subject.yearOfConstruction) <= 5
  );
}
