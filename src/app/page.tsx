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
      {/* LEFT PANEL — Form */}
      <div className="relative z-10 flex w-full flex-col justify-between px-8 py-10 md:w-[480px] md:min-w-[480px] md:px-12 onboarding-panel">
        {/* Logo + theme toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--ob-muted)]" />
            <span className="text-sm font-semibold tracking-tight text-[var(--ob-text-secondary)]">
              Precurion
            </span>
          </div>
          <button
            onClick={() => setIsDark((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors bg-[var(--ob-muted)] text-[var(--ob-text-secondary)] hover:text-[var(--ob-text)]"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Form content */}
        <div className="flex flex-1 flex-col justify-center py-12">
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

        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          <ProgressIndicator currentStep={currentStep} totalSteps={4} isDark={isDark} />
          <span className="text-xs text-[var(--ob-text-muted)]">
            Step {currentStep} of 4
          </span>
        </div>
      </div>

      {/* RIGHT PANEL — Three.js */}
      <div className="relative hidden flex-1 md:block">
        {/* Subtle border on left edge */}
        <div className="absolute inset-y-0 left-0 z-10 w-px bg-[var(--ob-border)]" />
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
