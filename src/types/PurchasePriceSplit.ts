import { SplitMode } from "@/constants/PurchasePriceSplitValues";

export type PropertyPurchasePriceSplit = {
  id: string;
  property_id: string;
  split_mode: SplitMode;
  building_percentage: number | null;
  building_value: number | null;
  land_percentage: number | null;
  land_value: number | null;
  plot_size_sqm: number | null;
  land_value_per_sqm: number | null;
  co_ownership_numerator: number | null;
  co_ownership_denominator: number | null;
};
