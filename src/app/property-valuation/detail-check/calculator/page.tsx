"use client";

import { Header } from '@/components/immonext-design';
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
