"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface StepProfileProps {
  name: string
  companyName: string
  email: string
  onNext: (data: { name: string; companyName: string }) => void
  onFieldChange?: (data: { name: string; companyName: string }) => void
}

export function StepProfile({ name: initialName, companyName: initialCompany, email, onNext, onFieldChange }: StepProfileProps) {
  const [name, setName] = useState(initialName)
  const [companyName, setCompanyName] = useState(initialCompany)

  const handleNameChange = (val: string) => {
    setName(val)
    onFieldChange?.({ name: val, companyName })
  }
  const handleCompanyChange = (val: string) => {
    setCompanyName(val)
    onFieldChange?.({ name, companyName: val })
  }

  const canProceed = name.trim().length > 0 && companyName.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed) {
      onNext({ name: name.trim(), companyName: companyName.trim() })
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
          Tell us about yourself
        </h2>
        <p className="mt-2 text-sm text-[var(--ob-text-tertiary)]">
          We&apos;ll use this to personalize your experience.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-[var(--ob-text-muted)]">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Your full name"
            className="onboarding-input"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="companyName" className="text-xs font-medium uppercase tracking-wider text-[var(--ob-text-muted)]">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => handleCompanyChange(e.target.value)}
            placeholder="Your company"
            className="onboarding-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-[var(--ob-text-muted)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="onboarding-input opacity-50 cursor-not-allowed"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!canProceed}
        className="onboarding-button mt-2"
      >
        Next
      </button>
    </motion.form>
  )
}
