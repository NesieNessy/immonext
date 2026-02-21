"use client";

import { Header } from '@/components/ui';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function AcquisitionCostsPage() {
  return (
    <PropertyValuationLayout currentStep={1}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Kaufkosten-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
