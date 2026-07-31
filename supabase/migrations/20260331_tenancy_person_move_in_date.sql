-- Einzug (move-in date) moves from the tenancy level to per-person, since
-- co-tenants can move in on different dates. The overview table takes the
-- primary tenant's move_in_date as the unit's displayed Einzug.

ALTER TABLE tenancy_person ADD COLUMN move_in_date DATE;
