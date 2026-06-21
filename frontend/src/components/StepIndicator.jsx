import React from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done   = currentStep > step.id
        const active = currentStep === step.id
        const last   = i === steps.length - 1

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-250"
                style={
                  done
                    ? { background: '#34A853', color: '#fff', boxShadow: '0 0 12px rgba(52,168,83,0.30)' }
                    : active
                    ? { border: '2px solid #4285F4', color: '#4285F4', background: 'rgba(66,133,244,0.08)', boxShadow: '0 0 16px rgba(66,133,244,0.25)' }
                    : { border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.40)', background: 'transparent' }
                }
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : step.id}
              </div>
              <span
                className="text-[11px] hidden sm:block font-medium transition-colors duration-200 tracking-wide"
                style={
                  active ? { color: '#4285F4' }
                  : done  ? { color: 'rgba(255,255,255,0.60)' }
                  :         { color: 'rgba(255,255,255,0.38)' }
                }
              >
                {step.label}
              </span>
            </div>

            {!last && (
              <div
                className="flex-1 h-px mx-3 mb-5 sm:mb-0 transition-all duration-400"
                style={{
                  background: done
                    ? 'linear-gradient(90deg, #34A853, #4285F4)'
                    : 'rgba(255,255,255,0.07)',
                }}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
