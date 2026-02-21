"use client";

import { Header } from '@/components/ui';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function CalculatorPage() {
  return (
    <PropertyValuationLayout currentStep={6}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Kalkulator-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
