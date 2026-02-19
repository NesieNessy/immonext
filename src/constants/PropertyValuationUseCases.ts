export enum ExistingPropertiesUseCases {
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

export const ExistingPropertiesUseCasesIcons: Record<keyof typeof ExistingPropertiesUseCases, string> = {
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
