"use client";

import { Stepper } from '@/components/immonext-design';
import { AppNavigation } from '../../shared/AppNavigation';
import { PropertyValuationSteps } from '@/constants/PropertyValuationUseCases';

interface PropertyValuationLayoutProps {
  children: React.ReactNode;
  currentStep: number;
}

export function PropertyValuationLayout({ children, currentStep }: PropertyValuationLayoutProps) {
  // Convert steps to stepper format
  const stepperSteps = PropertyValuationSteps.map((step) => ({
    label: step.label,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - always shows property-valuation as active */}
      <AppNavigation />

      <main className="container mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper 
            steps={stepperSteps} 
            currentStep={currentStep}
          />
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
