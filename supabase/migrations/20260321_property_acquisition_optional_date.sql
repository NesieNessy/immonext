-- The new "Neues Objekt anlegen" form marks the purchase date (Kaufdatum) as optional ("opt."),
-- but property_acquisition.purchase_date was NOT NULL — relax it so a
-- property_acquisition row can be created (or left absent) without one.
ALTER TABLE property_acquisition ALTER COLUMN purchase_date DROP NOT NULL;
