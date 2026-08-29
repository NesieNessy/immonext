import { Icons } from "@/components/common";
import { cn } from "@/lib/utils";

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

/**
 * x-position (as a CSS length) of step i's circle center, out of `n` steps —
 * a straight linear ramp from the first circle's center (one radius in from
 * the left edge) to the last circle's center (one radius in from the right
 * edge), so every circle is the same distance from its neighbors AND the
 * first/last circle still sits flush with the rest of the page.
 */
function stepCenterExpr(i: number, n: number): string {
  if (n <= 1) return '50%';
  const t = i / (n - 1);
  if (t <= 0) return 'var(--step-r)';
  if (t >= 1) return 'calc(100% - var(--step-r))';
  return `calc(var(--step-r) + (100% - 2 * var(--step-r)) * ${t})`;
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
  const animatedSegmentCount = Math.abs(progressStep - previousStep);
  const pointArrivalDelay = animatedSegmentCount > 0
    ? 800 + (animatedSegmentCount - 1) * 120
    : 0;

  return (
    // --step-r matches half of the circle's diameter (h-8/w-8 → sm:h-10/w-10)
    // so the connecting line and every circle line up exactly. The label
    // block is positioned absolutely below each circle (so it can't perturb
    // the perfectly even circle spacing) — lg:pb-10 reserves room for it
    // only at the breakpoint where labels actually render (hidden below lg).
    <div className={cn("relative box-content w-full h-8 sm:h-10 lg:pb-10 [--step-r:1rem] sm:[--step-r:1.25rem]", className)}>
      <div
        aria-hidden="true"
        className="absolute top-4 h-0.5 bg-muted sm:top-5"
        style={{ left: 'var(--step-r)', right: 'var(--step-r)' }}
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
        // `right` needs "100% - center(index+1)" as a CSS length; stepCenterExpr's
        // spacing is symmetric, so mirroring the index gives exactly that
        // without building a second calc() to subtract from 100%.
        const left = stepCenterExpr(index, steps.length);
        const right = stepCenterExpr(steps.length - 1 - (index + 1), steps.length);

        return (
          <div
            key={`${index}-${previousStep}-${progressStep}-${progressDirection}`}
            aria-hidden="true"
            className="absolute top-4 h-0.5 overflow-hidden sm:top-5"
            style={{ left, right }}
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
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const center = stepCenterExpr(index, steps.length);

        return (
          <StepContainer
            key={index}
            type={isClickable ? "button" : undefined}
            aria-label={isClickable ? `${step.label} öffnen` : undefined}
            aria-current={isCurrent ? 'step' : undefined}
            aria-disabled={isClickable ? undefined : true}
            onClick={isClickable ? () => onStepClick?.(index) : undefined}
            className={cn(
              // Every hover/focus effect below is drawn *inside* this fixed
              // box (brightness filter, inset ring) — nothing bleeds past
              // its edges, so it can never be clipped even flush against
              // the page edge.
              "absolute top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-sm transition-[background-color,color,filter] duration-200 sm:h-10 sm:w-10 sm:text-base",
              isCompleted && "bg-secondary text-secondary-foreground",
              isCurrent && !isArriving && "bg-primary text-primary-foreground",
              isArriving && progressDirection === 'forward' && 'stepper-point-arrive-forward',
              isArriving && progressDirection === 'backward' && 'stepper-point-arrive-backward',
              !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
              isClickable
                ? "cursor-pointer hover:brightness-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                : "cursor-not-allowed"
            )}
            style={{ left: center, ...(isArriving ? { animationDelay: `${pointArrivalDelay}ms` } : {}) }}
          >
            {isCompleted ? (
              <Icons.Check size={20} />
            ) : (
              <span>{index + 1}</span>
            )}
            <span
              className={cn(
                "absolute top-full mt-2 hidden w-max max-w-40 lg:block",
                isFirst ? "left-0 text-left" : isLast ? "right-0 text-right" : "left-1/2 -translate-x-1/2 text-center"
              )}
            >
              <span className={cn(
                "block text-sm font-medium",
                isCurrent && "text-primary",
                isClickable && !isCurrent && "text-foreground",
                !isCurrent && "text-muted-foreground"
              )}>
                {step.label}
              </span>
              {step.description && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {step.description}
                </span>
              )}
            </span>
          </StepContainer>
        );
      })}
    </div>
  );
}
