import React from 'react';
import { Check } from 'lucide-react';

interface OnboardingStepperProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { step: 1, label: 'Dados da Loja' },
  { step: 2, label: 'Operação & Mesas' },
  { step: 3, label: 'Subconta Bancária' },
] as const;

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  return (
    <nav aria-label="Progresso do onboarding" className="flex items-center gap-4 sm:gap-6">
      {steps.map((item, index) => {
        const isCompleted = currentStep > item.step;
        const isActive = currentStep === item.step;

        return (
          <React.Fragment key={item.step}>
            {index > 0 && (
              <div
                className={`w-6 sm:w-8 h-[2px] transition-colors ${
                  isCompleted ? 'bg-amber-500' : 'bg-zinc-200'
                }`}
              />
            )}
            <div
              className={`flex items-center gap-2 text-xs sm:text-[13.5px] font-semibold transition-colors ${
                isActive ? 'text-zinc-950 font-bold' : isCompleted ? 'text-zinc-800' : 'text-zinc-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                    : isActive
                      ? 'bg-amber-500 text-white font-extrabold ring-4 ring-amber-500/20 shadow-sm'
                      : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : item.step}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
