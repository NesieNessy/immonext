"use client";

import { Header } from '@/components/ui';
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
