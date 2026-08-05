import { requireUserId } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ResourceConfig = {
  table: string;
  primaryKey: string;
  columns: readonly string[];
  orderBy?: string;
  upsertProperty?: boolean;
};

const RESOURCES: Record<string, ResourceConfig> = {
  'acquisition-costs': {
    table: 'acquisition_costs',
    primaryKey: 'acquisition_costs_id',
    columns: [
      'property_id', 'parking_space_id', 'property_purchase_price', 'price_per_sqm',
      'broker', 'broker_value', 'notary', 'notary_value', 'land_registry',
      'land_registry_value', 'real_estate_tax', 'real_estate_tax_value',
      'adjustment_variable', 'adjustment_variable_value', 'total_ancillary_costs_value',
      'total_ancillary_costs', 'parking_space_purchase_price',
    ],
  },
  'parking-spaces': {
    table: 'parking_space',
    primaryKey: 'parking_space_id',
    columns: ['property_id', 'parking_space_type', 'number_of_parking_spaces'],
    orderBy: 'parking_space_id',
  },
  'property-acquisition': {
    table: 'property_acquisition',
    primaryKey: 'property_acquisition_id',
    columns: ['property_id', 'house_completion_year', 'purchase_date', 'transfer_date'],
    upsertProperty: true,
  },
  'property-units': {
    table: 'property_unit',
    primaryKey: 'property_unit_id',
    columns: [
      'property_id', 'unit_label', 'sort_order', 'usage_type', 'floor', 'location_note',
      'living_area_m2', 'number_of_rooms', 'year_of_construction', 'energy_efficient',
      'number_of_parking_spaces', 'target_cold_rent', 'target_parking_rent',
      'target_ancillary_costs',
    ],
    orderBy: 'sort_order, property_unit_id',
  },
  tenancies: {
    table: 'tenancy',
    primaryKey: 'tenancy_id',
    columns: [
      'maintenance_costs_id', 'parking_space_id', 'property_id', 'property_unit_id',
      'is_rented', 'tenancy_start_date', 'tenancy_end_date', 'tenancy_type',
      'tenancy_units', 'tenancy_units_price', 'parking_space_rent', 'misc_rent',
      'warm_rent', 'cold_rent', 'tenant_first_name', 'tenant_last_name', 'deposit',
      'next_rent_adjustment_date', 'next_rent_adjustment_amount', 'renovation_adjustment_planned',
      'pets_allowed', 'redecoration_clause', 'sublet_allowed', 'additional_terms',
    ],
    orderBy: 'tenancy_id',
  },
  'property-rnd': {
    table: 'property_rnd',
    primaryKey: 'property_rnd_id',
    columns: [
      'property_id', 'rnd_mode', 'modernization_roof', 'modernization_windows',
      'modernization_lines', 'modernization_heating', 'modernization_facade',
      'modernization_bathrooms', 'modernization_interior',
      'remaining_useful_life_years', 'afa_percent',
    ],
    upsertProperty: true,
  },
  'property-price-split': {
    table: 'property_price_split',
    primaryKey: 'property_price_split_id',
    columns: [
      'property_id', 'split_mode', 'plot_area_m2', 'land_reference_value',
      'co_ownership_numerator', 'co_ownership_denominator',
    ],
    upsertProperty: true,
  },
};

function getConfig(resource: string): ResourceConfig | null {
  return Object.hasOwn(RESOURCES, resource) ? RESOURCES[resource] : null;
}

function allowedValues(config: ResourceConfig, input: unknown): Record<string, unknown> {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return Object.fromEntries(config.columns.filter((column) => Object.hasOwn(source, column)).map((column) => [column, source[column]]));
}

async function ownsProperty(userId: string, propertyId: unknown): Promise<boolean> {
  const id = Number(propertyId);
  if (!Number.isInteger(id)) return false;
  const result = await db.query('SELECT 1 FROM property WHERE property_id = $1 AND user_id = $2', [id, userId]);
  return Boolean(result.rowCount);
}

type RouteContext = { params: Promise<{ resource: string }> };

