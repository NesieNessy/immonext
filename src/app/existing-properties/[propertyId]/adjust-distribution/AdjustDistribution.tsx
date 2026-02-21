"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Layers, Save, X } from 'lucide-react';
import { Button, Header, RadioButton, NumberField, StickyActionBar } from '@/components/immonext-design';
import { AppNavigation } from '../../../../components/features/AppNavigation';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import existingPropertiesData from '@/data/existing_properties.json';
import PropertyPurchasePriceSplitData from '@/data/property_purchase_price_split.json';
import type { Property } from '@/types/Property';
import { SplitMode, getPurchasePriceSplitDefaults } from '@/constants/PurchasePriceSplitValues';
import { ButtonLabels } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';

export default function AdjustDistribution({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  
  // State for split mode and values - initialize with static defaults
  const [splitMode, setSplitMode] = useState<SplitMode>(SplitMode.STANDARD);
  const [buildingPercentage, setBuildingPercentage] = useState<number>(getPurchasePriceSplitDefaults(SplitMode.STANDARD).building_percentage);
  const [buildingValue, setBuildingValue] = useState<number | null>(null);
  const [landPercentage, setLandPercentage] = useState<number>(getPurchasePriceSplitDefaults(SplitMode.STANDARD).land_percentage);
  const [landValue, setLandValue] = useState<number | null>(null);
  const [plotSizeSquareMeters, setPlotSizeSquareMeters] = useState<number | null>(null);
  const [landValuePerSquareMeter, setLandValuePerSquareMeter] = useState<number | null>(null);
  const [coOwnershipNumerator, setCoOwnershipNumerator] = useState<number | null>(null);
  const [coOwnershipDenominator, setCoOwnershipDenominator] = useState<number | null>(null);

  // Track original values for change detection
  const [originalSplitMode, setOriginalSplitMode] = useState<SplitMode>(SplitMode.STANDARD);
  const [originalBuildingPercentage, setOriginalBuildingPercentage] = useState<number>(getPurchasePriceSplitDefaults(SplitMode.STANDARD).building_percentage);
  const [originalBuildingValue, setOriginalBuildingValue] = useState<number | null>(null);
  const [originalLandPercentage, setOriginalLandPercentage] = useState<number>(getPurchasePriceSplitDefaults(SplitMode.STANDARD).land_percentage);
  const [originalLandValue, setOriginalLandValue] = useState<number | null>(null);
  const [originalPlotSizeSquareMeters, setOriginalPlotSizeSquareMeters] = useState<number | null>(null);
  const [originalLandValuePerSquareMeter, setOriginalLandValuePerSquareMeter] = useState<number | null>(null);
  const [originalCoOwnershipNumerator, setOriginalCoOwnershipNumerator] = useState<number | null>(null);
  const [originalCoOwnershipDenominator, setOriginalCoOwnershipDenominator] = useState<number | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [property, setProperty] = useState<Property | undefined>(undefined);

  // Load data on mount - client-side only
  useEffect(() => {
    // Find property data
    const foundProperty = existingPropertiesData.existing_properties.find(p => p.id === propertyId) as Property;
    setProperty(foundProperty);

    // Load property purchase price split data
    const propertyPurchasePriceSplit = PropertyPurchasePriceSplitData.property_purchase_price_split.find(
      (split: any) => split.property_id === propertyId
    );

    if (propertyPurchasePriceSplit) {
      const mode =
        propertyPurchasePriceSplit.split_mode === 'Individuell' ? SplitMode.INDIVIDUAL : SplitMode.STANDARD;
      setSplitMode(mode);
      setOriginalSplitMode(mode);

      if (mode === SplitMode.INDIVIDUAL) {
        const bldgPct = propertyPurchasePriceSplit.building_percentage || 80;
        const lndPct = propertyPurchasePriceSplit.land_percentage || 20;
        
        setBuildingPercentage(bldgPct);
        setBuildingValue(propertyPurchasePriceSplit.building_value);
        setLandPercentage(lndPct);
        setLandValue(propertyPurchasePriceSplit.land_value);
        setPlotSizeSquareMeters(propertyPurchasePriceSplit.plot_size_sqm);
        setLandValuePerSquareMeter(propertyPurchasePriceSplit.land_value_per_sqm);
        setCoOwnershipNumerator(propertyPurchasePriceSplit.co_ownership_numerator);
        setCoOwnershipDenominator(propertyPurchasePriceSplit.co_ownership_denominator);

        setOriginalBuildingPercentage(bldgPct);
        setOriginalBuildingValue(propertyPurchasePriceSplit.building_value);
        setOriginalLandPercentage(lndPct);
        setOriginalLandValue(propertyPurchasePriceSplit.land_value);
        setOriginalPlotSizeSquareMeters(propertyPurchasePriceSplit.plot_size_sqm);
        setOriginalLandValuePerSquareMeter(propertyPurchasePriceSplit.land_value_per_sqm);
        setOriginalCoOwnershipNumerator(propertyPurchasePriceSplit.co_ownership_numerator);
        setOriginalCoOwnershipDenominator(propertyPurchasePriceSplit.co_ownership_denominator);
      } else {
        const defaults = getPurchasePriceSplitDefaults(SplitMode.STANDARD);
        setBuildingPercentage(defaults.building_percentage);
        setLandPercentage(defaults.land_percentage);
        setOriginalBuildingPercentage(defaults.building_percentage);
        setOriginalLandPercentage(defaults.land_percentage);
      }
    }
  }, [propertyId]);

  // Check if any changes were made
  useEffect(() => {
    const hasChanges =
      splitMode !== originalSplitMode ||
      buildingPercentage !== originalBuildingPercentage ||
      buildingValue !== originalBuildingValue ||
      landPercentage !== originalLandPercentage ||
      landValue !== originalLandValue ||
      plotSizeSquareMeters !== originalPlotSizeSquareMeters ||
      landValuePerSquareMeter !== originalLandValuePerSquareMeter ||
      coOwnershipNumerator !== originalCoOwnershipNumerator ||
      coOwnershipDenominator !== originalCoOwnershipDenominator;

    setIsEditing(hasChanges);
  }, [
    splitMode,
    buildingPercentage,
    buildingValue,
    landPercentage,
    landValue,
    plotSizeSquareMeters,
    landValuePerSquareMeter,
    coOwnershipNumerator,
    coOwnershipDenominator,
    originalSplitMode,
    originalBuildingPercentage,
    originalBuildingValue,
    originalLandPercentage,
    originalLandValue,
    originalPlotSizeSquareMeters,
    originalLandValuePerSquareMeter,
    originalCoOwnershipNumerator,
    originalCoOwnershipDenominator,
  ]);

  const handleModeChange = (mode: SplitMode) => {
    setSplitMode(mode);
    if (mode === SplitMode.STANDARD) {
      const defaults = getPurchasePriceSplitDefaults(SplitMode.STANDARD);
      setBuildingPercentage(defaults.building_percentage);
      setLandPercentage(defaults.land_percentage);
      setBuildingValue(null);
      setLandValue(null);
      setPlotSizeSquareMeters(null);
      setLandValuePerSquareMeter(null);
      setCoOwnershipNumerator(null);
      setCoOwnershipDenominator(null);
    }
  };

  const handleSave = () => {
    console.log('Saving purchase price split data...');
    setOriginalSplitMode(splitMode);
    setOriginalBuildingPercentage(buildingPercentage);
    setOriginalBuildingValue(buildingValue);
    setOriginalLandPercentage(landPercentage);
    setOriginalLandValue(landValue);
    setOriginalPlotSizeSquareMeters(plotSizeSquareMeters);
    setOriginalLandValuePerSquareMeter(landValuePerSquareMeter);
    setOriginalCoOwnershipNumerator(coOwnershipNumerator);
    setOriginalCoOwnershipDenominator(coOwnershipDenominator);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSplitMode(originalSplitMode);
    setBuildingPercentage(originalBuildingPercentage);
    setBuildingValue(originalBuildingValue);
    setLandPercentage(originalLandPercentage);
    setLandValue(originalLandValue);
    setPlotSizeSquareMeters(originalPlotSizeSquareMeters);
    setLandValuePerSquareMeter(originalLandValuePerSquareMeter);
    setCoOwnershipNumerator(originalCoOwnershipNumerator);
    setCoOwnershipDenominator(originalCoOwnershipDenominator);
    setIsEditing(false);
  };

  const handleRequestAppraisal = () => {
    console.log('Request appraisal for property:', propertyId);
  };

  const useCaseMenuItems = useMemo(() => 
    createUseCaseMenuItems(propertyId, 'SplitPurchasePrice', (route) => {
      router.push(route);
    }), 
    [propertyId, router]
  );

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Objekt nicht gefunden</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppNavigation />
      <main className="container mx-auto px-4 py-8">
        <Header
          title={`${property.street} ${property.house_number}`}
          subtitle={ExistingPropertiesUseCases.SplitPurchasePrice}
          image={
            property.image?.data && (
              <img
                src={`data:${property.image.format};base64,${property.image.data}`}
                alt={`${property.street} ${property.house_number}`}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )
          }
          actions={
            <Button
              label={ButtonLabels.UseCases}
              icon={<Layers />}
              variant="primary"
              menuItems={useCaseMenuItems}
            />
          }
        />

        <div className="mt-8 max-w-4xl">
          <div className="p-6 bg-card border border-border rounded-lg space-y-6">
            <div className="flex items-start gap-3">
              <Calculator className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                Teilen Sie den Kaufpreis zwischen Gebäude und Grund und Boden auf. Im Standardmodus wird eine
                Aufteilung von 80% Gebäude und 20% Grund und Boden verwendet. Im individuellen Modus können Sie
                eigene Werte angeben.
              </p>
            </div>

            {/* Calculation Mode */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Berechnungsmodus</h3>
              <div className="space-y-2">
                <RadioButton
                  label="Standard"
                  checked={splitMode === SplitMode.STANDARD}
                  onChange={() => handleModeChange(SplitMode.STANDARD)}
                />
                <RadioButton
                  label="Individuell"
                  checked={splitMode === SplitMode.INDIVIDUAL}
                  onChange={() => handleModeChange(SplitMode.INDIVIDUAL)}
                />
              </div>
            </div>

            {/* Building section */}
            <div className="mb-8">
              <h3 className="text-base font-medium text-foreground mb-4">Gebäude</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField
                  label="Prozent"
                  value={buildingPercentage?.toString() || ''}
                  onChange={(e) => setBuildingPercentage(Number(e.target.value) || 0)}
                  unit="%"
                  min={0}
                  max={100}
                />
                <NumberField
                  label="Wert"
                  value={buildingValue?.toString() || ''}
                  onChange={(e) => setBuildingValue(e.target.value ? Number(e.target.value) : null)}
                  unit="€"
                  min={0}
                />
              </div>
            </div>

            {/* Land section */}
            {splitMode === SplitMode.INDIVIDUAL && (
              <>
                <div className="mb-8">
                  <h3 className="text-base font-medium text-foreground mb-4">Grund und Boden</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumberField
                      label="Prozent"
                      value={landPercentage?.toString() || ''}
                      onChange={(e) => setLandPercentage(Number(e.target.value) || 0)}
                      unit="%"
                      min={0}
                      max={100}
                    />
                    <NumberField
                      label="Wert"
                      value={landValue?.toString() || ''}
                      onChange={(e) => setLandValue(e.target.value ? Number(e.target.value) : null)}
                      unit="€"
                      min={0}
                    />
                  </div>
                </div>

                {/* Additional info section */}
                <div>
                  <h3 className="text-base font-medium text-foreground mb-4">Zusätzliche Angaben</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumberField
                      label="Grundstücksgröße"
                      value={plotSizeSquareMeters?.toString() || ''}
                      onChange={(e) =>
                        setPlotSizeSquareMeters(e.target.value ? Number(e.target.value) : null)
                      }
                      unit="m²"
                      min={0}
                    />
                    <NumberField
                      label="Bodenrichtwert"
                      value={landValuePerSquareMeter?.toString() || ''}
                      onChange={(e) =>
                        setLandValuePerSquareMeter(e.target.value ? Number(e.target.value) : null)
                      }
                      unit="€"
                      min={0}
                    />
                    <NumberField
                      label="Miteigentumsanteil Zähler"
                      value={coOwnershipNumerator?.toString() || ''}
                      onChange={(e) =>
                        setCoOwnershipNumerator(e.target.value ? Number(e.target.value) : null)
                      }
                      min={0}
                    />
                    <NumberField
                      label="Miteigentumsanteil Nenner"
                      value={coOwnershipDenominator?.toString() || ''}
                      onChange={(e) =>
                        setCoOwnershipDenominator(e.target.value ? Number(e.target.value) : null)
                      }
                      min={1}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Sticky action bar */}
      <StickyActionBar
        show={isEditing}
        onGhost={handleCancel}
        onPrimary={handleSave}
        ghostLabel={ButtonLabels.Cancel}
        primaryLabel={ButtonLabels.Save}
        ghostIcon={< X />}
        primaryIcon={< Save />}
      />
    </div >
  );
}
