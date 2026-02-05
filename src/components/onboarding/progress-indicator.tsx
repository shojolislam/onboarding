"use client"

import { motion } from "framer-motion"

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  isDark: boolean
}

export function ProgressIndicator({ currentStep, totalSteps, isDark }: ProgressIndicatorProps) {
  const activeColor = isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)"
  const completedColor = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)"
  const inactiveColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isCompleted = step < currentStep

        return (
          <motion.div
            key={step}
            className="relative flex items-center justify-center"
            initial={false}
          >
            <motion.div
              className="rounded-full"
              animate={{
                width: isActive ? 32 : 8,
                height: 8,
                backgroundColor: isActive
                  ? activeColor
                  : isCompleted
                    ? completedColor
                    : inactiveColor,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
