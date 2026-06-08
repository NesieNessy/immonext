import { computeAcquisitionCosts, roundCurrency } from './acquisitionCosts';

export type FinancingVariant = 'OFFER' | 'INDIVIDUAL';
export type InterestPeriodYears = 10 | 15 | 20;

export type FinancingInputs = {
  purchasePrice: number;
  parkingPrice: number;
  additionalCosts: number;
  renovationCosts: number;
  equity: number;
  interestPeriodYears: InterestPeriodYears;
  repaymentRate?: number;
  interestAdjustmentFactor?: number;
};

export type FinancingComputed = {
  totalCosts: number;
  loanAmount: number;
  loanToCostPercent: number;
  interestRate: number;
  monthlyDebtService: number;
};

export const INTEREST_RATES: Record<InterestPeriodYears, number> = {
  10: 3.4,
  15: 3.9,
  20: 4.2,
};

export function estimateInterestRate(
  years: InterestPeriodYears,
  adjustmentFactor = 1,
): number {
  return roundCurrency(INTEREST_RATES[years] * adjustmentFactor);
}

export function computeFinancing(input: FinancingInputs): FinancingComputed {
  const totalCosts = roundCurrency(
    Math.max(0, input.purchasePrice) +
    Math.max(0, input.parkingPrice) +
    Math.max(0, input.additionalCosts) +
    Math.max(0, input.renovationCosts),
  );
  const loanAmount = Math.max(0, roundCurrency(totalCosts - Math.max(0, input.equity)));
  const interestRate = estimateInterestRate(input.interestPeriodYears, input.interestAdjustmentFactor ?? 1);
  const repaymentRate = input.repaymentRate ?? 2;

  return {
    totalCosts,
    loanAmount,
    loanToCostPercent: totalCosts > 0 ? roundCurrency((loanAmount / totalCosts) * 100) : 0,
    interestRate,
    monthlyDebtService: roundCurrency(loanAmount * ((interestRate + repaymentRate) / 100) / 12),
  };
}

export function computeIndividualAdditionalCosts(args: {
  purchasePrice: number;
  parkingPrice: number;
  brokerPercent: number;
  notaryPercent: number;
  landRegistryPercent: number;
  propertyTransferTaxPercent: number | null;
}): number {
  return computeAcquisitionCosts({
    purchasePrice: args.purchasePrice,
    parkingPurchasePrice: args.parkingPrice,
    brokerPercent: args.brokerPercent,
    notaryPercent: args.notaryPercent,
    landRegistryPercent: args.landRegistryPercent,
    propertyTransferTaxPercent: args.propertyTransferTaxPercent,
  }).totalAdditionalCosts;
}
