import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  maxClickableStep?: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, maxClickableStep = currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;
          const isClickable = Boolean(onStepClick) && index <= maxClickableStep;
          const StepContainer = isClickable ? "button" : "div";

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <StepContainer
                type={isClickable ? "button" : undefined}
                aria-label={isClickable ? `${step.label} öffnen` : undefined}
                aria-current={isCurrent ? 'step' : undefined}
                aria-disabled={isClickable ? undefined : true}
                onClick={isClickable ? () => onStepClick?.(index) : undefined}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-lg",
                  isClickable && "cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20",
                  !isClickable && "cursor-not-allowed"
                )}
              >
                <div
                  aria-disabled={isClickable ? undefined : true}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                    isCompleted && "bg-secondary text-secondary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                    isClickable && "group-hover:ring-4 group-hover:ring-primary/10"
                  )}
                >
                  {isCompleted ? (
                    <Check size={20} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="text-center">
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
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-all duration-200",
                    isCompleted ? "bg-secondary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
