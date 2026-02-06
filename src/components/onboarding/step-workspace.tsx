"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { X, ArrowRight, ArrowLeft } from "lucide-react"

interface StepWorkspaceProps {
  workspaceName: string
  inviteEmails: string[]
  onNext: (data: { workspaceName: string; inviteEmails: string[] }) => void
  onFieldChange?: (data: { workspaceName: string; inviteEmails: string[] }) => void
  onBack?: () => void
}

export function StepWorkspace({
  workspaceName: initialWorkspace,
  inviteEmails: initialEmails,
  onNext,
  onFieldChange,
  onBack,
}: StepWorkspaceProps) {
  const [workspaceName, setWorkspaceName] = useState(initialWorkspace)
  const [inviteEmails, setInviteEmails] = useState<string[]>(initialEmails)
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const fullText = "Name your workspace"

  // Typewriter effect
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [displayedText])

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

      {/* Minimal input */}
      <div className="w-full flex flex-col gap-8">
        <input
          type="text"
          value={workspaceName}
          onChange={(e) => {
            setWorkspaceName(e.target.value)
            onFieldChange?.({ workspaceName: e.target.value, inviteEmails })
          }}
          placeholder="e.g. Acme Corp"
          className="w-full bg-transparent border-none outline-none text-4xl font-light text-[var(--ob-text)] placeholder:text-[var(--ob-text-muted)] py-4"
          autoFocus
        />

        {/* Invite emails section */}
        <div className="flex flex-col gap-3">
          <span className="text-lg text-[var(--ob-text-tertiary)]">Invite team members (optional)</span>
          <div className="flex gap-3">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value)
                setEmailError("")
              }}
              onKeyDown={handleKeyDown}
              placeholder="colleague@company.com"
              className="flex-1 bg-transparent border-b border-[var(--ob-border)] outline-none text-xl font-light text-[var(--ob-text)] placeholder:text-[var(--ob-text-muted)] py-2 focus:border-[var(--ob-btn-primary-bg)] transition-colors"
            />
            <button
              type="button"
              onClick={addEmail}
              className="px-4 py-2 text-sm font-medium text-[var(--ob-text)] hover:text-[var(--ob-btn-primary-bg)] transition-colors"
            >
              Add
            </button>
          </div>
          {emailError && (
            <p className="text-sm text-red-500">{emailError}</p>
          )}

          {inviteEmails.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {inviteEmails.map((email) => (
                <motion.span
                  key={email}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ob-border)] px-3 py-1.5 text-sm text-[var(--ob-text-secondary)]"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="text-[var(--ob-text-muted)] transition-colors hover:text-[var(--ob-text)]"
                  >
                    <X size={14} />
                  </button>
                </motion.span>
              ))}
            </div>
          )}
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
