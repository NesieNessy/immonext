"use client";

import { Header } from '@/components/immonext-design';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function PropertyDataPage() {
  return (
    <PropertyValuationLayout currentStep={0}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Objektdaten-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
