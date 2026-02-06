"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

interface StepProfileProps {
  name: string
  companyName: string
  email: string
  onNext: (data: { name: string; companyName: string }) => void
  onFieldChange?: (data: { name: string; companyName: string }) => void
}

export function StepProfile({ name: initialName, onNext, onFieldChange }: StepProfileProps) {
  const [name, setName] = useState(initialName)
  const [displayedText, setDisplayedText] = useState("")
  const fullText = "What's your name?"

  // Typewriter effect
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [displayedText])

  const handleNameChange = (val: string) => {
    setName(val)
    onFieldChange?.({ name: val, companyName: "" })
  }

  const canProceed = name.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed) {
      onNext({ name: name.trim(), companyName: "" })
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
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="John Doe"
        className="w-full bg-transparent border-none outline-none text-5xl font-light text-[var(--ob-text)] placeholder:text-[var(--ob-text-muted)] py-4 caret-[var(--ob-text)]"
        autoFocus
        autoComplete="off"
      />

      {/* Arrow on far right */}
      <div className="flex justify-end mt-6">
        <motion.button
          type="submit"
          disabled={!canProceed}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ob-btn-primary-bg)] text-[var(--ob-btn-primary-text)] transition-colors hover:bg-[var(--ob-btn-primary-bg-hover)] disabled:opacity-40"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: canProceed ? 1 : 0, scale: canProceed ? 1 : 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowRight size={24} />
        </motion.button>
      </div>
    </motion.form>
  )
}
