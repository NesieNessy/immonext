import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  previousStep?: number;
  progressStep?: number;
  progressDirection?: 'forward' | 'backward' | 'none';
  maxClickableStep?: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  previousStep = currentStep,
  progressStep = currentStep,
  progressDirection = 'none',
  maxClickableStep = currentStep,
  onStepClick,
  className,
}: StepperProps) {
  const lineInsetPercent = steps.length > 0 ? 50 / steps.length : 0;
  const segmentWidthPercent = steps.length > 0 ? 100 / steps.length : 0;
  const animatedSegmentCount = Math.abs(progressStep - previousStep);
  const pointArrivalDelay = animatedSegmentCount > 0
    ? 800 + (animatedSegmentCount - 1) * 120
    : 0;

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative grid items-start"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        <div
          aria-hidden="true"
          className="absolute top-4 h-0.5 bg-muted sm:top-5"
          style={{ left: `${lineInsetPercent}%`, right: `${lineInsetPercent}%` }}
        />

        {steps.slice(0, -1).map((_, index) => {
          const fillsForward = progressDirection === 'forward'
            && index >= previousStep
            && index < progressStep;
          const emptiesBackward = progressDirection === 'backward'
            && index >= progressStep
            && index < previousStep;
          const isFilled = index < progressStep && !fillsForward;
          const animationDelay = fillsForward
            ? (index - previousStep) * 120
            : emptiesBackward
              ? (previousStep - index - 1) * 120
              : 0;

          return (
            <div
              key={`${index}-${previousStep}-${progressStep}-${progressDirection}`}
              aria-hidden="true"
              className="absolute top-4 h-0.5 overflow-hidden sm:top-5"
              style={{
                left: `${lineInsetPercent + index * segmentWidthPercent}%`,
                width: `${segmentWidthPercent}%`,
              }}
            >
              <div
                className={cn(
                  'h-full w-full origin-left bg-secondary',
                  fillsForward && 'stepper-segment-fill-forward',
                  emptiesBackward && 'stepper-segment-fill-backward',
                  !fillsForward && !emptiesBackward && (isFilled ? 'scale-x-100' : 'scale-x-0'),
                )}
                style={{ animationDelay: `${animationDelay}ms` }}
              />
            </div>
          );
        })}

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isArriving = isCurrent
            && progressDirection !== 'none'
            && previousStep !== progressStep;
          const isClickable = Boolean(onStepClick) && index <= maxClickableStep;
          const StepContainer = isClickable ? "button" : "div";

          return (
            <div key={index} className="relative z-10 flex min-w-0 justify-center">
              <StepContainer
                type={isClickable ? "button" : undefined}
                aria-label={isClickable ? `${step.label} öffnen` : undefined}
                aria-current={isCurrent ? 'step' : undefined}
                aria-disabled={isClickable ? undefined : true}
                onClick={isClickable ? () => onStepClick?.(index) : undefined}
                className={cn(
                  "group flex min-w-0 flex-col items-center gap-2 rounded-lg",
                  isClickable && "cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20",
                  !isClickable && "cursor-not-allowed"
                )}
              >
                <div
                  aria-disabled={isClickable ? undefined : true}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-200 sm:h-10 sm:w-10 sm:text-base",
                    isCompleted && "bg-secondary text-secondary-foreground",
                    isCurrent && !isArriving && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isArriving && progressDirection === 'forward' && 'stepper-point-arrive-forward',
                    isArriving && progressDirection === 'backward' && 'stepper-point-arrive-backward',
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                    isClickable && "group-hover:ring-4 group-hover:ring-primary/10"
                  )}
                  style={isArriving ? { animationDelay: `${pointArrivalDelay}ms` } : undefined}
                >
                  {isCompleted ? (
                    <Check size={20} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="hidden min-w-0 text-center lg:block">
                  <p className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-primary",
                    isClickable && !isCurrent && "text-foreground",
                    !isCurrent && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </StepContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
