import {
  computeAcquisitionCosts,
  resolveStateFromPostalCode,
} from '@/lib/detailCheck/acquisitionCosts';
import { requireUserId, workflowIdFor } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  brokerPercent: 3.57,
  notaryPercent: 1.5,
  landRegistryPercent: 0.5,
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSavedBrokerPercent(value: unknown): number {
  const parsed = toNumber(value);
  return parsed > 20 && parsed <= 2000 ? parsed / 100 : parsed;
}

async function loadDefaults(state: string | null) {
  if (!state) return { ...DEFAULTS, propertyTransferTaxPercent: null };

  const { rows } = await db.query(
    `
      SELECT broker_percent, notary_percent, land_registry_percent, property_transfer_tax_percent
      FROM state_acquisition_costs
      WHERE state = $1
    `,
    [state],
  );

  if (!rows[0]) return { ...DEFAULTS, propertyTransferTaxPercent: null };

  return {
    brokerPercent: toNumber(rows[0].broker_percent),
    notaryPercent: toNumber(rows[0].notary_percent),
    landRegistryPercent: toNumber(rows[0].land_registry_percent),
    propertyTransferTaxPercent: toNumber(rows[0].property_transfer_tax_percent),
  };
}

async function loadQuickCheck(userId: string, quickCheckId: string | null) {
  if (!quickCheckId) return null;

  const { rows } = await db.query(
    `
      SELECT quick_check_id, purchase_price, postal_code
      FROM quick_check
      WHERE user_id = $1
        AND quick_check_id = $2
      LIMIT 1
    `,
    [userId, Number(quickCheckId)],
  );

  return rows[0] ?? null;
}

async function loadPropertyData(userId: string, workflowId: string) {
  const { rows } = await db.query(
    `
      SELECT postal_code, living_area_m2
      FROM detail_check_property_data
      WHERE user_id = $1
        AND workflow_id = $2
      LIMIT 1
    `,
    [userId, workflowId],
  );

  return rows[0] ?? null;
}

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const quickCheckId = url.searchParams.get('quickCheckId');
  const workflowId = workflowIdFor(userId, quickCheckId, url.searchParams.get('workflowId'));
  const quickCheck = await loadQuickCheck(userId, quickCheckId);
  const propertyData = await loadPropertyData(userId, workflowId);
  const postalCode = propertyData?.postal_code ?? quickCheck?.postal_code ?? null;
  const state = resolveStateFromPostalCode(postalCode);
  const defaults = await loadDefaults(state);

  const { rows } = await db.query(
    `
      SELECT *
      FROM detail_check_acquisition_costs
      WHERE user_id = $1
        AND workflow_id = $2
      LIMIT 1
    `,
    [userId, workflowId],
  );

  const saved = rows[0];
  const purchasePrice = toNumber(saved?.purchase_price ?? quickCheck?.purchase_price ?? 0);
  const parkingPurchasePrice = toNumber(saved?.parking_purchase_price ?? 0);
  const rawSavedBrokerPercent = saved ? toNumber(saved.broker_percent) : null;
  const brokerPercent = normalizeSavedBrokerPercent(saved?.broker_percent ?? defaults.brokerPercent);
  const notaryPercent = toNumber(saved?.notary_percent ?? defaults.notaryPercent);
  const landRegistryPercent = toNumber(saved?.land_registry_percent ?? defaults.landRegistryPercent);
  const propertyTransferTaxPercent = saved?.property_transfer_tax_percent == null
    ? defaults.propertyTransferTaxPercent
    : toNumber(saved.property_transfer_tax_percent);
  const livingAreaM2 = saved?.living_area_m2 == null
    ? propertyData?.living_area_m2 == null ? null : toNumber(propertyData.living_area_m2)
    : toNumber(saved.living_area_m2);

  const computed = computeAcquisitionCosts({
    purchasePrice,
    parkingPurchasePrice,
    brokerPercent,
    livingAreaM2,
    postalCode,
    notaryPercent,
    landRegistryPercent,
    propertyTransferTaxPercent,
  });

  if (saved && rawSavedBrokerPercent !== brokerPercent) {
    await db.query(
      `
        UPDATE detail_check_acquisition_costs
        SET broker_percent = $3,
            broker_amount = $4,
            notary_amount = $5,
            land_registry_amount = $6,
            property_transfer_tax_amount = $7,
            total_additional_costs = $8,
            total_costs = $9,
            updated_at = NOW()
        WHERE user_id = $1 AND workflow_id = $2
      `,
      [
        userId,
        workflowId,
        brokerPercent,
        computed.brokerAmount,
        computed.notaryAmount,
        computed.landRegistryAmount,
        computed.propertyTransferTaxAmount,
        computed.totalAdditionalCosts,
        computed.totalCosts,
      ],
    );
  }

  return NextResponse.json({
    workflowId,
    quickCheckId: quickCheck?.quick_check_id ?? null,
    state,
    postalCode,
    purchasePrice,
    parkingPurchasePrice,
    brokerPercent,
    notaryPercent,
    landRegistryPercent,
    propertyTransferTaxPercent,
    livingAreaM2,
    computed,
  });
}

