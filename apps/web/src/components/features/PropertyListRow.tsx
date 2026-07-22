"use client";

import { getPropertyCardColor, PROPERTY_CATEGORY_LABEL, PROPERTY_CATEGORY_VARIANT } from '@/components/features/PropertyDisplay';
import { Button, Tag, type MenuItem } from '@/components/ui';
import type { PropertyOverview } from '@/lib/supabase/property.supabase';
import { base64ToDataUri, cn } from '@/lib/utils';
import { Home, MoreVertical } from 'lucide-react';

interface PropertyListRowProps {
  property: PropertyOverview;
  colorIndex: number;
  menuItems: MenuItem[];
  onClick: () => void;
}

export function PropertyListRow({ property, colorIndex, menuItems, onClick }: PropertyListRowProps) {
  const photo = base64ToDataUri(property.imageUrl);
  const categoryLabel = property.propertyCategory
    ? PROPERTY_CATEGORY_LABEL[property.propertyCategory] ?? property.propertyCategory
    : null;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-card border border-border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50"
    >
      <div
        className={cn(
          "relative w-16 h-16 rounded-md overflow-hidden flex items-center justify-center shrink-0",
          photo ? "bg-muted" : getPropertyCardColor(colorIndex)
        )}
      >
        {photo ? (
          <img
            src={photo}
            alt={`${property.street} ${property.houseNumber}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <Home className="w-7 h-7 text-white/85" strokeWidth={1.5} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {property.street} {property.houseNumber}
          </h3>
          {categoryLabel && (
            <Tag
              label={categoryLabel}
              variant={PROPERTY_CATEGORY_VARIANT[property.propertyCategory!] ?? 'default'}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{property.postalCode} {property.city}</p>
      </div>

      <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground shrink-0">
        <div className="text-right">
          <p className="uppercase tracking-wide">Wohnfläche</p>
          <p className="font-medium text-foreground">{property.squareMeters ? `${property.squareMeters} m²` : '—'}</p>
        </div>
        <div className="text-right">
          <p className="uppercase tracking-wide">Baujahr</p>
          <p className="font-medium text-foreground">{property.yearOfConstruction || '—'}</p>
        </div>
        <div className="text-right">
          <p className="uppercase tracking-wide">Kaufpreis</p>
          <p className="font-medium text-foreground">
            {property.purchasePrice ? `${property.purchasePrice.toLocaleString('de-DE')} €` : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
        <span className={cn("w-2 h-2 rounded-full", property.isRented ? "bg-green-500" : "bg-muted-foreground/40")} />
        <span className="hidden md:inline">{property.isRented ? 'Vermietet' : 'Unvermietet'}</span>
      </div>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button
          iconOnly
          icon={<MoreVertical className="w-4 h-4" />}
          variant="ghost"
          size="sm"
          menuItems={menuItems}
        />
      </div>
    </div>
  );
}
