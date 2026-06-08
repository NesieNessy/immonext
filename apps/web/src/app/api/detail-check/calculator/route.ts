import {
  normalizeYyyymm,
  runRentCalculator,
  type CalculatorMode,
  type CalculatorParams,
} from '@/lib/detailCheck/rentCalculator';
import { type RenovationCase } from '@/lib/detailCheck/renovation';
import { db, DEV_USER_ID } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function workflowIdFor(quickCheckId: string | null): string {
  return quickCheckId ? `quick-check:${quickCheckId}` : `user:${DEV_USER_ID}:draft`;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMode(value: unknown): CalculatorMode {
  return value === 'POTENTIAL' ? 'POTENTIAL' : 'KNOWN';
}

function safeCases(value: unknown): RenovationCase[] {
  return Array.isArray(value) ? value as RenovationCase[] : [];
}

async function loadContext(workflowId: string, quickCheckId: string | null) {
  const quickCheckRows = quickCheckId
    ? await db.query(
        'SELECT quick_check_id, city, postal_code, cold_rent FROM quick_check WHERE user_id = $1 AND quick_check_id = $2 LIMIT 1',
        [DEV_USER_ID, Number(quickCheckId)],
      )
    : { rows: [] };
  const propertyRows = await db.query(
    'SELECT city, postal_code, living_area_m2 FROM detail_check_property_data WHERE user_id = $1 AND workflow_id = $2 LIMIT 1',
    [DEV_USER_ID, workflowId],
  );
  const rentalRows = await db.query(
    'SELECT valuation_date, cold_rent FROM detail_check_rental WHERE user_id = $1 AND workflow_id = $2 LIMIT 1',
    [DEV_USER_ID, workflowId],
  );
  const financingRows = await db.query(
    `
      SELECT selected_variant, offer_monthly_debt_service, individual_monthly_debt_service
      FROM detail_check_financing
      WHERE user_id = $1 AND workflow_id = $2
      LIMIT 1
    `,
    [DEV_USER_ID, workflowId],
  );
  const renovationRows = await db.query(
    'SELECT cases FROM detail_check_renovation WHERE user_id = $1 AND workflow_id = $2 LIMIT 1',
    [DEV_USER_ID, workflowId],
  );

  const quickCheck = quickCheckRows.rows[0];
  const property = propertyRows.rows[0];
  const rental = rentalRows.rows[0];
  const financing = financingRows.rows[0];
  const selectedVariant = financing?.selected_variant === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'OFFER';
  const monthlyDebtService = selectedVariant === 'INDIVIDUAL'
    ? toNumber(financing?.individual_monthly_debt_service)
    : toNumber(financing?.offer_monthly_debt_service);

  return {
    quickCheck,
    city: property?.city ?? quickCheck?.city ?? '',
    postalCode: property?.postal_code ?? quickCheck?.postal_code ?? '',
    livingAreaM2: toNumber(property?.living_area_m2 ?? 0),
    valuationDate: rental?.valuation_date ?? null,
    coldRent: toNumber(rental?.cold_rent ?? quickCheck?.cold_rent ?? 0),
    selectedVariant,
    monthlyDebtService,
    renovationCases: safeCases(renovationRows.rows[0]?.cases),
  };
}

function buildParams(saved: Record<string, unknown> | undefined, context: Awaited<ReturnType<typeof loadContext>>): CalculatorParams {
  const fallbackStart = normalizeYyyymm(context.valuationDate, new Date().toISOString().slice(0, 7));
  const livingAreaM2 = context.livingAreaM2;
  const rentStart = toNumber(saved?.monthly_rent_start ?? context.coldRent);
  const fallbackRentIndex = livingAreaM2 > 0 && rentStart > 0 ? (rentStart / livingAreaM2) * 1.02 : null;

  return {
    startYyyymm: normalizeYyyymm(saved?.start_yyyymm as string | undefined, fallbackStart),
    monthlyRentStart: rentStart,
    livingAreaM2,
    city: context.city,
    postalCode: context.postalCode,
    last558Date: saved?.last_558_date ? normalizeYyyymm(saved.last_558_date as string) : null,
    last559Date: saved?.last_559_date ? normalizeYyyymm(saved.last_559_date as string) : null,
    rentIndexPerM2: saved?.rent_index_per_m2 == null ? fallbackRentIndex : toNumber(saved.rent_index_per_m2),
    monthlyDebtService: context.monthlyDebtService,
    mode: toMode(saved?.mode),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const quickCheckId = url.searchParams.get('quickCheckId');
  const workflowId = workflowIdFor(quickCheckId);
  const context = await loadContext(workflowId, quickCheckId);
  const savedRows = await db.query(
    'SELECT * FROM detail_check_rent_calculator WHERE user_id = $1 AND workflow_id = $2 LIMIT 1',
    [DEV_USER_ID, workflowId],
  );
  const params = buildParams(savedRows.rows[0], context);
  const result = runRentCalculator(params, context.renovationCases);

  return NextResponse.json({
    workflowId,
    quickCheckId: context.quickCheck?.quick_check_id ?? null,
    selectedFinancingVariant: context.selectedVariant,
    ...result,
  });
}

export async function POST(request: Request) {
  const input = await request.json();
  const quickCheckId = input.quickCheckId ? String(input.quickCheckId) : null;
  const workflowId = workflowIdFor(quickCheckId);
  const context = await loadContext(workflowId, quickCheckId);
  const params: CalculatorParams = {
    startYyyymm: normalizeYyyymm(input.startYyyymm, new Date().toISOString().slice(0, 7)),
    monthlyRentStart: toNumber(input.monthlyRentStart),
    livingAreaM2: context.livingAreaM2,
    city: context.city,
    postalCode: context.postalCode,
    last558Date: input.last558Date ? normalizeYyyymm(input.last558Date) : null,
    last559Date: input.last559Date ? normalizeYyyymm(input.last559Date) : null,
    rentIndexPerM2: input.rentIndexPerM2 == null || input.rentIndexPerM2 === ''
      ? null
      : toNumber(input.rentIndexPerM2),
    monthlyDebtService: context.monthlyDebtService,
    mode: toMode(input.mode),
  };

  const result = runRentCalculator(params, context.renovationCases);

  await db.query(
    `
      INSERT INTO detail_check_rent_calculator (
        user_id, quick_check_id, workflow_id, start_yyyymm, monthly_rent_start,
        rent_index_per_m2, last_558_date, last_559_date, mode, result
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (user_id, workflow_id) DO UPDATE SET
        quick_check_id = EXCLUDED.quick_check_id,
        start_yyyymm = EXCLUDED.start_yyyymm,
        monthly_rent_start = EXCLUDED.monthly_rent_start,
        rent_index_per_m2 = EXCLUDED.rent_index_per_m2,
        last_558_date = EXCLUDED.last_558_date,
        last_559_date = EXCLUDED.last_559_date,
        mode = EXCLUDED.mode,
        result = EXCLUDED.result,
        updated_at = NOW()
    `,
    [
      DEV_USER_ID,
      context.quickCheck?.quick_check_id ?? null,
      workflowId,
      params.startYyyymm,
      params.monthlyRentStart,
      params.rentIndexPerM2,
      params.last558Date,
      params.last559Date,
      params.mode,
      JSON.stringify(result),
    ],
  );

  return NextResponse.json({
    status: 'OK',
    next: 'MAKROLAGE',
    selectedFinancingVariant: context.selectedVariant,
    ...result,
  });
}
