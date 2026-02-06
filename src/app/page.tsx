"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { ProgressIndicator } from "@/components/onboarding/progress-indicator"
import { StepProfile } from "@/components/onboarding/step-profile"
import { StepWorkspace } from "@/components/onboarding/step-workspace"
import { StepAssistant } from "@/components/onboarding/step-assistant"
import { StepComplete } from "@/components/onboarding/step-complete"

const ThreeBackground = dynamic(() => import("@/components/three-background"), {
  ssr: false,
})

interface FormData {
  name: string
  companyName: string
  email: string
  workspaceName: string
  inviteEmails: string[]
  assistantName: string
  calendarAccess: boolean
  emailAccess: boolean
}

export default function Home() {
  const [isDark, setIsDark] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    companyName: "",
    email: "user@example.com",
    workspaceName: "",
    inviteEmails: [],
    assistantName: "",
    calendarAccess: true,
    emailAccess: true,
  })

  const handleAssistantNameChange = useCallback((name: string) => {
    setFormData((prev) => ({ ...prev, assistantName: name }))
  }, [])

  // Compute form progress (0-1) based on how many fields are filled
  const formProgress = useMemo(() => {
    let filled = 0
    const total = 7
    if (formData.name.trim()) filled++
    if (formData.companyName.trim()) filled++
    if (formData.workspaceName.trim()) filled++
    if (formData.inviteEmails.length > 0) filled++
    if (formData.assistantName.trim()) filled++
    if (formData.calendarAccess) filled++
    if (formData.emailAccess) filled++
    return filled / total
  }, [formData])

  const handleProcessingStart = useCallback(() => {
    setIsProcessing(true)
  }, [])

  const handleComplete = useCallback(() => {
    setIsComplete(true)
    setIsProcessing(false)
  }, [])

  return (
    <main className="flex h-screen w-screen overflow-hidden" data-theme={isDark ? "dark" : "light"}>
      {/* LEFT PANEL — Form (50% width) */}
      <div className="relative z-10 flex w-full flex-col md:w-1/2 onboarding-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 md:px-12">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[var(--ob-text)]">
              <path d="M12 2C8 6 4 9 4 13c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-7-8-11z"
                fill="currentColor" fillOpacity="0.9"/>
              <path d="M12 8c-2 2-4 3.5-4 6 0 2.2 1.8 4 4 4s4-1.8 4-4c0-2.5-2-4-4-6z"
                fill="currentColor" fillOpacity="0.3"/>
            </svg>
          </div>

          {/* Center: Progress indicator */}
          <div className="absolute left-1/4 top-6 flex items-center gap-3 md:relative md:left-0 md:top-0">
            <ProgressIndicator currentStep={currentStep} totalSteps={4} isDark={isDark} />
            <span className="text-sm font-medium text-[var(--ob-text-muted)]">
              {currentStep}/4
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--ob-muted)] text-[var(--ob-text-tertiary)] hover:text-[var(--ob-text)]"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Form content */}
        <div className="flex flex-1 flex-col justify-center px-8 md:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <StepProfile
                  key="step-1"
                  name={formData.name}
                  companyName={formData.companyName}
                  email={formData.email}
                  onFieldChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
                  onNext={(data) => {
                    setFormData((prev) => ({ ...prev, ...data }))
                    setCurrentStep(2)
                  }}
                />
              )}
              {currentStep === 2 && (
                <StepWorkspace
                  key="step-2"
                  workspaceName={formData.workspaceName}
                  inviteEmails={formData.inviteEmails}
                  onFieldChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
                  onNext={(data) => {
                    setFormData((prev) => ({ ...prev, ...data }))
                    setCurrentStep(3)
                  }}
                  onBack={() => setCurrentStep(1)}
                />
              )}
              {currentStep === 3 && (
                <StepAssistant
                  key="step-3"
                  assistantName={formData.assistantName}
                  calendarAccess={formData.calendarAccess}
                  emailAccess={formData.emailAccess}
                  onAssistantNameChange={handleAssistantNameChange}
                  onFieldChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
                  onNext={(data) => {
                    setFormData((prev) => ({ ...prev, ...data }))
                    setCurrentStep(4)
                  }}
                  onBack={() => setCurrentStep(2)}
                />
              )}
              {currentStep === 4 && (
                <StepComplete
                  key="step-4"
                  assistantName={formData.assistantName}
                  onProcessingStart={handleProcessingStart}
                  onComplete={handleComplete}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between px-8 py-6 md:px-12">
          <p className="text-xs text-[var(--ob-text-muted)] leading-relaxed max-w-[180px]">
            The single platform to iterate,<br />
            evaluate, deploy, and monitor LLMs
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — Three.js (50% width) */}
      <div className="relative hidden flex-1 md:block md:w-1/2">
        <ThreeBackground
          onboardingStep={currentStep}
          assistantName={formData.assistantName}
          isProcessing={isProcessing}
          isComplete={isComplete}
          isDark={isDark}
          formProgress={formProgress}
        />
      </div>
    </main>
  )
}
