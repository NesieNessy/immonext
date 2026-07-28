-- city_purchase_price_split has RLS enabled but was missing a read policy
-- (unlike its sibling reference tables kpf_ranges / legal_requirements),
-- so client-side reads were silently blocked. Shared reference data —
-- readable by any authenticated user, writes are admin-only.
CREATE POLICY "Authenticated users can view city purchase price split"
    ON city_purchase_price_split FOR SELECT
    USING (auth.role() = 'authenticated');
