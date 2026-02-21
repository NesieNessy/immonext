"use client";

import { Header } from '@/components/ui';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function DepreciationPage() {
  return (
    <PropertyValuationLayout currentStep={4}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Abschreibungs-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
