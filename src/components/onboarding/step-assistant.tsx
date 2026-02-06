"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, ArrowLeft } from "lucide-react"

interface StepAssistantProps {
  assistantName: string
  calendarAccess: boolean
  emailAccess: boolean
  onNext: (data: { assistantName: string; calendarAccess: boolean; emailAccess: boolean }) => void
  onAssistantNameChange: (name: string) => void
  onFieldChange?: (data: { calendarAccess: boolean; emailAccess: boolean }) => void
  onBack?: () => void
}

export function StepAssistant({
  assistantName: initialName,
  calendarAccess,
  emailAccess,
  onNext,
  onAssistantNameChange,
  onBack,
}: StepAssistantProps) {
  const [assistantName, setAssistantName] = useState(initialName)
  const [displayedText, setDisplayedText] = useState("")
  const fullText = "Name your assistant"

  // Typewriter effect
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [displayedText])

  const canProceed = assistantName.trim().length > 0

  const handleNameChange = (value: string) => {
    setAssistantName(value)
    onAssistantNameChange(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed) {
      onNext({
        assistantName: assistantName.trim(),
        calendarAccess,
        emailAccess,
      })
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 font-[family-name:var(--font-geist-sans)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Typewriter Title - smaller, mono */}
      <h2 className="font-[family-name:var(--font-geist-mono)] text-2xl tracking-tight text-[var(--ob-text)]">
        {displayedText}
      </h2>

      {/* Large input */}
      <input
        type="text"
        value={assistantName}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="e.g. Atlas, Nova, Cortex"
        className="w-full bg-transparent border-none outline-none text-5xl font-light text-[var(--ob-text)] placeholder:text-[var(--ob-text-muted)] py-4"
        autoFocus
      />

      {/* Navigation - left arrow on left, right arrow on far right */}
      <div className="flex justify-between mt-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--ob-border)] text-[var(--ob-text)] transition-colors hover:bg-[var(--ob-muted)]"
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div />
        )}
        <motion.button
          type="submit"
          disabled={!canProceed}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ob-btn-primary-bg)] text-[var(--ob-btn-primary-text)] transition-colors hover:bg-[var(--ob-btn-primary-bg-hover)] disabled:opacity-40"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: canProceed ? 1 : 0.4, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowRight size={24} />
        </motion.button>
      </div>
    </motion.form>
  )
}
