export enum RenovationAttribute {
  ROOF_RENEWAL_INCL_INSULATION = "Dacherneuerung inkl. Dämmung",
  WINDOWS_AND_EXTERIOR_DOORS = "Fenster & Außentüren",
  PIPING_SYSTEMS = "Leitungssysteme (Strom, etc.)",
  HEATING_SYSTEM = "Heizungsanlage",
  EXTERIOR_WALL_INSULATION = "Dämmung Außenwände",
  BATHROOMS = "Bäder",
  INTERIOR_WORK_EXCL_BATHROOMS = "Innenausbau (exkl. Bäder)",
}

export enum RenovationValue {
  ZERO_TO_FIVE = "0–5 Jahre",
  FIVE_TO_TEN = "5–10 Jahre",
  TEN_TO_FIFTEEN = "10–15 Jahre",
  FIFTEEN_TO_TWENTY = "15–20 Jahre",
  OVER_TWENTY = "> 20 Jahre",
}

export enum RndMode {
  STANDARD = "Standard",
  INDIVIDUAL = "Individuell",
}

export const RND_MODE_DEFAULTS: Record<RndMode.STANDARD, { rnd_years: number; afa_percent: number }> = {
  [RndMode.STANDARD]: {
    rnd_years: 50,
    afa_percent: 2.0,
  },
};

export function getPropertyRndDefaults(mode: RndMode): { rnd_years: number; afa_percent: number } {
  if (mode === RndMode.STANDARD) {
    return RND_MODE_DEFAULTS[RndMode.STANDARD];
  }
  throw new Error("Individual mode requires manual input for rnd_years and afa_percent.");
}