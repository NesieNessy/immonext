"use client";

import { Header } from '@/components/immonext-design';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function ResultPage() {
  return (
    <PropertyValuationLayout currentStep={9}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Ergebnis-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
