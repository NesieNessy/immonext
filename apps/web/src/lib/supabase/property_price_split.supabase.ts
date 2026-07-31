import { supabase } from '@/lib/supabase/client.supabase';
import type { PropertyPriceSplit, PropertyPriceSplitInsert } from '@immonext/types';

function toPropertyPriceSplit(row: Record<string, unknown>): PropertyPriceSplit {
  return {
    propertyPriceSplitId:   row.property_price_split_id as number,
    propertyId:             row.property_id as number,
    splitMode:              row.split_mode as PropertyPriceSplit['splitMode'],
    plotAreaM2:             row.plot_area_m2 == null ? null : Number(row.plot_area_m2),
    landReferenceValue:     row.land_reference_value == null ? null : Number(row.land_reference_value),
    coOwnershipNumerator:   row.co_ownership_numerator == null ? null : Number(row.co_ownership_numerator),
    coOwnershipDenominator: row.co_ownership_denominator == null ? null : Number(row.co_ownership_denominator),
    createdAt:              row.created_at as string,
    updatedAt:              row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getPropertyPriceSplitByProperty(propertyId: number): Promise<PropertyPriceSplit | null> {
  const { data, error } = await supabase
    .from('property_price_split')
    .select('*')
    .eq('property_id', propertyId)
    .single();

  if (error || !data) return null;
  return toPropertyPriceSplit(data);
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export async function upsertPropertyPriceSplit(payload: PropertyPriceSplitInsert): Promise<PropertyPriceSplit | null> {
  const { data, error } = await supabase
    .from('property_price_split')
    .upsert(
      {
        property_id:               payload.propertyId,
        split_mode:                payload.splitMode,
        plot_area_m2:              payload.plotAreaM2,
        land_reference_value:      payload.landReferenceValue,
        co_ownership_numerator:    payload.coOwnershipNumerator,
        co_ownership_denominator:  payload.coOwnershipDenominator,
        updated_at:                new Date().toISOString(),
      },
      { onConflict: 'property_id' },
    )
    .select()
    .single();

  if (error || !data) return null;
  return toPropertyPriceSplit(data);
}
