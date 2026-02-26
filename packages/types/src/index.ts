// Shared TypeScript types for Immonext

// ----------------------------------------------------------------------------
// City
// ----------------------------------------------------------------------------

export type MarketTierType = 'A' | 'B' | 'C' | 'D';

export interface City {
  cityId: number;
  cityName: string;
  buildingShare: number;
  landShare: number;
  population: number;
  marketTier: MarketTierType;
  designation: string;
  createdAt: string;
  updatedAt: string;
}

export type CityInsert = Omit<City, 'cityId' | 'createdAt' | 'updatedAt'>;
export type CityUpdate = Partial<CityInsert>;

// ----------------------------------------------------------------------------
// Property
// ----------------------------------------------------------------------------

export enum PropertyCondition {
  InNeedOfRenovation = 'Sanierungsbedürftig',
  Standard = 'Standard',
  Upscale = 'Gehoben',
  Luxury = 'Luxus',
}

export enum PropertyTypeValues {
  Condominium = 'Eigentumswohnung',
  SingleFamilyHouse = 'Einfamilienhaus',
  MultiFamilyHouse = 'Mehrfamilienhaus',
  TimberConstruction = 'Holzbauweise',
  ListedBuildings = 'Denkmalgeschützte Gebäude',
}

export interface Property {
  propertyId: number;
  userId: string;
  cityId: number;
  propertyAbbreviation: string;
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  federalState: string;
  squareMeters: number;
  numberOfRooms: number;
  yearOfConstruction: number;
  energyEfficient: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PropertyInsert = Omit<Property, 'propertyId' | 'createdAt' | 'updatedAt'>;
export type PropertyUpdate = Partial<Omit<Property, 'propertyId' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface PropertyWithCity extends Property {
  cityRel: {
    cityId: number;
    cityName: string;
    metropolitanArea: string;
    buildingShare: number;
    landShare: number;
  };
}

// ----------------------------------------------------------------------------
// PersonalData
// ----------------------------------------------------------------------------

export interface PersonalData {
  userId: string;
  lastName: string;
  firstName: string;
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  phoneNumber?: string;
  emailAddress: string;
  taxIdentificationNumber: string;
  profilePicture?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type PersonalDataInsert = Omit<PersonalData, 'createdAt' | 'updatedAt'>;
export type PersonalDataUpdate = Partial<Omit<PersonalData, 'userId' | 'createdAt' | 'updatedAt'>>;

// ----------------------------------------------------------------------------
// Subscription
// ----------------------------------------------------------------------------

export interface Subscription {
  subscriptionId: number;
  userId: string;
  subscriptionModel: 'Basic' | 'Professional' | 'Enterprise';
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionInsert = Omit<Subscription, 'subscriptionId' | 'createdAt' | 'updatedAt'>;
export type SubscriptionUpdate = Partial<Omit<Subscription, 'subscriptionId' | 'userId' | 'createdAt' | 'updatedAt'>>;

// ----------------------------------------------------------------------------
// Password
// ----------------------------------------------------------------------------

export interface Password {
  passwordId: number;
  userId: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export type PasswordInsert = Omit<Password, 'passwordId' | 'createdAt' | 'updatedAt'>;
export type PasswordUpdate = Partial<Omit<Password, 'passwordId' | 'userId' | 'createdAt' | 'updatedAt'>>;

// ----------------------------------------------------------------------------
// ParkingSpace
// ----------------------------------------------------------------------------

export type ParkingSpaceType = 'GARAGE' | 'CARPORT' | 'OUTDOOR' | 'UNDERGROUND' | 'OTHER';

export interface ParkingSpace {
  parkingSpaceId: number;
  propertyId: number;
  parkingSpaceType: ParkingSpaceType | null;
  numberOfParkingSpaces: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ParkingSpaceInsert = Omit<ParkingSpace, 'parkingSpaceId' | 'createdAt' | 'updatedAt'>;
export type ParkingSpaceUpdate = Partial<Omit<ParkingSpace, 'parkingSpaceId' | 'createdAt' | 'updatedAt'>>;

// ----------------------------------------------------------------------------
// PropertyAcquisition
// ----------------------------------------------------------------------------

export interface PropertyAcquisition {
  propertyAcquisitionId: number;
  propertyId: number;
  houseCompletionYear: number;
  purchaseDate: string | null;
  transferDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PropertyAcquisitionInsert = Omit<PropertyAcquisition, 'propertyAcquisitionId' | 'createdAt' | 'updatedAt'>;
export type PropertyAcquisitionUpdate = Partial<Omit<PropertyAcquisition, 'propertyAcquisitionId' | 'createdAt' | 'updatedAt'>>;

// ----------------------------------------------------------------------------
// Tenancy
// ----------------------------------------------------------------------------

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

export interface Tenancy {
  tenancyId: number,
  maintenanceCostsId: number,
  parkingSpaceId: number,
  propertyId: number,
  isRented: boolean | null,
  tenancyStartDate: string | null,
  tenancyEndDate: string | null,
  tenancyType: TenancyTypeValues | null,
  tenancyUnits: number | null,
  tenancyUnitsPrice: number | null,
  parkingSpaceRent: number | null,
  miscRent: number | null,
  warmRent: number | null,
  coldRent: number | null,
  tenantFirstName: string,
  tenantLastName: string,
  deposit: number | null,
  createdAt: string,
  updatedAt: string
}

export type TenancyInsert = Omit<Tenancy, 'tenancyId' | 'createdAt' | 'updatedAt'>;
export type TenancyUpdate = Partial<Omit<Tenancy, 'tenancyId' | 'propertyId' | 'createdAt' | 'updatedAt'>>;

export enum DataEntryTypeValues {
  ImportFromRealEstatePortal = 'Aus Immobilienportal importieren',
  ManualEntry = 'Manuell erfassen',
  ExposeScan = 'Exposé einlesen',
}

// ----------------------------------------------------------------------------
// API Response types
// ----------------------------------------------------------------------------

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
