"use client";

import { Button, Header, TileWithImage } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getProperties } from '@/lib/supabase/property';
import { base64ToDataUri } from '@/lib/utils';
import type { Property } from '@immonext/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ExistingPropertiesPage() {
  const { user, isLoading } = useRequireAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    getProperties(user.id).then(setProperties);
  }, [user]);

  const handleCreateProperty = () => {
    // TODO: Implement create new property functionality
    console.log('Create new property');
  };

  const handlePropertyClick = (propertyId: number) => {
    router.push(`/existing-properties/${propertyId}/property-data`);
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Navigation Bar */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <Header
          title="Bestandsobjekte"
          subtitle="Übersicht aller vorhandenen Immobilien"
          actions={
            <Button 
              label={BUTTON_DETAILS.Create.label}
              icon={<BUTTON_DETAILS.Create.icon />}
              variant="primary" 
              onClick={handleCreateProperty}
            />
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {properties.map((property) => (
            <TileWithImage
              key={property.propertyId}
              image={base64ToDataUri(property.imageUrl) ?? ""}
              imageAlt={`${property.street} ${property.houseNumber}`}
              title={`${property.street} ${property.houseNumber}`}
              description={`${property.postalCode} ${property.city}`}
              className="h-full"
              onClick={() => handlePropertyClick(property.propertyId)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
