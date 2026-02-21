"use client";

// Header import removed - not used
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function LeasingOrRentalsPage() {
  return (
    <PropertyValuationLayout currentStep={2}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Vermietungs-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
