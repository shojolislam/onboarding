"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"

interface StepCompleteProps {
  assistantName: string
  onProcessingStart: () => void
  onComplete: () => void
}

const setupTasks = [
  "Creating your workspace",
  "Configuring permissions",
  "Training your assistant",
  "Finalizing setup",
]

export function StepComplete({ assistantName, onProcessingStart, onComplete }: StepCompleteProps) {
  const [isComplete, setIsComplete] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [displayedText, setDisplayedText] = useState("")

  const processingText = "Setting up..."
  const completeText = "Your workspace is ready"
  const fullText = isComplete ? completeText : processingText

  // Typewriter effect
  useEffect(() => {
    setDisplayedText("")
  }, [isComplete])

  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [displayedText, fullText])

  useEffect(() => {
    onProcessingStart()

    // Simulate task completion
    const taskTimers: NodeJS.Timeout[] = []
    setupTasks.forEach((_, index) => {
      const timer = setTimeout(() => {
        setCompletedTasks(prev => [...prev, index])
      }, 600 + index * 600)
      taskTimers.push(timer)
    })

    // Complete after all tasks
    const completeTimer = setTimeout(() => {
      setIsComplete(true)
      onComplete()
    }, 600 + setupTasks.length * 600 + 400)

    return () => {
      taskTimers.forEach(clearTimeout)
      clearTimeout(completeTimer)
    }
  }, [onProcessingStart, onComplete])

  return (
    <motion.div
      className="flex flex-col items-center text-center font-[family-name:var(--font-geist-sans)] -mt-16 pb-24"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key="processing"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title */}
            <h2 className="font-[family-name:var(--font-geist-mono)] text-5xl font-light tracking-tight text-[var(--ob-text)]">
              {displayedText}
            </h2>

            {/* Checklist */}
            <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
              {setupTasks.map((task, index) => (
                <motion.div
                  key={task}
                  className="flex items-center gap-3 text-left"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                    completedTasks.includes(index)
                      ? "bg-[var(--ob-btn-primary-bg)]"
                      : "border border-[var(--ob-border)]"
                  }`}>
                    {completedTasks.includes(index) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check size={12} className="text-[var(--ob-btn-primary-text)]" />
                      </motion.div>
                    )}
                  </div>
                  <span className={`text-base transition-colors ${
                    completedTasks.includes(index)
                      ? "text-[var(--ob-text)]"
                      : "text-[var(--ob-text-muted)]"
                  }`}>
                    {task}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Title - large */}
            <motion.h2
              className="font-[family-name:var(--font-geist-mono)] text-5xl font-light tracking-tight text-[var(--ob-text)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {displayedText}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-xl font-light text-[var(--ob-text-tertiary)]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {assistantName ? `${assistantName} is ready to help you.` : "Let's get started."}
            </motion.p>

            {/* Go to Dashboard - centered */}
            <motion.button
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ob-btn-primary-bg)] text-[var(--ob-btn-primary-text)] transition-colors hover:bg-[var(--ob-btn-primary-bg-hover)] mt-2"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => {
                // Navigate to dashboard or main app
              }}
            >
              <ArrowRight size={24} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
