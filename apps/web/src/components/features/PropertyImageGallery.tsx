"use client";

import { useEffect } from 'react';
import { Icons } from '@/components/common';
import { UploadButton } from '@/components/ui';
import { usePropertyImages } from '@/hooks/usePropertyImages';
import { cn } from '@/lib/utils';

interface Props {
  propertyId: number;
  /** Fires whenever the current cover image changes (upload, switch, or
   *  delete) so the surrounding page can keep its own copy of the property's
   *  `imageUrl` (e.g. the breadcrumb thumbnail) in sync without a reload. */
  onCoverChange?: (url: string | null) => void;
}

/** A property's photo gallery — upload several photos, pick which one is the
 *  cover shown on the overview list/cards, remove any of them. Manages its
 *  own data (uploads/cover changes/deletes are immediate, not tied to the
 *  surrounding form's Save button). */
export function PropertyImageGallery({ propertyId, onCoverChange }: Props) {
  const { images, isLoading, isUploading, error, upload, setCover, remove } = usePropertyImages(propertyId);

  useEffect(() => {
    if (isLoading) return;
    const cover = images.find((image) => image.isCover) ?? null;
    onCoverChange?.(cover?.publicUrl ?? null);
    // Only the gallery's own data should drive this, not identity of the callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, isLoading]);

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((image) => (
            <div key={image.propertyImageId} className="relative w-24 h-24 shrink-0">
              <img
                src={image.publicUrl}
                alt=""
                className={cn(
                  "w-full h-full object-cover rounded-lg border-2",
                  image.isCover ? "border-accent" : "border-border"
                )}
              />
              <button
                type="button"
                onClick={() => void setCover(image.propertyImageId)}
                disabled={image.isCover}
                title={image.isCover ? 'Titelbild' : 'Als Titelbild festlegen'}
                aria-label={image.isCover ? 'Titelbild' : 'Als Titelbild festlegen'}
                className={cn(
                  "absolute top-1 left-1 p-1 rounded-full bg-card/90 border border-border transition-colors",
                  image.isCover ? "text-accent" : "text-muted-foreground hover:text-foreground cursor-pointer"
                )}
              >
                <Icons.Star className="w-3.5 h-3.5" fill={image.isCover ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={() => void remove(image)}
                aria-label="Bild entfernen"
                className="absolute top-1 right-1 p-1 rounded-full bg-card/90 border border-border text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <UploadButton
        buttonText={isUploading ? 'Wird hochgeladen…' : 'Bilder hochladen'}
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={isUploading}
        onFileSelect={(files) => void upload(files)}
      />
    </div>
  );
}
