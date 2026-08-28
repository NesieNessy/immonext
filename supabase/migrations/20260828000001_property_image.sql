-- Photo gallery for existing properties — one property can now have several
-- photos, one of which is marked as the cover (shown on the overview list).
-- Unlike the "documents" bucket, property photos aren't sensitive, so this
-- bucket is public: every image is served via its plain public URL, no
-- signed-URL round trip needed at render time.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-images', 'property-images', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own property image files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own property image files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own property image files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- No SELECT policy: the bucket is public, so reads go through the public
-- URL and bypass storage.objects RLS entirely.

CREATE TABLE property_image (
    property_image_id SERIAL PRIMARY KEY,
    property_id        INTEGER NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    storage_path        TEXT NOT NULL,
    is_cover           BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX property_image_property_id_idx ON property_image(property_id);

-- No RLS on this table — like `document`, it's only ever touched through
-- the /api/property-images route (pg.Pool, service-role), which enforces
-- ownership itself by joining through property.user_id.
