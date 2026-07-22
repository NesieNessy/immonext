// Shared TypeScript types for Immonext

// ----------------------------------------------------------------------------
// City
// ----------------------------------------------------------------------------

export type MarketTierType = 'A' | 'B' | 'C' | 'D';

export enum Designation {
  Barbarossastadt = "Barbarossastadt",
  Barlachstadt = "Barlachstadt",
  BergUndUniversitaetsstadt = "Berg- und Universitätsstadt",
  Bergringstadt = "Bergringstadt",
  Bernsteinstadt = "Bernsteinstadt",
  Blumenstadt = "Blumenstadt",
  Bluetenstadt = "Blütenstadt",
  BruederGrimmStadt = "Brüder-Grimm-Stadt",
  Buechnerstadt = "Büchnerstadt",
  DieMaehdrescherstadt = "Die Mähdrescherstadt",
  DomUndKaiserstadt = "Dom- und Kaiserstadt",
  Einhardstadt = "Einhardstadt",
  FreieUndHansestadt = "Freie und Hansestadt",
  FriedrichLudwigWeidigStadt = "Friedrich-Ludwig-Weidig-Stadt",
  FundortDesNeanderthalers = "Fundort des Neanderthalers",
  Gkst = "GKSt",
  Glockenstadt = "Glockenstadt",
  Goethestadt = "Goethestadt",
  HansStadenStadt = "Hans-Staden-Stadt",
  HanseUndUniversitaetsstadt = "Hanse- und Universitätsstadt",
  Hansestadt = "Hansestadt",
  HansestadtAnDerRuhr = "Hansestadt an der Ruhr",
  Hochschulstadt = "Hochschulstadt",
  Inselstadt = "Inselstadt",
  Karolingerstadt = "Karolingerstadt",
  Klingenstadt = "Klingenstadt",
  Kolpingstadt = "Kolpingstadt",
  Konfirmationsstadt = "Konfirmationsstadt",
  KonradZuseStadt = "Konrad-Zuse-Stadt",
  KreisUndHochschulstadt = "Kreis- und  Hochschulstadt",
  Kreisstadt = "Kreisstadt",
  Kupferstadt = "Kupferstadt",
  Kurort = "Kurort",
  Landeshauptstadt = "Landeshauptstadt",
  Liebenbachstadt = "Liebenbachstadt",
  Loreleystadt = "Loreleystadt",
  Lutherstadt = "Lutherstadt",
  Muenchhausenstadt = "Münchhausenstadt",
  Nationalparkstadt = "Nationalparkstadt",
  Oranienstadt = "Oranienstadt",
  Orgelstadt = "Orgelstadt",
  Ostseebad = "Ostseebad",
  Peenestadt = "Peenestadt",
  PhilippSoldanStadt = "Philipp-Soldan-Stadt",
  Reformationsstadt = "Reformationsstadt",
  Residenzstadt = "Residenzstadt",
  Reuterstadt = "Reuterstadt",
  Schliemannstadt = "Schliemannstadt",
  SchlossStadt = "Schloss-Stadt",
  Schoefferstadt = "Schöfferstadt",
  Seebad = "Seebad",
  Sickingenstadt = "Sickingenstadt",
  Solestadt = "Solestadt",
  St = "St",
  Stadt = "Stadt",
  StadtBAWoda = "Stadt / Běła Woda",
  StadtAufDerHoehe = "Stadt auf der Höhe",
  StadtDerBurgmannshoefe = "Stadt der Burgmannshöfe",
  StadtDerFernuniversitaet = "Stadt der FernUniversität",
  StadtDerKluterthoehle = "Stadt der Kluterthöhle",
  StadtDerOsterraeder = "Stadt der Osterräder",
  UniversitaetsUndHansestadt = "Universitäts- und Hansestadt",
  Universitaetsstadt = "Universitätsstadt",
  VierToreStadt = "Vier-Tore-Stadt",
  Warbelstadt = "Warbelstadt",
  Welterbestadt = "Welterbestadt",
  Widukindstadt = "Widukindstadt",
  Windmuehlenstadt = "Windmühlenstadt",
  Wissenschaftsstadt = "Wissenschaftsstadt",
  DocumentaStadt = "documenta-Stadt",
}

