"use client";

import { Stepper } from '@/components/ui';
import { PropertyValuationSteps } from '@/constants/PropertyValuationUseCases';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface PropertyValuationLayoutProps {
  children: React.ReactNode;
  currentStep: number;
}

export function PropertyValuationLayout({ children, currentStep }: PropertyValuationLayoutProps) {
  const router = useRouter();
  const [maxReachedStep, setMaxReachedStep] = useState(currentStep);

  // Convert steps to stepper format
  const stepperSteps = PropertyValuationSteps.map((step) => ({
    label: step.label,
  }));
  const storageKey = useMemo(() => {
    if (typeof window === 'undefined') return 'detail-check:max-step:draft';
    const params = new URLSearchParams(window.location.search);
    const quickCheckId = params.get('quickCheckId');
    return quickCheckId ? `detail-check:max-step:quick-check:${quickCheckId}` : 'detail-check:max-step:draft';
  }, []);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(storageKey));
    const nextMax = Number.isFinite(stored) ? Math.max(stored, currentStep) : currentStep;
    window.localStorage.setItem(storageKey, String(nextMax));
    setMaxReachedStep(nextMax);
  }, [currentStep, storageKey]);

  const navigateToStep = (stepIndex: number) => {
    if (stepIndex > maxReachedStep) return;
    const target = PropertyValuationSteps[stepIndex];
    if (!target?.path) return;
    const suffix = typeof window === 'undefined' ? '' : window.location.search;
    router.push(`${target.path}${suffix}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - always shows property-valuation as active */}
      <main className="container mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper 
            steps={stepperSteps} 
            currentStep={currentStep}
            maxClickableStep={maxReachedStep}
            onStepClick={navigateToStep}
          />
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
