export enum ExistingPropertiesUseCases {
  PropertyData = 'Objektdaten',
  RND = 'Restnutzungsdauer',
  SplitPurchasePrice = 'Kaufpreisaufteilung',
  TenantData = 'Mieterdaten',
  TenantHistory = 'Mieterhistorie',
  RentalTrends = 'Mietentwicklung',
  ServiceChargeSettlement = 'Nebenkostenabrechnung',
  Contractors = 'Handwerker',
  TaxDocuments = 'Steuerunterlagen',
  KeyMetrics = 'Kennzahlen',
  Sale = 'Verkauf',
  TenantMoveOut = 'Mieterauszug',
}

export const ExistingPropertiesUseCasesIcons: Record<keyof typeof ExistingPropertiesUseCases, string> = {
  PropertyData: 'Database',
  RND: 'Clock',
  SplitPurchasePrice: 'PieChart',
  TenantData: 'Users',
  TenantHistory: 'History',
  RentalTrends: 'TrendingUp',
  ServiceChargeSettlement: 'Receipt',
  Contractors: 'Wrench',
  TaxDocuments: 'Coins',
  KeyMetrics: 'BarChart3',
  Sale: 'ShoppingCart',
  TenantMoveOut: 'DoorOpen',
};