export async function GET(request: Request, context: RouteContext) {
  const userId = await requireUserId(request);
  const config = getConfig((await context.params).resource);
  if (!config) return NextResponse.json({ error: 'Unbekannte Ressource.' }, { status: 404 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const propertyId = url.searchParams.get('propertyId');
  const propertyUnitId = url.searchParams.get('propertyUnitId');
  const filters: string[] = [];
  const values: unknown[] = [userId];
  if (id) {
    values.push(Number(id));
    filters.push(`r.${config.primaryKey} = $${values.length}`);
  }
  if (propertyId) {
    values.push(Number(propertyId));
    filters.push(`r.property_id = $${values.length}`);
  }
  if (propertyUnitId && config.table === 'tenancy') {
    values.push(Number(propertyUnitId));
    filters.push(`r.property_unit_id = $${values.length}`);
  }

  const where = [
    'EXISTS (SELECT 1 FROM property p WHERE p.property_id = r.property_id AND p.user_id = $1)',
    ...filters,
  ].join(' AND ');
  const orderBy = url.searchParams.get('current') === 'true' && config.table === 'tenancy'
    ? ' ORDER BY tenancy_start_date DESC NULLS LAST LIMIT 1'
    : config.orderBy ? ` ORDER BY ${config.orderBy}` : '';
  const { rows } = await db.query(`SELECT r.* FROM ${config.table} r WHERE ${where}${orderBy}`, values);

  if (id || url.searchParams.get('single') === 'true') {
    if (!rows[0]) return NextResponse.json({ error: 'Datensatz nicht gefunden.' }, { status: 404 });
    return NextResponse.json(rows[0]);
  }
  return NextResponse.json(rows);
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await requireUserId(request);
  const config = getConfig((await context.params).resource);
  if (!config) return NextResponse.json({ error: 'Unbekannte Ressource.' }, { status: 404 });
  const input = await request.json();
  const valuesByColumn = allowedValues(config, input.values);

  if (!await ownsProperty(userId, valuesByColumn.property_id)) {
    return NextResponse.json({ error: 'Objekt nicht gefunden.' }, { status: 404 });
  }
  const columns = Object.keys(valuesByColumn);
  if (columns.length === 0) return NextResponse.json({ error: 'Keine Daten übermittelt.' }, { status: 400 });

  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const upsert = input.upsert === true && config.upsertProperty
    ? ` ON CONFLICT (property_id) DO UPDATE SET ${columns.filter((column) => column !== 'property_id').map((column) => `${column} = EXCLUDED.${column}`).join(', ')}, updated_at = NOW()`
    : '';
  const { rows } = await db.query(
    `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})${upsert} RETURNING *`,
    columns.map((column) => valuesByColumn[column]),
  );
  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await requireUserId(request);
  const config = getConfig((await context.params).resource);
  if (!config) return NextResponse.json({ error: 'Unbekannte Ressource.' }, { status: 404 });
  const input = await request.json();
  const id = Number(input.id);
  const valuesByColumn = allowedValues(config, input.values);
  delete valuesByColumn.property_id;
  const columns = Object.keys(valuesByColumn);
  if (!Number.isInteger(id) || columns.length === 0) {
    return NextResponse.json({ error: 'Ungültige Änderung.' }, { status: 400 });
  }
  const assignments = columns.map((column, index) => `${column} = $${index + 3}`);
  assignments.push('updated_at = NOW()');
  const { rows } = await db.query(
    `UPDATE ${config.table} r SET ${assignments.join(', ')} WHERE r.${config.primaryKey} = $1 AND EXISTS (SELECT 1 FROM property p WHERE p.property_id = r.property_id AND p.user_id = $2) RETURNING r.*`,
    [id, userId, ...columns.map((column) => valuesByColumn[column])],
  );
  if (!rows[0]) return NextResponse.json({ error: 'Datensatz nicht gefunden.' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(request: Request, context: RouteContext) {
  const userId = await requireUserId(request);
  const config = getConfig((await context.params).resource);
  if (!config) return NextResponse.json({ error: 'Unbekannte Ressource.' }, { status: 404 });
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const propertyId = url.searchParams.get('propertyId');
  if (!id && !propertyId) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const targetColumn = id ? config.primaryKey : 'property_id';
  const targetValue = Number(id ?? propertyId);
  const result = await db.query(
    `DELETE FROM ${config.table} r WHERE r.${targetColumn} = $1 AND EXISTS (SELECT 1 FROM property p WHERE p.property_id = r.property_id AND p.user_id = $2)`,
    [targetValue, userId],
  );
  return NextResponse.json({ deleted: result.rowCount ?? 0 });
}
