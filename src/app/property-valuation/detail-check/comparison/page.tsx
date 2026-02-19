"use client";

import { Header } from '@/components/immonext-design';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function ComparisonPage() {
  return (
    <PropertyValuationLayout currentStep={8}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Vergleichs-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
