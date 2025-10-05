import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

const Stepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center space-x-2 md:space-x-8">
        {steps.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentStep;
          const isCurrent = stepIdx === currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
                    isCompleted
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : isCurrent
                      ? 'border-primary-600 text-primary-600 bg-white'
                      : 'border-gray-300 text-gray-500 bg-white',
                    isClickable && 'cursor-pointer hover:border-primary-500'
                  )}
                  onClick={isClickable ? () => onStepClick(stepIdx) : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{stepIdx + 1}</span>
                  )}
                </div>
                <div className="ml-3 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted
                        ? 'text-primary-600'
                        : isCurrent
                        ? 'text-primary-600'
                        : 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  )}
                </div>
              </div>
              {stepIdx < steps.length - 1 && (
                <div
                  className={cn(
                    'hidden md:block ml-8 w-full h-0.5',
                    isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;


