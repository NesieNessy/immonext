export interface CityPurchasePriceSplit {
  buildingSharePercent: number;
  landSharePercent: number;
}

/** Falls back to the same 65/35 default used by the detail-check
 *  depreciation route when the city isn't in the reference table. */
export async function getCityPurchasePriceSplit(cityName: string): Promise<CityPurchasePriceSplit> {
  const response = await fetch(`/api/reference/city-price-split?city=${encodeURIComponent(cityName)}`, { cache: 'no-store' });
  if (!response.ok) {
    return { buildingSharePercent: 65, landSharePercent: 35 };
  }
  return response.json() as Promise<CityPurchasePriceSplit>;
}
