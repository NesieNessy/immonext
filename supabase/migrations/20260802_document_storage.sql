-- Private storage bucket backing the "document" table. Objects live at
-- {userId}/{documentId}-{fileName}, mirroring the tenancy-documents bucket's
-- ownership-via-folder-name RLS pattern.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can view own document files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own document files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own document files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own document files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
