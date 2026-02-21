"use client";

import { Header } from '@/components/ui';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

export default function MacroLocationPage() {
  return (
    <PropertyValuationLayout currentStep={7}>
      <div className="mt-8">
        <p className="text-muted-foreground">
          Makrolage-Inhalt wird hier angezeigt.
        </p>
      </div>
    </PropertyValuationLayout>
  );
}
