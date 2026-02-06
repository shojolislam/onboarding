"use client"

import { useState } from "react"
import { motion } from "framer-motion"

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
      className="flex items-center justify-between rounded-lg border border-[var(--ob-border)] bg-[var(--ob-surface)] px-4 py-4 transition-colors hover:bg-[var(--ob-surface-hover)] text-left"
    >
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-sm font-medium text-[var(--ob-text)]">{label}</span>
        <span className="text-sm text-[var(--ob-text-tertiary)]">{description}</span>
      </div>
      <div
        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ml-4 ${
          checked ? "bg-[var(--ob-toggle-active)]" : "bg-[var(--ob-border)]"
        }`}
      >
        <motion.div
          className={`absolute top-1 h-4 w-4 rounded-full transition-colors ${
            checked ? "bg-white" : "bg-[var(--ob-text-muted)]"
          }`}
          animate={{ left: checked ? 22 : 4 }}
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
      className="flex flex-col gap-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-[var(--ob-text-muted)] mb-2">
          Your Assistant
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--ob-text)]">
          Name your assistant
        </h2>
      </div>

      {/* Form fields */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="assistantName" className="text-sm font-medium text-[var(--ob-text)]">
            Assistant name <span className="text-[var(--ob-text-muted)]">*</span>
          </label>
          <input
            id="assistantName"
            type="text"
            value={assistantName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Atlas, Nova, Cortex"
            className="onboarding-input"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-[var(--ob-text)]">
            Permissions
          </span>
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

      {/* Buttons */}
      <div className="flex items-center gap-4 mt-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="onboarding-button-secondary"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={!canProceed}
          className="onboarding-button flex-1"
        >
          Continue
        </button>
      </div>
    </motion.form>
  )
}
