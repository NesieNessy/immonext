"use client";

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Header, TileWithImage, Button } from '@/components/immonext-design';
import { ButtonLabels } from '@/constants/ButtonLabels';
import existingPropertiesData from '@/data/existing_properties.json';
import { AppNavigation } from '../shared/AppNavigation';

export default function ExistingPropertiesPage() {
  const properties = existingPropertiesData.existing_properties;
  const router = useRouter();

  const handleCreateProperty = () => {
    // TODO: Implement create new property functionality
    console.log('Create new property');
  };

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/existing-properties/${propertyId}/property-data`);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Navigation Bar */}
      <AppNavigation />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <Header
          title="Bestandsobjekte"
          subtitle="Übersicht aller vorhandenen Immobilien"
          actions={
            <Button 
              label={ButtonLabels.Create}
              icon={<Plus />}
              variant="primary" 
              onClick={handleCreateProperty}
            />
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {properties.map((property) => (
            <TileWithImage
              key={property.id}
              image={property.image?.data ? `data:${property.image.format};base64,${property.image.data}` : ''}
              imageAlt={`${property.street} ${property.house_number}`}
              title={`${property.street} ${property.house_number}`}
              description={`${property.postcode} ${property.city}`}
              className="h-full"
              onClick={() => handlePropertyClick(property.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
