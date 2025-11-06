import { motion } from "motion/react";
import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    label: string;
    completed: boolean;
  }>;
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-surface-secondary border-b border-border-primary py-4">
      <div className="container-professional">
        {/* Mobile Progress Bar */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-small text-secondary font-medium">
              Étape {currentStep} sur {totalSteps}
            </span>
            <span className="text-body-small text-kongo-black font-semibold">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          
          <div className="w-full bg-surface-tertiary rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-kongo-lime rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          <div className="mt-3">
            <span className="text-body-small text-kongo-black font-medium">
              {steps[currentStep - 1]?.label}
            </span>
          </div>
        </div>

        {/* Desktop Steps Indicator */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = step.completed;
              const isCurrent = stepNumber === currentStep;
              const isPast = stepNumber < currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div className="relative">
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: isCompleted || isCurrent 
                            ? "var(--kongo-lime)" 
                            : "var(--surface-tertiary)",
                          borderColor: isCompleted || isCurrent 
                            ? "var(--kongo-lime)" 
                            : "var(--border-secondary)",
                          scale: isCurrent ? 1.1 : 1
                        }}
                        className={`
                          w-10 h-10 rounded-full border-2 flex items-center justify-center
                          transition-all duration-300 relative z-10
                          ${isCurrent ? 'shadow-kongo-lime' : ''}
                        `}
                      >
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <Check className="w-5 h-5 text-kongo-black" />
                          </motion.div>
                        ) : (
                          <span className={`
                            text-body-small font-semibold
                            ${isCurrent || isPast ? 'text-kongo-black' : 'text-tertiary'}
                          `}>
                            {stepNumber}
                          </span>
                        )}
                      </motion.div>
                      
                      {/* Pulse animation for current step */}
                      {isCurrent && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-kongo-lime"
                          initial={{ opacity: 0, scale: 1 }}
                          animate={{ 
                            opacity: [0.5, 0], 
                            scale: [1, 1.5] 
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="ml-3 hidden lg:block">
                      <div className={`
                        text-body-small font-medium
                        ${isCurrent ? 'text-kongo-black' : 
                          isCompleted ? 'text-success' : 'text-secondary'}
                      `}>
                        {step.label}
                      </div>
                      {isCurrent && (
                        <div className="text-caption text-tertiary">
                          En cours...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className="h-0.5 bg-surface-tertiary relative overflow-hidden rounded-full">
                        <motion.div
                          className="h-full bg-kongo-lime"
                          initial={{ width: "0%" }}
                          animate={{ 
                            width: isPast || (isCurrent && index < currentStep - 1) ? "100%" : "0%" 
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}