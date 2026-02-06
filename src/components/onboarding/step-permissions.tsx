"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, ArrowLeft, Calendar, Mail } from "lucide-react"

interface StepPermissionsProps {
  calendarAccess: boolean
  emailAccess: boolean
  onNext: (data: { calendarAccess: boolean; emailAccess: boolean }) => void
  onPermissionGranted?: (permission: "calendar" | "email") => void
  onBack?: () => void
}

export function StepPermissions({
  calendarAccess: initialCalendar,
  emailAccess: initialEmail,
  onNext,
  onPermissionGranted,
  onBack,
}: StepPermissionsProps) {
  const [calendarAccess, setCalendarAccess] = useState(initialCalendar)
  const [emailAccess, setEmailAccess] = useState(initialEmail)
  const [displayedText, setDisplayedText] = useState("")
  const fullText = "Grant permissions"

  // Typewriter effect
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [displayedText])

  const handleCalendarAllow = () => {
    if (!calendarAccess) {
      setCalendarAccess(true)
      onPermissionGranted?.("calendar")
    }
  }

  const handleEmailAllow = () => {
    if (!emailAccess) {
      setEmailAccess(true)
      onPermissionGranted?.("email")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ calendarAccess, emailAccess })
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

      {/* Permission cards */}
      <div className="flex flex-col gap-4">
        {/* Calendar Permission */}
        <div className="flex items-center justify-between py-6 border-b border-[var(--ob-border)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ob-muted)]">
              <Calendar size={24} className="text-[var(--ob-text)]" />
            </div>
            <div>
              <h3 className="text-xl font-light text-[var(--ob-text)]">Calendar Access</h3>
              <p className="text-sm text-[var(--ob-text-tertiary)]">Schedule meetings and check availability</p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={handleCalendarAllow}
            disabled={calendarAccess}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              calendarAccess
                ? "bg-[var(--ob-btn-primary-bg)] text-[var(--ob-btn-primary-text)]"
                : "border border-[var(--ob-border)] text-[var(--ob-text)] hover:bg-[var(--ob-muted)]"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {calendarAccess ? "Allowed" : "Allow"}
          </motion.button>
        </div>

        {/* Email Permission */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ob-muted)]">
              <Mail size={24} className="text-[var(--ob-text)]" />
            </div>
            <div>
              <h3 className="text-xl font-light text-[var(--ob-text)]">Email Access</h3>
              <p className="text-sm text-[var(--ob-text-tertiary)]">Read and draft emails on your behalf</p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={handleEmailAllow}
            disabled={emailAccess}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              emailAccess
                ? "bg-[var(--ob-btn-primary-bg)] text-[var(--ob-btn-primary-text)]"
                : "border border-[var(--ob-border)] text-[var(--ob-text)] hover:bg-[var(--ob-muted)]"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {emailAccess ? "Allowed" : "Allow"}
          </motion.button>
        </div>
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