export async function POST(request: Request) {
  const userId = await requireUserId(request);
  const input = await request.json();
  const quickCheckId = input.quickCheckId ? String(input.quickCheckId) : null;
  const workflowId = workflowIdFor(userId, quickCheckId, input.workflowId ? String(input.workflowId) : null);
  const quickCheck = await loadQuickCheck(userId, quickCheckId);
  const propertyData = await loadPropertyData(userId, workflowId);
  const postalCode = propertyData?.postal_code ?? quickCheck?.postal_code ?? input.postalCode ?? null;
  const state = resolveStateFromPostalCode(postalCode);
  const defaults = await loadDefaults(state);

  const purchasePrice = toNumber(input.purchasePrice);
  const parkingPurchasePrice = toNumber(input.parkingPurchasePrice);
  const brokerPercent = toNumber(input.brokerPercent ?? defaults.brokerPercent);
  const livingAreaM2 = input.livingAreaM2 == null
    ? propertyData?.living_area_m2 == null ? null : toNumber(propertyData.living_area_m2)
    : toNumber(input.livingAreaM2);
  const notaryPercent = defaults.notaryPercent;
  const landRegistryPercent = defaults.landRegistryPercent;
  const propertyTransferTaxPercent = defaults.propertyTransferTaxPercent;

  if (
    purchasePrice < 0 ||
    purchasePrice > 1_000_000_000 ||
    parkingPurchasePrice < 0 ||
    parkingPurchasePrice > 1_000_000_000 ||
    brokerPercent < 0 ||
    brokerPercent > 20
  ) {
    return NextResponse.json({ error: 'Invalid acquisition-cost payload' }, { status: 400 });
  }

  const computed = computeAcquisitionCosts({
    purchasePrice,
    parkingPurchasePrice,
    brokerPercent,
    livingAreaM2,
    postalCode,
    notaryPercent,
    landRegistryPercent,
    propertyTransferTaxPercent,
  });

  await db.query(
    `
      INSERT INTO detail_check_acquisition_costs (
        user_id,
        quick_check_id,
        workflow_id,
        state,
        postal_code,
        living_area_m2,
        purchase_price,
        parking_purchase_price,
        broker_percent,
        notary_percent,
        land_registry_percent,
        property_transfer_tax_percent,
        purchase_price_per_m2,
        broker_amount,
        notary_amount,
        land_registry_amount,
        property_transfer_tax_amount,
        total_additional_costs,
        total_costs
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (user_id, workflow_id) DO UPDATE SET
        state = EXCLUDED.state,
        postal_code = EXCLUDED.postal_code,
        living_area_m2 = EXCLUDED.living_area_m2,
        purchase_price = EXCLUDED.purchase_price,
        parking_purchase_price = EXCLUDED.parking_purchase_price,
        broker_percent = EXCLUDED.broker_percent,
        notary_percent = EXCLUDED.notary_percent,
        land_registry_percent = EXCLUDED.land_registry_percent,
        property_transfer_tax_percent = EXCLUDED.property_transfer_tax_percent,
        purchase_price_per_m2 = EXCLUDED.purchase_price_per_m2,
        broker_amount = EXCLUDED.broker_amount,
        notary_amount = EXCLUDED.notary_amount,
        land_registry_amount = EXCLUDED.land_registry_amount,
        property_transfer_tax_amount = EXCLUDED.property_transfer_tax_amount,
        total_additional_costs = EXCLUDED.total_additional_costs,
        total_costs = EXCLUDED.total_costs,
        updated_at = NOW()
    `,
    [
      userId,
      quickCheck?.quick_check_id ?? null,
      workflowId,
      state,
      postalCode,
      livingAreaM2,
      purchasePrice,
      parkingPurchasePrice,
      brokerPercent,
      notaryPercent,
      landRegistryPercent,
      propertyTransferTaxPercent,
      computed.purchasePricePerM2,
      computed.brokerAmount,
      computed.notaryAmount,
      computed.landRegistryAmount,
      computed.propertyTransferTaxAmount,
      computed.totalAdditionalCosts,
      computed.totalCosts,
    ],
  );

  return NextResponse.json({ status: 'OK', computed, next: 'VERMIETUNG' });
}
