interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  current: number;
  className?: string;
}

export function Stepper({ steps, current, className = '' }: StepperProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, i) => {
        const state = i < current ? 'completed' : i === current ? 'active' : 'upcoming';
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                transition-all duration-300
                ${state === 'completed' ? 'bg-brand-600 text-white' : ''}
                ${state === 'active' ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400 ring-offset-2' : ''}
                ${state === 'upcoming' ? 'bg-gray-100 text-text-tertiary' : ''}
              `}>
                {state === 'completed' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 4L6 11.5L2.5 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className={`
                mt-1.5 text-xs font-medium whitespace-nowrap
                ${state === 'active' ? 'text-brand-700' : state === 'completed' ? 'text-brand-600' : 'text-text-tertiary'}
              `}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-3 mt-[-1.25rem] rounded-full
                ${i < current ? 'bg-brand-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}
