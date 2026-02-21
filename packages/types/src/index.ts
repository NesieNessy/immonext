// Shared TypeScript types for Immonext

export interface Property {
  id: string;
  address: string;
  propertyType: string;
  tenancyType: string;
  purchasePrice?: number;
  livingSpace?: number;
  yearBuilt?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyValuation {
  id: string;
  propertyId: string;
  userId: string;
  valuationType: 'quick-check' | 'detail-check';
  estimatedValue?: number;
  dataEntryType?: string;
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PropertyTypeValues {
  Condominium = 'Eigentumswohnung',
  SingleFamilyHouse = 'Einfamilienhaus',
  MultiFamilyHouse = 'Mehrfamilienhaus',
  TimberConstruction = 'Holzbauweise',
  ListedBuildings = 'Denkmalgeschützte Gebäude',
}

export enum TenancyTypeValues {
  Standard = 'Standard',
  IndexLinkedRent = 'Indexmiete',
  Usufruct = 'Nießbrauch',
  Leasehold = 'Erbpacht',
  SpecializedLeasing = 'Sondervermietung',
  Commercial = 'Gewerbe',
  NursingHome = 'Altenheim',
  ForeclosureSale = 'Zwangsversteigerung',
}

export enum DataEntryTypeValues {
  ImportFromRealEstatePortal = 'Aus Immobilienportal importieren',
  ManualEntry = 'Manuell erfassen',
  ExposeScan = 'Exposé einlesen',
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
