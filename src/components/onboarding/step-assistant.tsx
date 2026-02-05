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
      className="flex items-center justify-between rounded-lg border border-[var(--ob-border)] bg-[var(--ob-surface)] px-4 py-3 transition-colors hover:bg-[var(--ob-surface-hover)]"
    >
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium text-[var(--ob-text-secondary)]">{label}</span>
        <span className="text-xs text-[var(--ob-text-muted)]">{description}</span>
      </div>
      <div
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-[var(--ob-toggle-active)]" : "bg-[var(--ob-muted)]"
        }`}
      >
        <motion.div
          className="absolute top-1 h-4 w-4 rounded-full bg-[var(--ob-text)]"
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
      className="flex flex-col gap-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--ob-text)]">
          Name your assistant
        </h2>
        <p className="mt-2 text-sm text-[var(--ob-text-tertiary)]">
          Give your AI assistant an identity and grant it access to your tools.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assistantName" className="text-xs font-medium uppercase tracking-wider text-[var(--ob-text-muted)]">
            Assistant Name
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
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--ob-text-muted)]">
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

      <button
        type="submit"
        disabled={!canProceed}
        className="onboarding-button mt-2"
      >
        Continue
      </button>
    </motion.form>
  )
}
