-- Extends property_unit with the fields captured on the "Einheit
-- hinzufügen" form: usage type, floor/position, area & room details, and
-- the optional target rent used before a real Mietvertrag exists.

ALTER TABLE property_unit
  ADD COLUMN usage_type TEXT NOT NULL DEFAULT 'WOHNUNG'
    CHECK (usage_type IN ('WOHNUNG', 'EINLIEGERWOHNUNG', 'STELLPLATZ', 'GEWERBEFLAECHE', 'LAGER', 'SONSTIGE')),
  ADD COLUMN floor TEXT,
  ADD COLUMN location_note TEXT,
  ADD COLUMN living_area_m2 NUMERIC,
  ADD COLUMN number_of_rooms NUMERIC,
  ADD COLUMN year_of_construction INT,
  ADD COLUMN energy_efficient TEXT,
  ADD COLUMN number_of_parking_spaces INT NOT NULL DEFAULT 0,
  ADD COLUMN target_cold_rent NUMERIC,
  ADD COLUMN target_parking_rent NUMERIC,
  ADD COLUMN target_ancillary_costs NUMERIC;