export interface City {
  cityId: number;
  cityName: string;
  buildingShare: number;
  landShare: number;
  population: number;
  marketTier: MarketTierType;
  designation: Designation;
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

export enum EnergyEfficient {
  APlus = 'A+',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
}

export interface Property {
  propertyId: number;
  userId: string;
  cityId: number | null;
  propertyAbbreviation: string | null;
  street: string;
  houseNumber: string;
  yearOfConstruction: number;
  energyEfficient: EnergyEfficient | null;
  imageUrl: string | null;
  city: string;
  postalCode: string;
  federalState: string;
  squareMeters: number;
  numberOfRooms: number | null;
  /** Objekttyp, e.g. EIGENTUMSWOHNUNG — free text, no DB enum. */
  propertyCategory: string | null;
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
  houseCompletionYear: number | null;
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
// AcquisitionCosts
// ----------------------------------------------------------------------------

export interface AcquisitionCosts {
  acquisitionCostsId: number;
  propertyId: number;
  parkingSpaceId: number | null;
  propertyPurchasePrice: number;
  pricePerSqm: number | null;
  broker: number | null;
  brokerValue: number | null;
  notary: number | null;
  notaryValue: number | null;
  landRegistry: number | null;
  landRegistryValue: number | null;
  realEstateTax: number | null;
  realEstateTaxValue: number | null;
  adjustmentVariable: number | null;
  adjustmentVariableValue: number | null;
  totalAncillaryCostsValue: number | null;
  totalAncillaryCosts: number | null;
  parkingSpacePurchasePrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export type AcquisitionCostsInsert = Omit<AcquisitionCosts, 'acquisitionCostsId' | 'createdAt' | 'updatedAt'>;
export type AcquisitionCostsUpdate = Partial<Omit<AcquisitionCosts, 'acquisitionCostsId' | 'propertyId' | 'createdAt' | 'updatedAt'>>;

// ----------------------------------------------------------------------------
// MaintenanceCosts
// ----------------------------------------------------------------------------

export interface MaintenanceCosts {
  maintenanceCostsId: number;
  propertyId: number;
  costBreakdown: boolean;
  allocableCosts: number | null;
  nonAllocableCosts: number | null;
  totalCosts: number | null;
  houseMoney: number | null;
  allocableCostsProjection: boolean;
  nonAllocableCostsProjection: boolean;
  totalCostsProjection: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceCostsInsert = Omit<MaintenanceCosts, 'maintenanceCostsId' | 'createdAt' | 'updatedAt'>;
export type MaintenanceCostsUpdate = Partial<Omit<MaintenanceCosts, 'maintenanceCostsId' | 'propertyId' | 'createdAt' | 'updatedAt'>>;

// ----------------------------------------------------------------------------
// Financing
// ----------------------------------------------------------------------------

export interface Financing {
  financingId: number;
  propertyId: number;
  numberOfLoans: number;
  weightedLoanAmount: number | null;
  weightedEquity: number | null;
  weightedInterestRate: number | null;
  weightedRepaymentRate: number | null;
  weightedMonthlyDebtService: number | null;
  singleLoanAmount: number | null;
  singleEquity: number | null;
  singleInterestRate: number | null;
  singleRepaymentRate: number | null;
  singleMonthlyDebtService: number | null;
  singleRepaymentStartDate: string | null;
  fixedInterestPeriod: number | null;
  interestRate: number | null;
  regularInterestRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export type FinancingInsert = Omit<Financing, 'financingId' | 'createdAt' | 'updatedAt'>;
export type FinancingUpdate = Partial<Omit<Financing, 'financingId' | 'propertyId' | 'createdAt' | 'updatedAt'>>;

export interface FinancingCalculation {
  financingCalculationId: number;
  financingId: number;
  month: number;
  monthlyDebtService: number | null;
  singleMonthlyDebtService: number | null;
  interestPortion: number | null;
  repaymentPortion: number | null;
  remainingDebt: number | null;
  repaymentYear: number | null;
  repaymentMonth: number | null;
  createdAt: string;
}

export type FinancingCalculationInsert = Omit<FinancingCalculation, 'financingCalculationId' | 'createdAt'>;

export interface InterestCalculation {
  interestCalculationId: number;
  financingId: number;
  modificationVariable: number | null;
  fixedInterestPeriod: number | null;
  fixedInterestPeriodPercent: number | null;
  estimatedInterestRate: number | null;
  loanToValueEquityShare: number | null;
  equityThresholds: number | null;
  equityThresholdsCorridor: number | null;
  equityThresholdsPercent: number | null;
  createdAt: string;
  updatedAt: string;
}

export type InterestCalculationInsert = Omit<InterestCalculation, 'interestCalculationId' | 'createdAt' | 'updatedAt'>;
export type InterestCalculationUpdate = Partial<Omit<InterestCalculation, 'interestCalculationId' | 'financingId' | 'createdAt' | 'updatedAt'>>;

// ----------------------------------------------------------------------------
// RentIndex / BuildingProportion / Depreciation / MetricsToday
// ----------------------------------------------------------------------------

export interface RentIndex {
  rentIndexId: number;
  cityId: number;
  validFrom: string;
  validUntil: string | null;
  methodology: 'QUALIFIED' | 'SIMPLE' | 'EMPIRICAL';
  referenceRents: number;
  createdAt: string;
  updatedAt: string;
}

export type RentIndexInsert = Omit<RentIndex, 'rentIndexId' | 'createdAt' | 'updatedAt'>;
export type RentIndexUpdate = Partial<Omit<RentIndex, 'rentIndexId' | 'cityId' | 'createdAt' | 'updatedAt'>>;

export type KpfConstructionYearBucket =
  | '<1918'
  | '1918-1949'
  | '1950-1959'
  | '1960-1969'
  | '1970-1979'
  | '1980-1989'
  | '1990-1999'
  | '2000-2009'
  | '2010-2014'
  | '2015+';

export interface KpfRange {
  postalCode:              string;
  condition:               PropertyCondition;
  constructionYearBucket:  KpfConstructionYearBucket;
  minValue:                number;
  maxValue:                number;
  sampleSize:              number;
}

export type KpfRangeInsert = KpfRange;
export type KpfRangeFilters = Partial<Pick<KpfRange, 'postalCode' | 'condition' | 'constructionYearBucket'>>;

export interface BuildingProportion {
  buildingProportionId: number;
  propertyId: number;
  acquisitionCostsId: number | null;
  totalArea: number | null;
  totalAreaShare: number | null;
  landValue: number | null;
  landAndSoil: number | null;
  buildingFactor: number | null;
  buildingValue: number | null;
  numerator: number | null;
  denominator: number | null;
  ancillaryCostShare: number | null;
  buildingDepreciation: number | null;
  createdAt: string;
  updatedAt: string;
}

export type BuildingProportionInsert = Omit<BuildingProportion, 'buildingProportionId' | 'createdAt' | 'updatedAt'>;
export type BuildingProportionUpdate = Partial<Omit<BuildingProportion, 'buildingProportionId' | 'propertyId' | 'createdAt' | 'updatedAt'>>;

export interface Depreciation {
  depreciationId: number;
  propertyId: number;
  configId: number | null;
  depreciationType: string | null;
  depreciationCalculation: number | null;
  depreciationYear: number | null;
  residentialType: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED' | null;
  roofRenewal: number | null;
  windowsExteriorDoors: number | null;
  pipingSystems: number | null;
  heatingSystem: number | null;
  exteriorWallInsulation: number | null;
  bathrooms: number | null;
  interiorFitting: number | null;
  floorplanImprovement: number | null;
  modernisationPoints: number | null;
  age: number | null;
  totalUsefulLife: number | null;
  remainingUsefulLifeYears: number | null;
  depreciationRatePercent: number | null;
  createdAt: string;
  updatedAt: string;
}

export type DepreciationInsert = Omit<Depreciation, 'depreciationId' | 'createdAt' | 'updatedAt'>;
export type DepreciationUpdate = Partial<Omit<Depreciation, 'depreciationId' | 'propertyId' | 'createdAt' | 'updatedAt'>>;

export interface MetricsToday {
  userId: string;
  propertyId: number;
  tenancyId: number | null;
  coldRent: number | null;
  warmRent: number | null;
  isRented: boolean | null;
  maintenanceCostsId: number | null;
  maintenanceTotalCosts: number | null;
  allocableCosts: number | null;
  nonAllocableCosts: number | null;
  financingId: number | null;
  monthlyDebtService: number | null;
  interestRate: number | null;
  depreciationId: number | null;
  depreciationRatePercent: number | null;
  remainingUsefulLifeYears: number | null;
  developmentId: number | null;
}

// ----------------------------------------------------------------------------
// DevelopmentTomorrow / Renovation / LegalRequirements / SystemConfig / Notification
// ----------------------------------------------------------------------------

export interface DevelopmentTomorrow {
  developmentTomorrowId: number;
  propertyId: number;
  tenancyId: number | null;
  cityId: number | null;
  legalRequirementsId: number | null;
  rentIndexId: number | null;
  financingId: number | null;
  developmentYear: number | null;
  yearStart: number | null;
  dateStart: number | null;
  metropolitanArea: boolean | null;
  coldRentIncrease: number | null;
  coldRentIncreaseEligible: boolean | null;
  coldRentIncreaseLockPeriod: number | null;
  coldRentIncreaseReminder: boolean | null;
  coldRentIncreasePercent: number | null;
  coldRentIncrease3YearAveragePercent: number | null;
  lastRentIncrease: number | null;
  lastRentIncreaseRelevance: boolean | null;
  lastRentIncreaseValue: number | null;
  lastRentIncreasePercent: number | null;
  createdAt: string;
  updatedAt: string;
}

export type DevelopmentTomorrowInsert = Omit<DevelopmentTomorrow, 'developmentTomorrowId' | 'createdAt' | 'updatedAt'>;
export type DevelopmentTomorrowUpdate = Partial<Omit<DevelopmentTomorrow, 'developmentTomorrowId' | 'propertyId' | 'createdAt' | 'updatedAt'>>;

export interface DevelopmentTomorrowMetrics {
  metricsId: number;
  developmentTomorrowId: number;
  sqmPriceWithRi: number | null;
  sqmPriceWithoutRi: number | null;
  totalRentWithRi: number | null;
  totalRentWithoutRi: number | null;
  debtServiceDiffWithRi: number | null;
  debtServiceDiffWithoutRi: number | null;
  netRentYieldPreTaxWithRi: number | null;
  netRentYieldPreTaxWithoutRi: number | null;
  netRentYieldAfterTaxWithRi: number | null;
  netRentYieldAfterTaxWithoutRi: number | null;
  operativeCashflowWithRi: number | null;
  operativeCashflowWithoutRi: number | null;
  afterTaxCashflowWithRi: number | null;
  afterTaxCashflowWithoutRi: number | null;
  computedAt: string;
}

export type DevelopmentTomorrowMetricsInsert = Omit<DevelopmentTomorrowMetrics, 'metricsId'>;

export interface Renovation {
  renovationId: number;
  propertyId: number;
  legalRequirementsId: number | null;
  modernisationProperty: string | null;
  modernisationDate: string | null;
  modernisationValue: number | null;
  limit15Percent: number | null;
  threeYearValue: number | null;
  lastModernisation: string | null;
  lastModernisationRelevance: string | null;
  lastModernisationValue: number | null;
  lastModernisationPercent: number | null;
  purchaseDepreciation: number | null;
  createdAt: string;
  updatedAt: string;
}

export type RenovationInsert = Omit<Renovation, 'renovationId' | 'createdAt' | 'updatedAt'>;
export type RenovationUpdate = Partial<Omit<Renovation, 'renovationId' | 'propertyId' | 'createdAt' | 'updatedAt'>>;

export interface LegalRequirements {
  legalRequirementsId: number;
  cityId: number;
  rentCapLimit: number | null;
  sqmIncreaseLow: number | null;
  sqmIncreaseHigh: number | null;
  renovationLimitPercent: number | null;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LegalRequirementsInsert = Omit<LegalRequirements, 'legalRequirementsId' | 'createdAt' | 'updatedAt'>;
export type LegalRequirementsUpdate = Partial<Omit<LegalRequirements, 'legalRequirementsId' | 'cityId' | 'createdAt' | 'updatedAt'>>;

export interface SystemConfig {
  configId: number;
  configKey: string;
  configValue: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SystemConfigUpdate = Partial<Pick<SystemConfig, 'configValue' | 'description'>>;

export interface Notification {
  notificationId: number;
  userId: string;
  propertyId: number | null;
  type: 'INFO' | 'WARNING' | 'ACTION';
  message: string;
  tradesperson: string | null;
  financialBroker: string | null;
  readAt: string | null;
  createdAt: string;
}

export type NotificationInsert = Omit<Notification, 'notificationId' | 'createdAt'>;

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
