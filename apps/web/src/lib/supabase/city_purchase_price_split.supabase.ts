import { supabase } from '@/lib/supabase/client.supabase';

export interface CityPurchasePriceSplit {
  buildingSharePercent: number;
  landSharePercent: number;
}

/** Falls back to the same 65/35 default used by the detail-check
 *  depreciation route when the city isn't in the reference table. */
export async function getCityPurchasePriceSplit(cityName: string): Promise<CityPurchasePriceSplit> {
  const { data, error } = await supabase
    .from('city_purchase_price_split')
    .select('building_share_percent, land_share_percent')
    .eq('city_name', cityName)
    .single();

  if (error || !data) {
    return { buildingSharePercent: 65, landSharePercent: 35 };
  }

  return {
    buildingSharePercent: Number(data.building_share_percent),
    landSharePercent: Number(data.land_share_percent),
  };
}
