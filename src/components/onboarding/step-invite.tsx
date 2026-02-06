"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { X, ArrowRight, ArrowLeft } from "lucide-react"

interface StepInviteProps {
  inviteEmails: string[]
  onNext: (data: { inviteEmails: string[] }) => void
  onEmailAdded?: (email: string) => void
  onBack?: () => void
}

export function StepInvite({
  inviteEmails: initialEmails,
  onNext,
  onEmailAdded,
  onBack,
}: StepInviteProps) {
  const [inviteEmails, setInviteEmails] = useState<string[]>(initialEmails)
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const fullText = "Invite your team"

  // Typewriter effect
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [displayedText])

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

    // Trigger spike animation with the email
    onEmailAdded?.(email)
  }, [emailInput, inviteEmails, onEmailAdded])

  const removeEmail = (email: string) => {
    const newEmails = inviteEmails.filter((e) => e !== email)
    setInviteEmails(newEmails)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addEmail()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ inviteEmails })
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

      {/* Email input */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 items-center">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value)
              setEmailError("")
            }}
            onKeyDown={handleKeyDown}
            placeholder="colleague@company.com"
            className="flex-1 bg-transparent border-none outline-none text-4xl font-light text-[var(--ob-text)] placeholder:text-[var(--ob-text-muted)] py-4"
            autoFocus
          />
          <button
            type="button"
            onClick={addEmail}
            className="text-lg font-medium text-[var(--ob-text-tertiary)] hover:text-[var(--ob-text)] transition-colors"
          >
            Add
          </button>
        </div>

        {emailError && (
          <p className="text-sm text-red-500">{emailError}</p>
        )}

        {inviteEmails.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {inviteEmails.map((email) => (
              <motion.span
                key={email}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ob-border)] px-4 py-2 text-base text-[var(--ob-text-secondary)]"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="text-[var(--ob-text-muted)] transition-colors hover:text-[var(--ob-text)]"
                >
                  <X size={16} />
                </button>
              </motion.span>
            ))}
          </div>
        )}

        <p className="text-sm text-[var(--ob-text-muted)] mt-2">
          Press Enter to add • Skip if you prefer to invite later
        </p>
      </div>

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
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ob-btn-primary-bg)] text-[var(--ob-btn-primary-text)] transition-colors hover:bg-[var(--ob-btn-primary-bg-hover)]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowRight size={24} />
        </motion.button>
      </div>
    </motion.form>
  )
}
