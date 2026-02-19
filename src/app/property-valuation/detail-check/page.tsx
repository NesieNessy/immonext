"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppNavigation } from '../../shared/AppNavigation';
import { RadioButton, Dropdown, Button, StickyActionBar } from '@/components/immonext-design';
import { DataEntryTypeValues } from '@/constants/DataEntryTypeValues';
import { PropertyTypesValues } from '@/constants/PropertyTypeValues';
import { TenancyTypeValues } from '@/constants/TenancyTypeValues';
import { ButtonLabels } from '@/constants/ButtonLabels';
import { X, Play } from 'lucide-react';

export default function DetailCheckPage() {
  const router = useRouter();
  const [selectedDataEntry, setSelectedDataEntry] = useState<DataEntryTypeValues | ''>(DataEntryTypeValues.ManualEntry);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedTenancyType, setSelectedTenancyType] = useState<string>('');

  // Convert enum values to dropdown options
  const propertyTypeOptions = Object.entries(PropertyTypesValues).map(([key, value]) => ({
    value: key,
    label: value,
  }));

  const tenancyTypeOptions = Object.entries(TenancyTypeValues).map(([key, value]) => ({
    value: key,
    label: value,
  }));

  const handleStart = () => {
    // Navigate to the first step (property-data)
    router.push('/property-valuation/detail-check/property-data');
  };

  const handleCancel = () => {
    // Navigate back to property valuation overview
    router.push('/property-valuation');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <AppNavigation />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Objekterfassung</h1>
          <p className="text-muted-foreground">
            Wählen Sie die Art des Objektes, die Erfassungsmethode und die Vermietungsform
          </p>
        </div>

        {/* Art der Erfassung Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Art der Erfassung:</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Wählen Sie, wie Sie die Objektdaten erfassen möchten
          </p>

          <div className="space-y-3">
            <RadioButton
              name="dataEntry"
              label={`${DataEntryTypeValues.ManualEntry}`}
              value={DataEntryTypeValues.ManualEntry}
              checked={selectedDataEntry === DataEntryTypeValues.ManualEntry}
              onChange={(e) => setSelectedDataEntry(e.target.value as DataEntryTypeValues)}
            />
            <RadioButton
              name="dataEntry"
              label={`${DataEntryTypeValues.ImportFromRealEstatePortal}`}
              value={DataEntryTypeValues.ImportFromRealEstatePortal}
              checked={selectedDataEntry === DataEntryTypeValues.ImportFromRealEstatePortal}
              onChange={(e) => setSelectedDataEntry(e.target.value as DataEntryTypeValues)}
            />
            <RadioButton
              name="dataEntry"
              label={DataEntryTypeValues.ExposeScan}
              value={DataEntryTypeValues.ExposeScan}
              checked={selectedDataEntry === DataEntryTypeValues.ExposeScan}
              onChange={(e) => setSelectedDataEntry(e.target.value as DataEntryTypeValues)}
            />
          </div>
        </div>

        <hr className="my-8 border-border" />

        {/* Art des Objektes Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Art des Objektes:</h2>
          <Dropdown
            options={[
              { value: '', label: '... treffen Sie eine Auswahl' },
              ...propertyTypeOptions
            ]}
            value={selectedPropertyType}
            onChange={(e) => setSelectedPropertyType(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Art der Vermietungsform Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Art der Vermietungsform:</h2>
          <Dropdown
            options={[
              { value: '', label: '... treffen Sie eine Auswahl' },
              ...tenancyTypeOptions
            ]}
            value={selectedTenancyType}
            onChange={(e) => setSelectedTenancyType(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Sticky Action Bar */}
        <StickyActionBar
          show={true}
          onGhost={handleCancel}
          onPrimary={handleStart}
          ghostLabel={ButtonLabels.Cancel}
          primaryLabel={ButtonLabels.Start}
          ghostIcon={<X />}
          primaryIcon={<Play />}
        />
      </main>
    </div>
  );
}
