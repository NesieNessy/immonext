"use client";

import { Header } from '@/components/immonext-design';
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
