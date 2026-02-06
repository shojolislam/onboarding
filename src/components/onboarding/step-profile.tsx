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
      className="flex flex-col gap-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-[var(--ob-text-muted)] mb-2">
          Your Profile
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--ob-text)]">
          Tell us about yourself
        </h2>
      </div>

      {/* Form fields */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-[var(--ob-text)]">
            Name <span className="text-[var(--ob-text-muted)]">*</span>
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

        <div className="flex flex-col gap-2">
          <label htmlFor="companyName" className="text-sm font-medium text-[var(--ob-text)]">
            Company name <span className="text-[var(--ob-text-muted)]">*</span>
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

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-[var(--ob-text)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="onboarding-input opacity-60 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Button */}
      <button
        type="submit"
        disabled={!canProceed}
        className="onboarding-button mt-4"
      >
        Continue
      </button>
    </motion.form>
  )
}
