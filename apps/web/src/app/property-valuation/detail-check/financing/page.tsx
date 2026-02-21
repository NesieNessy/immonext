"use client";

// Header import removed - not used
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function FinancingPage() {
  return (
    <PropertyValuationLayout currentStep={3}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Finanzierungs-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
