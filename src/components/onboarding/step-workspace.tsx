"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"

interface StepWorkspaceProps {
  workspaceName: string
  inviteEmails: string[]
  onNext: (data: { workspaceName: string; inviteEmails: string[] }) => void
  onFieldChange?: (data: { workspaceName: string; inviteEmails: string[] }) => void
}

export function StepWorkspace({
  workspaceName: initialWorkspace,
  inviteEmails: initialEmails,
  onNext,
  onFieldChange,
}: StepWorkspaceProps) {
  const [workspaceName, setWorkspaceName] = useState(initialWorkspace)
  const [inviteEmails, setInviteEmails] = useState<string[]>(initialEmails)
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState("")

  const canProceed = workspaceName.trim().length > 0

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const addEmail = useCallback(() => {
    const email = emailInput.trim()
    if (!email) return

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    if (inviteEmails.includes(email)) {
      setEmailError("This email has already been added")
      return
    }

    const newEmails = [...inviteEmails, email]
    setInviteEmails(newEmails)
    setEmailInput("")
    setEmailError("")
    onFieldChange?.({ workspaceName, inviteEmails: newEmails })
  }, [emailInput, inviteEmails, workspaceName, onFieldChange])

  const removeEmail = (email: string) => {
    const newEmails = inviteEmails.filter((e) => e !== email)
    setInviteEmails(newEmails)
    onFieldChange?.({ workspaceName, inviteEmails: newEmails })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addEmail()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed) {
      onNext({ workspaceName: workspaceName.trim(), inviteEmails })
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
          Set up your workspace
        </h2>
        <p className="mt-2 text-sm text-[var(--ob-text-tertiary)]">
          Create a shared space for your team.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="workspaceName" className="text-xs font-medium uppercase tracking-wider text-[var(--ob-text-muted)]">
            Workspace Name
          </label>
          <input
            id="workspaceName"
            type="text"
            value={workspaceName}
            onChange={(e) => {
              setWorkspaceName(e.target.value)
              onFieldChange?.({ workspaceName: e.target.value, inviteEmails })
            }}
            placeholder="e.g. Acme Corp"
            className="onboarding-input"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="inviteEmails" className="text-xs font-medium uppercase tracking-wider text-[var(--ob-text-muted)]">
            Invite Members
            <span className="ml-1 normal-case tracking-normal text-[var(--ob-text-muted)]">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="inviteEmails"
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value)
                setEmailError("")
              }}
              onKeyDown={handleKeyDown}
              placeholder="colleague@company.com"
              className="onboarding-input flex-1"
            />
            <button
              type="button"
              onClick={addEmail}
              className="shrink-0 rounded-lg bg-[var(--ob-muted)] px-4 text-sm font-medium text-[var(--ob-text-secondary)] transition-colors hover:bg-[var(--ob-muted-hover)] hover:text-[var(--ob-text)]"
            >
              Add
            </button>
          </div>
          {emailError && (
            <p className="text-xs text-red-400">{emailError}</p>
          )}

          {inviteEmails.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {inviteEmails.map((email) => (
                <motion.span
                  key={email}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ob-muted)] px-3 py-1 text-xs text-[var(--ob-text-secondary)]"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="text-[var(--ob-text-muted)] transition-colors hover:text-[var(--ob-text-secondary)]"
                  >
                    <X size={12} />
                  </button>
                </motion.span>
              ))}
            </div>
          )}
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
