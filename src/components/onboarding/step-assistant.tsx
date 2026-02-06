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

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  label: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between py-4 transition-colors text-left group"
    >
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-xl font-light text-[var(--ob-text)]">{label}</span>
        <span className="text-sm text-[var(--ob-text-tertiary)]">{description}</span>
      </div>
      <div
        className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ml-4 ${
          checked ? "bg-[var(--ob-btn-primary-bg)]" : "bg-[var(--ob-border)]"
        }`}
      >
        <motion.div
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  )
}

export function StepAssistant({
  assistantName: initialName,
  calendarAccess: initialCalendar,
  emailAccess: initialEmail,
  onNext,
  onAssistantNameChange,
  onFieldChange,
  onBack,
}: StepAssistantProps) {
  const [assistantName, setAssistantName] = useState(initialName)
  const [calendarAccess, setCalendarAccess] = useState(initialCalendar)
  const [emailAccess, setEmailAccess] = useState(initialEmail)
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
      className="flex flex-col items-start gap-10 font-[family-name:var(--font-geist-sans)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Typewriter Title */}
      <h2 className="text-5xl font-light tracking-tight text-[var(--ob-text)]">
        {displayedText}
      </h2>

      {/* Form fields */}
      <div className="w-full flex flex-col gap-8">
        <input
          type="text"
          value={assistantName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Atlas, Nova, Cortex"
          className="w-full bg-transparent border-none outline-none text-4xl font-light text-[var(--ob-text)] placeholder:text-[var(--ob-text-muted)] py-4"
          autoFocus
        />

        <div className="flex flex-col divide-y divide-[var(--ob-border)]">
          <Toggle
            checked={calendarAccess}
            onChange={(val) => {
              setCalendarAccess(val)
              onFieldChange?.({ calendarAccess: val, emailAccess })
            }}
            label="Calendar Access"
            description="Schedule meetings and check availability"
          />
          <Toggle
            checked={emailAccess}
            onChange={(val) => {
              setEmailAccess(val)
              onFieldChange?.({ calendarAccess, emailAccess: val })
            }}
            label="Email Access"
            description="Read and draft emails on your behalf"
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--ob-border)] text-[var(--ob-text)] transition-colors hover:bg-[var(--ob-muted)]"
          >
            <ArrowLeft size={24} />
          </button>
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
