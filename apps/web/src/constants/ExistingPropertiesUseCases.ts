export enum ExistingPropertiesUseCases {
  PropertyData = 'Objektdaten',
  RND = 'Restnutzungsdauer',
  SplitPurchasePrice = 'Kaufpreisaufteilung',
  TenantData = 'Mieterdaten',
  TenantHistory = 'Mieterhistorie',
  TenancyTrends = 'Mietentwicklung',
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
  TenancyTrends: 'TrendingUp',
  ServiceChargeSettlement: 'Receipt',
  Contractors: 'Wrench',
  TaxDocuments: 'Landmark',
  KeyMetrics: 'BarChart3',
  Sale: 'ShoppingCart',
  TenantMoveOut: 'DoorOpen',
};
