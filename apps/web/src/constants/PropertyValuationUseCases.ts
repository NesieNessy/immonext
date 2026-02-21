export enum PropertyValuationUseCases {
  PropertyData = 'Objektdaten',
  AcquisitionCosts = 'Kaufkosten',
  LeasingOrRentals = 'Vermietung',
  Financing = 'Finanzierung',
  Depreciation = 'Abschreibung',
  Renovation = 'Sanierung',
  Calculator = 'Kalkulator',
  MacroLocation = 'Makrolage',
  Comparison = 'Vergleich',
  Result = 'Ergebnis',
}

export const PropertyValuationUseCasesIcons: Record<keyof typeof PropertyValuationUseCases, string> = {
  PropertyData: 'Database',
  AcquisitionCosts: 'Euro',
  LeasingOrRentals: 'UserRoundKey',
  Financing: 'Coins',
  Depreciation: 'TrendingDown',
  Renovation: 'Wrench',
  Calculator: 'Calculator',
  MacroLocation: 'MapPin',
  Comparison: 'BarChart',
  Result: 'CheckCircle',
};

export const PropertyValuationUseCasesPaths: Record<keyof typeof PropertyValuationUseCases, string> = {
  PropertyData: '/property-valuation/detail-check/property-data',
  AcquisitionCosts: '/property-valuation/detail-check/acquisition-costs',
  LeasingOrRentals: '/property-valuation/detail-check/leasing-or-rentals',
  Financing: '/property-valuation/detail-check/financing',
  Depreciation: '/property-valuation/detail-check/depreciation',
  Renovation: '/property-valuation/detail-check/renovation',
  Calculator: '/property-valuation/detail-check/calculator',
  MacroLocation: '/property-valuation/detail-check/macro-location',
  Comparison: '/property-valuation/detail-check/comparison',
  Result: '/property-valuation/detail-check/result',
};

export const PropertyValuationSteps = Object.entries(PropertyValuationUseCases).map(([key, label]) => ({
  label,
  path: PropertyValuationUseCasesPaths[key as keyof typeof PropertyValuationUseCases],
}));
