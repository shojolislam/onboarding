"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

interface StepCompleteProps {
  assistantName: string
  onProcessingStart: () => void
  onComplete: () => void
}

const PROCESSING_STEPS = [
  "Configuring workspace...",
  "Setting up permissions...",
  "Training assistant...",
  "Finalizing setup...",
]

export function StepComplete({ assistantName, onProcessingStart, onComplete }: StepCompleteProps) {
  const [processingStep, setProcessingStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    onProcessingStart()

    const timers: NodeJS.Timeout[] = []

    PROCESSING_STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setProcessingStep(i + 1)
        }, (i + 1) * 1200)
      )
    })

    timers.push(
      setTimeout(() => {
        setIsComplete(true)
        onComplete()
      }, PROCESSING_STEPS.length * 1200 + 800)
    )

    return () => timers.forEach(clearTimeout)
  }, [onProcessingStart, onComplete])

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-8 text-center"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key="processing"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Spinner */}
            <div className="relative h-12 w-12">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[var(--ob-border)]"
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--ob-text-secondary)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--ob-text)]">
                Setting up {assistantName}
              </h2>
              <div className="flex flex-col gap-2">
                {PROCESSING_STEPS.map((step, i) => (
                  <motion.div
                    key={step}
                    className="flex items-center gap-2 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={
                      processingStep > i
                        ? { opacity: 1, x: 0 }
                        : processingStep === i
                          ? { opacity: 0.5, x: 0 }
                          : { opacity: 0.2, x: 0 }
                    }
                    transition={{ duration: 0.3 }}
                  >
                    {processingStep > i ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <div className="h-3.5 w-3.5" />
                    )}
                    <span className={processingStep > i ? "text-[var(--ob-text-tertiary)]" : "text-[var(--ob-text-muted)]"}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Success checkmark */}
            <motion.div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ob-muted)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <Check size={28} className="text-[var(--ob-text)]" />
            </motion.div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--ob-text)]">
                {assistantName} is ready
              </h2>
              <p className="text-sm text-[var(--ob-text-tertiary)]">
                Your workspace has been configured. Let&apos;s get started.
              </p>
            </div>

            <motion.button
              className="onboarding-button mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => {
                // Navigate to dashboard or main app
              }}
            >
              Go to Dashboard
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
