-- Private storage bucket for Unterlagen uploads. Objects are stored at
-- "{auth.uid()}/{tenancyId}/{...}" so a simple foldername check on the
-- object path is enough to scope access to the owning user — the same
-- ownership boundary tenancy_document's RLS enforces on the metadata row.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tenancy-documents',
    'tenancy-documents',
    false,
    10485760, -- 10 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own tenancy documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'tenancy-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own tenancy documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'tenancy-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own tenancy documents"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'tenancy-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own tenancy documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'tenancy-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
