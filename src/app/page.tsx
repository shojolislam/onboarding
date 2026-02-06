"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { ProgressIndicator } from "@/components/onboarding/progress-indicator"
import { StepProfile } from "@/components/onboarding/step-profile"
import { StepWorkspace } from "@/components/onboarding/step-workspace"
import { StepInvite } from "@/components/onboarding/step-invite"
import { StepAssistant } from "@/components/onboarding/step-assistant"
import { StepPermissions } from "@/components/onboarding/step-permissions"
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

interface SpikeEvent {
  id: string
  type: "email" | "calendar" | "mail"
  text: string
  timestamp: number
}

export default function Home() {
  const [isDark, setIsDark] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [spikeEvents, setSpikeEvents] = useState<SpikeEvent[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: "",
    companyName: "",
    email: "user@example.com",
    workspaceName: "",
    inviteEmails: [],
    assistantName: "",
    calendarAccess: false,
    emailAccess: false,
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

  // Handle email added - trigger spike animation
  const handleEmailAdded = useCallback((email: string) => {
    const event: SpikeEvent = {
      id: `email-${Date.now()}`,
      type: "email",
      text: email,
      timestamp: Date.now(),
    }
    setSpikeEvents((prev) => [...prev, event])
  }, [])

  // Handle permission granted - trigger spike animation
  const handlePermissionGranted = useCallback((permission: "calendar" | "email") => {
    const event: SpikeEvent = {
      id: `${permission}-${Date.now()}`,
      type: permission === "calendar" ? "calendar" : "mail",
      text: permission === "calendar" ? "Calendar" : "Email",
      timestamp: Date.now(),
    }
    setSpikeEvents((prev) => [...prev, event])
  }, [])

  const totalSteps = 6

  return (
    <main className="relative h-screen w-screen overflow-hidden" data-theme={isDark ? "dark" : "light"}>
      {/* Full-screen Three.js Animation Background */}
      <div className="absolute inset-0">
        <ThreeBackground
          onboardingStep={currentStep}
          assistantName={formData.assistantName}
          isProcessing={isProcessing}
          isComplete={isComplete}
          isDark={isDark}
          formProgress={formProgress}
          spikeEvents={spikeEvents}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          {/* Logo + Workspace Name */}
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 128 128" fill="none">
              <path d="M88.5436 64H120L113.06 36H88.0645C88.0645 36 88.0098 36 87.9824 36C83.1093 36 78.5783 33.516 76.1691 29.2518C68.969 16.5697 55.4309 8 39.9492 8H14.9401L21.8802 36H39.4427C46.8345 36 53.2955 41.6166 53.7883 49.0409C54.3359 57.1966 47.9022 64 39.9355 64H8L14.9401 92H40.0313C44.9044 92 49.4353 94.484 51.8445 98.7482C59.0174 111.43 72.5554 120 88.0508 120H113.046L106.106 92H88.0508C80.0841 92 73.6505 85.1966 74.198 77.0409C74.6908 69.6028 81.1518 64 88.5436 64Z" fill="currentColor" className="text-[var(--ob-text)]"/>
            </svg>
            {formData.workspaceName && (
              <span className="font-[family-name:var(--font-geist-sans)] text-lg font-medium text-[var(--ob-text)]">
                {formData.workspaceName}
              </span>
            )}
          </div>

          {/* Step counter - center */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} isDark={isDark} />
            <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[var(--ob-text-muted)]">
              {currentStep}/{totalSteps}
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

        {/* Spacer - pushes form to bottom half */}
        <div className="flex-1" />

        {/* Form Panel - bottom portion */}
        <div className="w-full px-6 pb-10 md:px-10">
          <div className="mx-auto w-full max-w-lg">
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
                <StepInvite
                  key="step-3"
                  inviteEmails={formData.inviteEmails}
                  onEmailAdded={handleEmailAdded}
                  onNext={(data) => {
                    setFormData((prev) => ({ ...prev, ...data }))
                    setCurrentStep(4)
                  }}
                  onBack={() => setCurrentStep(2)}
                />
              )}
              {currentStep === 4 && (
                <StepAssistant
                  key="step-4"
                  assistantName={formData.assistantName}
                  calendarAccess={formData.calendarAccess}
                  emailAccess={formData.emailAccess}
                  onAssistantNameChange={handleAssistantNameChange}
                  onFieldChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
                  onNext={(data) => {
                    setFormData((prev) => ({ ...prev, ...data }))
                    setCurrentStep(5)
                  }}
                  onBack={() => setCurrentStep(3)}
                />
              )}
              {currentStep === 5 && (
                <StepPermissions
                  key="step-5"
                  calendarAccess={formData.calendarAccess}
                  emailAccess={formData.emailAccess}
                  onPermissionGranted={handlePermissionGranted}
                  onNext={(data) => {
                    setFormData((prev) => ({ ...prev, ...data }))
                    setCurrentStep(6)
                  }}
                  onBack={() => setCurrentStep(4)}
                />
              )}
              {currentStep === 6 && (
                <StepComplete
                  key="step-6"
                  assistantName={formData.assistantName}
                  onProcessingStart={handleProcessingStart}
                  onComplete={handleComplete}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}
