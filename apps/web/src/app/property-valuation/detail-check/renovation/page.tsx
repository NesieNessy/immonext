"use client";

// Header import removed - not used
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function RenovationPage() {
  return (
    <PropertyValuationLayout currentStep={5}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Sanierungs-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
