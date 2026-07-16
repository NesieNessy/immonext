import {
  aggregateRenovationPricing,
  evaluateRenovationCases,
  type RenovationCase,
  type RenovationFinancingMode,
} from '@/lib/detailCheck/renovation';
import { requireUserId, workflowIdFor } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeCases(value: unknown): RenovationCase[] {
  return Array.isArray(value) ? (value as RenovationCase[]) : [];
}

function normalizeFinancingMode(value: unknown): RenovationFinancingMode {
  if (value === 'EIGEN' || value === 'TEILWEISE') return value;
  return 'FREMD';
}

async function loadContext(userId: string, workflowId: string, quickCheckId: string | null) {
  const quickCheckRows = quickCheckId
    ? await db.query(
        'SELECT quick_check_id, postal_code, year_of_construction FROM quick_check WHERE user_id = $1 AND quick_check_id = $2 LIMIT 1',
        [userId, Number(quickCheckId)],
      )
    : { rows: [] };
  const propertyRows = await db.query(
    'SELECT postal_code, living_area_m2, year_of_construction, property_category FROM detail_check_property_data WHERE user_id = $1 AND workflow_id = $2 LIMIT 1',
    [userId, workflowId],
  );

  const quickCheck = quickCheckRows.rows[0];
  const property = propertyRows.rows[0];

  return {
    quickCheck,
    postalCode: property?.postal_code ?? quickCheck?.postal_code ?? '',
    livingAreaM2: toNumber(property?.living_area_m2 ?? 0),
    yearOfConstruction: toNumber(property?.year_of_construction ?? quickCheck?.year_of_construction ?? 0),
    propertyCategory: property?.property_category ?? 'EIGENTUMSWOHNUNG',
  };
}

function buildResponse(saved: Record<string, unknown> | undefined, context: Awaited<ReturnType<typeof loadContext>>) {
  const savedCases = safeCases(saved?.cases);
  const evaluatedCases = savedCases.length
    ? evaluateRenovationCases({
        cases: savedCases,
        postalCode: context.postalCode,
        livingAreaM2: context.livingAreaM2,
      })
    : [];
  const aggregate = aggregateRenovationPricing(evaluatedCases);
  const pricing = saved?.pricing && typeof saved.pricing === 'object'
    ? saved.pricing as Record<string, unknown>
    : {};
  const selected = toNumber(pricing.sum_selected ?? aggregate.sum_mid);
  const financingMode = normalizeFinancingMode(saved?.financing_mode);
  const financedAmount = saved
    ? toNumber(saved.financed_amount)
    : financingMode === 'FREMD'
      ? selected
      : 0;

  return {
    quickCheckId: context.quickCheck?.quick_check_id ?? null,
    context: {
      postalCode: context.postalCode,
      livingAreaM2: context.livingAreaM2,
      yearOfConstruction: context.yearOfConstruction,
      propertyCategory: context.propertyCategory,
    },
    cases: evaluatedCases,
    pricing: {
      ...aggregate,
      sum_selected: selected,
    },
    financing: {
      mode: financingMode,
      financedAmount,
    },
  };
}

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const quickCheckId = url.searchParams.get('quickCheckId');
  const workflowId = workflowIdFor(userId, quickCheckId, url.searchParams.get('workflowId'));
  const context = await loadContext(userId, workflowId, quickCheckId);
  const { rows } = await db.query(
    'SELECT * FROM detail_check_renovation WHERE user_id = $1 AND workflow_id = $2 LIMIT 1',
    [userId, workflowId],
  );

  return NextResponse.json({ workflowId, ...buildResponse(rows[0], context) });
}

export async function POST(request: Request) {
  const userId = await requireUserId(request);
  const input = await request.json();
  const quickCheckId = input.quickCheckId ? String(input.quickCheckId) : null;
  const workflowId = workflowIdFor(userId, quickCheckId, input.workflowId ? String(input.workflowId) : null);
  const context = await loadContext(userId, workflowId, quickCheckId);
  const cases = evaluateRenovationCases({
    cases: safeCases(input.cases),
    postalCode: context.postalCode,
    livingAreaM2: context.livingAreaM2,
  });
  const aggregate = aggregateRenovationPricing(cases);
  const requestedSelected = toNumber(input.pricing?.sum_selected ?? aggregate.sum_mid);
  const sumSelected = Math.max(aggregate.sum_min, Math.min(aggregate.sum_max || requestedSelected, requestedSelected));
  const financingMode = normalizeFinancingMode(input.financing?.mode);
  const requestedFinanced = toNumber(input.financing?.financedAmount);
  const financedAmount = financingMode === 'FREMD'
    ? sumSelected
    : financingMode === 'TEILWEISE'
      ? Math.max(0, Math.min(sumSelected, requestedFinanced))
      : 0;
  const pricing = {
    sum_min: aggregate.sum_min,
    sum_max: aggregate.sum_max,
    sum_mid: aggregate.sum_mid,
    sum_selected: sumSelected,
  };

  await db.query(
    `
      INSERT INTO detail_check_renovation (
        user_id, quick_check_id, workflow_id, cases, pricing, financing_mode, financed_amount
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (user_id, workflow_id) DO UPDATE SET
        quick_check_id = EXCLUDED.quick_check_id,
        cases = EXCLUDED.cases,
        pricing = EXCLUDED.pricing,
        financing_mode = EXCLUDED.financing_mode,
        financed_amount = EXCLUDED.financed_amount,
        updated_at = NOW()
    `,
    [
      userId,
      context.quickCheck?.quick_check_id ?? null,
      workflowId,
      JSON.stringify(cases),
      JSON.stringify(pricing),
      financingMode,
      financedAmount,
    ],
  );

  return NextResponse.json({
    status: 'OK',
    next: 'KALKULATOR',
    cases,
    pricing,
    financing: { mode: financingMode, financedAmount },
  });
}
