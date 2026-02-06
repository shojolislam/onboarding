"use client"

import { motion } from "framer-motion"

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  isDark: boolean
}

export function ProgressIndicator({ currentStep, totalSteps, isDark }: ProgressIndicatorProps) {
  const activeColor = isDark ? "rgba(255, 255, 255, 0.9)" : "#1a1a1a"
  const completedColor = isDark ? "rgba(255, 255, 255, 0.5)" : "#6b7280"
  const inactiveColor = isDark ? "rgba(255, 255, 255, 0.2)" : "#d1d5db"

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isCompleted = step < currentStep

        return (
          <motion.div
            key={step}
            className="h-[3px] w-5 rounded-full"
            animate={{
              backgroundColor: isActive || isCompleted
                ? (isActive ? activeColor : completedColor)
                : inactiveColor,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        )
      })}
    </div>
  )
}
