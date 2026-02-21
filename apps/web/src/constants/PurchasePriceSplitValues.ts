export enum SplitMode {
  STANDARD = "Standard",
  INDIVIDUAL = "Individuell",
}

export const SPLIT_MODE_DEFAULTS: Record<SplitMode.STANDARD, { building_percentage: number; land_percentage: number }> = {
  [SplitMode.STANDARD]: {
    //TODO Backend functionality
    building_percentage: 80,
    land_percentage: 20,
  },
};

export function getPurchasePriceSplitDefaults(mode: SplitMode): { building_percentage: number; land_percentage: number } {
  if (mode === SplitMode.STANDARD) {
    return SPLIT_MODE_DEFAULTS[SplitMode.STANDARD];
  }
  throw new Error("Individual mode requires manual input for building and land percentages.");
}
