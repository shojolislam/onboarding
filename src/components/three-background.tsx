"use client"

import { useRef, useMemo, useEffect, useState, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"
import { PARTICLE_CONFIG, STEP_CONFIGS } from "@/lib/particle-config"
import { generateAllShapes } from "@/lib/shape-points"

// =============================================================================
// TYPES
// =============================================================================
interface SpikeEvent {
  id: string
  type: "email" | "calendar" | "mail"
  text: string
  timestamp: number
}

interface ActiveSpikeLabel {
  id: string
  type: "email" | "calendar" | "mail"
  text: string
  worldX: number
  worldY: number
  angle: number
  opacity: number
}

// =============================================================================
// HELPERS
// =============================================================================
const normalizedAngularDistance = (a1: number, a2: number): number => {
  const twoPi = Math.PI * 2
  const n1 = ((a1 % twoPi) + twoPi) % twoPi
  const n2 = ((a2 % twoPi) + twoPi) % twoPi
  let d = Math.abs(n1 - n2)
  if (d > Math.PI) d = twoPi - d
  return d
}

const createParticleTexture = (): THREE.Texture => {
  const c = document.createElement("canvas")
  c.width = 64; c.height = 64
  const ctx = c.getContext("2d")!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, "rgba(255,255,255,1)")
  g.addColorStop(0.3, "rgba(255,255,255,0.8)")
  g.addColorStop(0.6, "rgba(255,255,255,0.3)")
  g.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(32, 32, 32, 0, Math.PI * 2); ctx.fill()
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t
}

const createGlowTexture = (): THREE.Texture => {
  const c = document.createElement("canvas")
  c.width = 128; c.height = 128
  const ctx = c.getContext("2d")!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, "rgba(0,0,0,0.4)")
  g.addColorStop(0.3, "rgba(0,0,0,0.2)")
  g.addColorStop(0.6, "rgba(0,0,0,0.08)")
  g.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(64, 64, 64, 0, Math.PI * 2); ctx.fill()
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t
}

function generateFinalSphere(count: number, radius: number): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = []
  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const w = Math.random()
    const theta = u * 2 * Math.PI
    const phi = Math.acos(2 * v - 1)
    const r = Math.cbrt(w) * radius
    points.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
    })
  }
  points.sort((a, b) => {
    const rA = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
    const rB = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z)
    return rA - rB
  })
  return points
}

// =============================================================================
// DATA STRUCTURES
// =============================================================================
interface Particle {
  restRadius: number
  radiusVariation: number
  isPotentialAnomaly: boolean
  isFixedAnchor: boolean
  isShapeParticle: boolean
  shapeIndex: number
  charge: number
  chargeRateMultiplier: number
  lastSpikeTime: number
  orbitSpeed: number
  breatheOffset: number
  baseAngle: number
  isWanderer: boolean
  wanderAmplitude: number
  wanderSpeed: number
  wanderPhase: number
  wanderDirection: number
  convergenceDelay: number
  convergenceSpeed: number
  finalDelay: number
  finalSpeed: number
  sphereSpikeCharge: number
  sphereLastSpikeTime: number
}

interface Spike {
  leaderIndex: number
  direction: number
  power: number
  startTime: number
  duration: number
  spikeEvent?: SpikeEvent // Link to triggered spike event
}

interface SphereSpike {
  leaderIndex: number
  power: number
  startTime: number
  duration: number
  direction: number
}

// =============================================================================
// SPIKE LABEL (rendered in 3D space using Html from drei)
// =============================================================================
function SpikeLabel({
  label,
  isDark,
  isExiting,
  isCollapsingToSphere,
  sphereProgress,
  onExitComplete,
}: {
  label: ActiveSpikeLabel
  isDark: boolean
  isExiting: boolean
  isCollapsingToSphere: boolean
  sphereProgress: number
  onExitComplete: () => void
}) {
  const isRightHalf = Math.cos(label.angle) >= 0
  const textAlign = isRightHalf ? "left" : "right"
  const labelOffset = 20

  // When collapsing to sphere, animate label toward center (0, 100) which is the sphere center with yOffset
  const sphereCenter = { x: 0, y: 100 }
  const baseX = label.worldX + Math.cos(label.angle) * labelOffset
  const baseY = label.worldY + Math.sin(label.angle) * labelOffset

  // Smooth easing for collapse animation
  const collapseEase = sphereProgress * sphereProgress * (3 - 2 * sphereProgress)
  const labelX = isCollapsingToSphere
    ? baseX + (sphereCenter.x - baseX) * collapseEase
    : baseX
  const labelY = isCollapsingToSphere
    ? baseY + (sphereCenter.y - baseY) * collapseEase
    : baseY

  // Fade out and scale down as it collapses
  const collapseOpacity = isCollapsingToSphere ? Math.max(0, 1 - sphereProgress * 1.5) : 1
  const collapseScale = isCollapsingToSphere ? Math.max(0.3, 1 - sphereProgress * 0.7) : 1

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: collapseOpacity,
      scale: collapseScale,
      transition: { duration: 0.3, staggerChildren: 0.02 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
      transition: { duration: 0.5 },
    },
  }

  const charVariants = {
    hidden: { opacity: 0, y: 6, filter: "blur(3px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.15 },
    },
  }

  const chars = label.text.split("").map((char, i) => ({
    char,
    key: `${label.id}-${i}`,
  }))

  // Don't render if fully collapsed
  if (isCollapsingToSphere && sphereProgress > 0.7) {
    onExitComplete()
    return null
  }

  return (
    <Html
      position={[labelX, labelY, 0]}
      center={false}
      style={{
        transform: isRightHalf ? "translateX(8px)" : "translateX(calc(-100% - 8px))",
        pointerEvents: "none",
      }}
      zIndexRange={[100, 0]}
    >
      <AnimatePresence onExitComplete={onExitComplete}>
        {!isExiting && (
          <motion.div
            className="flex items-center gap-2 whitespace-nowrap font-[family-name:var(--font-geist-mono)]"
            style={{
              textAlign,
              opacity: collapseOpacity,
              transform: `scale(${collapseScale})`,
              filter: isCollapsingToSphere ? `blur(${sphereProgress * 4}px)` : 'none',
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Icon */}
            {label.type === "calendar" && (
              <motion.svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={isDark ? "rgba(255,255,255,0.8)" : "#1a1a1a"}
                strokeWidth="2"
                variants={charVariants}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </motion.svg>
            )}
            {label.type === "mail" && (
              <motion.svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={isDark ? "rgba(255,255,255,0.8)" : "#1a1a1a"}
                strokeWidth="2"
                variants={charVariants}
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </motion.svg>
            )}

            {/* Text with typewriter effect */}
            <span
              className="text-xs uppercase tracking-wider"
              style={{
                color: isDark ? "rgba(255,255,255,0.8)" : "#1a1a1a",
                display: "flex",
                flexDirection: "row",
              }}
            >
              {chars.map(({ char, key }) => (
                <motion.span key={key} variants={charVariants} style={{ display: "inline-block" }}>
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  )
}

// =============================================================================
// PARTICLES (inner R3F component)
// =============================================================================
function Particles({
  onboardingStep,
  assistantName,
  isProcessing,
  isComplete,
  isDark,
  formProgress,
  triggeredSpikes,
  onSpikeLabelsUpdate,
}: {
  onboardingStep: number
  assistantName: string
  isProcessing: boolean
  isComplete: boolean
  isDark: boolean
  formProgress: number
  triggeredSpikes: SpikeEvent[]
  onSpikeLabelsUpdate: (labels: ActiveSpikeLabel[]) => void
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const glowPointsRef = useRef<THREE.Points>(null)
  const pointsMaterialRef = useRef<THREE.PointsMaterial>(null)
  const glowMaterialRef = useRef<THREE.PointsMaterial>(null)

  const activeSpikesRef = useRef<Spike[]>([])
  const activeSphereSpikeRef = useRef<SphereSpike[]>([])
  const sphereDisplacementsRef = useRef<Float32Array>(new Float32Array(PARTICLE_CONFIG.particleCount))
  const currentRadiusRef = useRef<Float32Array>(new Float32Array(PARTICLE_CONFIG.particleCount))
  const currentAnglesRef = useRef<Float32Array>(new Float32Array(PARTICLE_CONFIG.particleCount))
  const angleOffsetsRef = useRef<Float32Array>(new Float32Array(PARTICLE_CONFIG.particleCount))
  const radiusInitializedRef = useRef(false)
  const processedSpikeIdsRef = useRef<Set<string>>(new Set())

  const lerpedRadius = useRef(STEP_CONFIGS[1].radius)
  const lerpedBreathe = useRef(STEP_CONFIGS[1].breathe)
  const lerpedOrbitSpeed = useRef(STEP_CONFIGS[1].orbitSpeedMultiplier)

  const shapeProgressRef = useRef(0)
  const prevAssistantNameRef = useRef("")
  const particleConvergenceRef = useRef<Float32Array>(new Float32Array(PARTICLE_CONFIG.particleCount))
  const finalConvergenceRef = useRef<Float32Array>(new Float32Array(PARTICLE_CONFIG.particleCount))
  const finalProgressRef = useRef(0)

  const morphTargetsXRef = useRef<Float32Array>(new Float32Array(0))
  const morphTargetsYRef = useRef<Float32Array>(new Float32Array(0))
  const morphTargetsZRef = useRef<Float32Array>(new Float32Array(0))
  const shapeRotationRef = useRef({ x: 0, y: 0 })
  const prevFormProgressRef = useRef(formProgress)
  const progressPulseRef = useRef(0)
  const lineToCircleProgressRef = useRef(0)

  const { scene } = useThree()

  const targetBgRef = useRef(new THREE.Color(0x0a0a0a))
  useEffect(() => { targetBgRef.current = new THREE.Color(isDark ? 0x0a0a0a : 0xf7f6f3) }, [isDark])
  useEffect(() => { scene.background = new THREE.Color(isDark ? 0x0a0a0a : 0xf7f6f3) }, [scene, isDark])

  const shapeCount = Math.floor(PARTICLE_CONFIG.particleCount * PARTICLE_CONFIG.shapeParticlePercent)
  const allShapes = useMemo(() => generateAllShapes(shapeCount, PARTICLE_CONFIG.shapeScale), [shapeCount])
  const finalSpherePositions = useMemo(() => generateFinalSphere(PARTICLE_CONFIG.particleCount, 65), [])

  useEffect(() => {
    morphTargetsXRef.current = new Float32Array(shapeCount)
    morphTargetsYRef.current = new Float32Array(shapeCount)
    morphTargetsZRef.current = new Float32Array(shapeCount)
  }, [shapeCount])

  const particlesData = useMemo<Particle[]>(() => {
    const wandererCount = Math.floor(PARTICLE_CONFIG.particleCount * PARTICLE_CONFIG.wandererPercent)
    const shapeIndices = new Set<number>()
    const spacing = PARTICLE_CONFIG.particleCount / shapeCount
    for (let s = 0; s < shapeCount; s++) {
      const idx = Math.floor(s * spacing + (Math.random() - 0.5) * spacing * 0.4)
      shapeIndices.add(Math.max(0, Math.min(PARTICLE_CONFIG.particleCount - 1, idx)))
    }
    let fillIdx = 0
    while (shapeIndices.size < shapeCount) {
      if (!shapeIndices.has(fillIdx)) shapeIndices.add(fillIdx)
      fillIdx++
    }
    const sortedShapeIndices = Array.from(shapeIndices).sort((a, b) => a - b)
    const shapeIndexMap = new Map<number, number>()
    sortedShapeIndices.forEach((particleIdx, shapeArrayIdx) => {
      shapeIndexMap.set(particleIdx, shapeArrayIdx)
    })
    const wandererSet = new Set<number>()
    const wanderSpacing = Math.floor(PARTICLE_CONFIG.particleCount / wandererCount)
    for (let w = 0; w < wandererCount; w++) {
      const idx = (w * wanderSpacing + Math.floor(Math.random() * wanderSpacing * 0.6)) % PARTICLE_CONFIG.particleCount
      wandererSet.add(idx)
    }

    return Array.from({ length: PARTICLE_CONFIG.particleCount }, (_, i) => {
      const radiusVariation = (Math.random() - 0.5) * 6
      const restRadius = PARTICLE_CONFIG.baseRadius + radiusVariation
      const isPotentialAnomaly = Math.random() < PARTICLE_CONFIG.potentialAnomalyChance
      const isShapeParticle = shapeIndices.has(i)
      const isFixedAnchor = !wandererSet.has(i) && !isShapeParticle && Math.random() < PARTICLE_CONFIG.fixedAnchorPercent
      const baseAngle = (i / PARTICLE_CONFIG.particleCount) * Math.PI * 2
      const isWanderer = wandererSet.has(i)

      return {
        restRadius,
        radiusVariation,
        isPotentialAnomaly,
        isFixedAnchor,
        isShapeParticle,
        shapeIndex: shapeIndexMap.get(i) ?? -1,
        charge: Math.random() * 0.3,
        chargeRateMultiplier: 0.5 + Math.random(),
        lastSpikeTime: -(PARTICLE_CONFIG.anomalyCooldown * Math.random()),
        orbitSpeed: 0.0003 + Math.random() * 0.0015,
        breatheOffset: Math.random() * Math.PI * 2,
        baseAngle,
        isWanderer,
        wanderAmplitude: PARTICLE_CONFIG.wanderMinAmplitude + Math.random() * (PARTICLE_CONFIG.wanderMaxAmplitude - PARTICLE_CONFIG.wanderMinAmplitude),
        wanderSpeed: PARTICLE_CONFIG.wanderMinSpeed + Math.random() * (PARTICLE_CONFIG.wanderMaxSpeed - PARTICLE_CONFIG.wanderMinSpeed),
        wanderPhase: Math.random() * Math.PI * 2,
        wanderDirection: Math.random() > 0.5 ? 1 : -1,
        convergenceDelay: Math.random() * 0.35,
        convergenceSpeed: 0.008 + Math.random() * 0.017,
        finalDelay: Math.random() * 0.5,
        finalSpeed: 0.006 + Math.random() * 0.018,
        sphereSpikeCharge: Math.random() * 0.3,
        sphereLastSpikeTime: -(15 * Math.random()),
      }
    })
  }, [shapeCount])

  useMemo(() => {
    for (let i = 0; i < particlesData.length; i++) {
      currentAnglesRef.current[i] = particlesData[i].baseAngle
    }
  }, [particlesData])

  const positions = useMemo(() => new Float32Array(PARTICLE_CONFIG.particleCount * 3), [])
  const glowPositions = useMemo(() => new Float32Array(PARTICLE_CONFIG.particleCount * 3), [])
  const sizes = useMemo(() => { const a = new Float32Array(PARTICLE_CONFIG.particleCount); a.fill(3); return a }, [])
  const glowSizes = useMemo(() => { const a = new Float32Array(PARTICLE_CONFIG.particleCount); a.fill(15); return a }, [])
  const particleTexture = useMemo(() => createParticleTexture(), [])
  const glowTexture = useMemo(() => createGlowTexture(), [])

  // Process triggered spikes from events
  useEffect(() => {
    for (const event of triggeredSpikes) {
      if (processedSpikeIdsRef.current.has(event.id)) continue
      processedSpikeIdsRef.current.add(event.id)

      // Find a suitable particle to lead the spike (in the circle, on step 2+)
      if (onboardingStep >= 2) {
        const leaderIndex = Math.floor(Math.random() * PARTICLE_CONFIG.particleCount)
        activeSpikesRef.current.push({
          leaderIndex,
          direction: 1, // outward
          power: 25 + Math.random() * 15, // gentler spike
          startTime: -1, // Will be set on first frame
          duration: 120, // persist for a long time (2 minutes)
          spikeEvent: event,
        })
      }
    }
  }, [triggeredSpikes, onboardingStep])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return

    const elapsed = clock.elapsedTime
    const stepConfig = STEP_CONFIGS[onboardingStep] || STEP_CONFIGS[1]
    const currentRadius = currentRadiusRef.current
    const angleOffsets = angleOffsetsRef.current
    const displacements = new Float32Array(PARTICLE_CONFIG.particleCount)
    const particleConv = particleConvergenceRef.current
    const finalConv = finalConvergenceRef.current
    const morphX = morphTargetsXRef.current
    const morphY = morphTargetsYRef.current
    const morphZ = morphTargetsZRef.current

    if (!radiusInitializedRef.current) {
      for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) {
        currentRadius[i] = particlesData[i].restRadius
        angleOffsets[i] = 0
      }
      radiusInitializedRef.current = true
    }

    // Form progress pulse
    if (formProgress > prevFormProgressRef.current + 0.01) {
      progressPulseRef.current = Math.min(progressPulseRef.current + 0.4, 1.0)
    }
    prevFormProgressRef.current = formProgress
    progressPulseRef.current *= 0.985

    // Convergence state (calculate first so we can use it for radius)
    const hasName = assistantName.trim().length > 0
    const hadName = prevAssistantNameRef.current.trim().length > 0
    if (hasName && !hadName) {
      shapeProgressRef.current = 0
      particleConv.fill(0)
    }
    const shapeGoal = hasName ? 1 : 0
    shapeProgressRef.current += (shapeGoal - shapeProgressRef.current) * 0.006
    prevAssistantNameRef.current = assistantName

    // Lerp step parameters
    const progressBoost = formProgress * 12
    const lr = 0.006
    // Shrink the circle as particles converge to inner shape (sync with convergence)
    const convergenceShrink = shapeProgressRef.current * 50 // shrink by up to 50 as shape forms
    lerpedRadius.current += (stepConfig.radius + progressBoost - convergenceShrink - lerpedRadius.current) * lr
    lerpedBreathe.current += (stepConfig.breathe - lerpedBreathe.current) * lr
    const targetOrbitSpeed = stepConfig.orbitSpeedMultiplier * (1 + formProgress * 0.2)
    lerpedOrbitSpeed.current += (targetOrbitSpeed - lerpedOrbitSpeed.current) * lr

    // Final sphere convergence
    const finalGoal = isComplete ? 1 : 0
    finalProgressRef.current += (finalGoal - finalProgressRef.current) * 0.008

    // 3D rotation (faster when complete for more alive feeling)
    const rot = shapeRotationRef.current
    const rotSpeed = isComplete ? 0.35 : 0.15
    rot.y = elapsed * rotSpeed
    rot.x = Math.sin(elapsed * (isComplete ? 0.2 : 0.08)) * (isComplete ? 0.4 : 0.3)
    const cosRy = Math.cos(rot.y), sinRy = Math.sin(rot.y)
    const cosRx = Math.cos(rot.x), sinRx = Math.sin(rot.x)

    // Morph targets
    const { shapes, shapeCount: numShapes } = allShapes
    const morphCycleDuration = 8.0
    const morphTime = elapsed / morphCycleDuration
    const fromShapeIdx = Math.floor(morphTime) % numShapes
    const toShapeIdx = (fromShapeIdx + 1) % numShapes
    const morphT = morphTime - Math.floor(morphTime)
    const smoothMorphT = morphT * morphT * (3 - 2 * morphT)
    const fromShape = shapes[fromShapeIdx]
    const toShape = shapes[toShapeIdx]

    if (morphX.length >= shapeCount) {
      for (let s = 0; s < shapeCount; s++) {
        morphX[s] = fromShape[s].x + (toShape[s].x - fromShape[s].x) * smoothMorphT
        morphY[s] = fromShape[s].y + (toShape[s].y - fromShape[s].y) * smoothMorphT
        morphZ[s] = fromShape[s].z + (toShape[s].z - fromShape[s].z) * smoothMorphT
      }
    }

    // Theme
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(targetBgRef.current, 0.05)
    }
    if (pointsMaterialRef.current) {
      pointsMaterialRef.current.opacity = isDark ? 0.6 : 0.45
      pointsMaterialRef.current.color.set(isDark ? "#ffffff" : "#1a1a1a")
    }
    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = isDark ? 0.12 : 0
      glowMaterialRef.current.color.set("#333333")
    }

    // Spike physics
    angleOffsets.fill(0)
    for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) {
      currentRadius[i] = particlesData[i].restRadius + (lerpedRadius.current - PARTICLE_CONFIG.baseRadius)
    }

    const pulseChargeMul = 1 + progressPulseRef.current * 1.5
    const pulseSpikeLimit = stepConfig.maxSpikes + (progressPulseRef.current > 0.5 ? 1 : 0)
    const effectiveCooldown = PARTICLE_CONFIG.anomalyCooldown * stepConfig.cooldownMultiplier
    const effectiveChargeRate = PARTICLE_CONFIG.chargeRate * stepConfig.chargeRateMultiplier * pulseChargeMul

    // Natural spikes (only when in circle mode and not in line mode)
    if (onboardingStep >= 2) {
      for (let i = 0; i < particlesData.length; i++) {
        const p = particlesData[i]
        if (!p.isPotentialAnomaly) continue
        if (elapsed - p.lastSpikeTime < effectiveCooldown) continue
        p.charge += effectiveChargeRate * p.chargeRateMultiplier
        if (p.charge >= 1 && activeSpikesRef.current.length < pulseSpikeLimit) {
          const curAngle = currentAnglesRef.current[i]
          let tooClose = false
          for (const ex of activeSpikesRef.current) {
            if (normalizedAngularDistance(curAngle, currentAnglesRef.current[ex.leaderIndex]) < PARTICLE_CONFIG.minSpikeSeparation) {
              tooClose = true; break
            }
          }
          if (tooClose) { p.charge = 0.7; continue }
          const dir = Math.random() < stepConfig.inwardBias ? -1 : 1
          const basePow = PARTICLE_CONFIG.spikeMinPower + Math.random() * (PARTICLE_CONFIG.spikeMaxPower - PARTICLE_CONFIG.spikeMinPower)
          p.charge = 0
          p.lastSpikeTime = elapsed
          activeSpikesRef.current.push({
            leaderIndex: i, direction: dir,
            power: basePow * stepConfig.spikePowerMultiplier * (1 + progressPulseRef.current * 0.25),
            startTime: elapsed,
            duration: PARTICLE_CONFIG.spikeMinDuration + Math.random() * (PARTICLE_CONFIG.spikeMaxDuration - PARTICLE_CONFIG.spikeMinDuration),
          })
        }
      }
    }

    // Initialize start times for triggered spikes
    for (const spike of activeSpikesRef.current) {
      if (spike.startTime < 0) spike.startTime = elapsed
    }

    activeSpikesRef.current = activeSpikesRef.current.filter(s => elapsed - s.startTime < s.duration)

    // Track spike labels for rendering
    const spikeLabels: ActiveSpikeLabel[] = []

    for (const spike of activeSpikesRef.current) {
      const prog = (elapsed - spike.startTime) / spike.duration
      const isTriggeredSpike = !!spike.spikeEvent

      let envelope: number
      if (isTriggeredSpike) {
        // Triggered spikes: slow fade in, then persist
        if (prog < 0.02) {
          const u = prog / 0.02
          envelope = u * u * (3 - 2 * u)
        } else {
          envelope = 1
        }
      } else {
        // Natural spikes: normal envelope
        if (prog < 0.15) { const u = prog / 0.15; envelope = u * u * (3 - 2 * u) }
        else if (prog < 0.7) { envelope = 1 }
        else { const u = (prog - 0.7) / 0.3; envelope = 1 - u * u * (3 - 2 * u) }
      }

      const leaderDisp = spike.power * envelope * spike.direction
      displacements[spike.leaderIndex] += leaderDisp

      const leaderAngle = currentAnglesRef.current[spike.leaderIndex]
      // For triggered spikes, pull more particles along (wider angular distance)
      const effectiveMaxAngDist = isTriggeredSpike ? 0.35 : PARTICLE_CONFIG.maxAngularDist
      const effectiveAttraction = isTriggeredSpike ? 0.95 : PARTICLE_CONFIG.attractionStrength

      for (let j = 0; j < PARTICLE_CONFIG.particleCount; j++) {
        if (j === spike.leaderIndex || particlesData[j].isFixedAnchor) continue
        const angDist = normalizedAngularDistance(currentAnglesRef.current[j], leaderAngle)
        if (angDist > effectiveMaxAngDist) continue
        const f = 1 - angDist / effectiveMaxAngDist
        // Softer falloff for triggered spikes (f^2 instead of f^3)
        const falloff = isTriggeredSpike ? f * f : f * f * f
        displacements[j] += leaderDisp * falloff * effectiveAttraction
      }

      // Create label for triggered spikes (persist indefinitely)
      if (spike.spikeEvent && prog >= 0.01) {
        let labelOpacity = 1
        if (prog < 0.03) labelOpacity = prog / 0.03

        const leaderRadius = currentRadius[spike.leaderIndex] + displacements[spike.leaderIndex]
        const worldX = Math.cos(leaderAngle) * leaderRadius
        const worldY = Math.sin(leaderAngle) * leaderRadius + 100 // Add yOffset

        spikeLabels.push({
          id: spike.spikeEvent.id,
          type: spike.spikeEvent.type,
          text: spike.spikeEvent.text,
          worldX,
          worldY,
          angle: leaderAngle,
          opacity: labelOpacity,
        })
      }
    }

    onSpikeLabelsUpdate(spikeLabels)

    for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) currentRadius[i] += displacements[i]

    for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) {
      const p = particlesData[i]
      const pAng = currentAnglesRef.current[i]
      let nearSpike = false
      for (const spike of activeSpikesRef.current) {
        if (normalizedAngularDistance(pAng, currentAnglesRef.current[spike.leaderIndex]) <= PARTICLE_CONFIG.maxAngularDist) {
          nearSpike = true; break
        }
      }
      if (!nearSpike) {
        const rest = p.restRadius + (lerpedRadius.current - PARTICLE_CONFIG.baseRadius)
        currentRadius[i] += (rest - currentRadius[i]) * 0.1
      }
    }

    // Sphere spikes
    const sphereDisp = sphereDisplacementsRef.current
    sphereDisp.fill(0)
    const globalFinal = finalProgressRef.current

    if (globalFinal > 0.5) {
      const sphereSpikes = activeSphereSpikeRef.current
      // More active spikes when complete
      const sphereCooldown = isComplete ? 3.0 : 8.0
      const sphereChargeRate = isComplete ? 0.012 : 0.004
      const maxSphereSpikes = isComplete ? 6 : 3
      for (let i = 0; i < particlesData.length; i++) {
        const p = particlesData[i]
        if (!p.isPotentialAnomaly) continue
        if (elapsed - p.sphereLastSpikeTime < sphereCooldown) continue
        p.sphereSpikeCharge += sphereChargeRate * p.chargeRateMultiplier
        if (p.sphereSpikeCharge >= 1 && sphereSpikes.length < maxSphereSpikes) {
          p.sphereSpikeCharge = 0
          p.sphereLastSpikeTime = elapsed
          sphereSpikes.push({
            leaderIndex: i,
            power: isComplete ? 12 + Math.random() * 18 : 8 + Math.random() * 14,
            startTime: elapsed,
            duration: isComplete ? 3 + Math.random() * 2 : 5 + Math.random() * 4,
            direction: Math.random() < 0.5 ? 1 : -1,
          })
        }
      }
      activeSphereSpikeRef.current = sphereSpikes.filter(s => elapsed - s.startTime < s.duration)

      for (const spike of activeSphereSpikeRef.current) {
        const prog = (elapsed - spike.startTime) / spike.duration
        let envelope: number
        if (prog < 0.2) { const u = prog / 0.2; envelope = u * u * (3 - 2 * u) }
        else if (prog < 0.6) { envelope = 1 }
        else { const u = (prog - 0.6) / 0.4; envelope = 1 - u * u * (3 - 2 * u) }

        const leaderDisp = spike.power * envelope * spike.direction
        sphereDisp[spike.leaderIndex] += leaderDisp

        const lsp = finalSpherePositions[spike.leaderIndex]
        const lLen = Math.sqrt(lsp.x * lsp.x + lsp.y * lsp.y + lsp.z * lsp.z) || 1
        const lnx = lsp.x / lLen, lny = lsp.y / lLen, lnz = lsp.z / lLen

        for (let j = 0; j < PARTICLE_CONFIG.particleCount; j++) {
          if (j === spike.leaderIndex) continue
          const jsp = finalSpherePositions[j]
          const jLen = Math.sqrt(jsp.x * jsp.x + jsp.y * jsp.y + jsp.z * jsp.z) || 1
          const jnx = jsp.x / jLen, jny = jsp.y / jLen, jnz = jsp.z / jLen
          const dot = lnx * jnx + lny * jny + lnz * jnz
          if (dot < 0.85) continue
          const proximity = (dot - 0.85) / 0.15
          sphereDisp[j] += leaderDisp * proximity * proximity * 0.7
        }
      }
    }

    // Line-to-circle transition (organic, spontaneous)
    const lineToCircleTarget = onboardingStep >= 2 ? 1 : 0
    lineToCircleProgressRef.current += (lineToCircleTarget - lineToCircleProgressRef.current) * 0.015
    const lineToCircle = lineToCircleProgressRef.current

    // Render particles
    const sizesArr = pointsRef.current.geometry.attributes.size.array as Float32Array
    const glowSizesArr = glowPointsRef.current?.geometry.attributes.size.array as Float32Array | undefined
    // When complete, make the sphere more alive with faster breathing
    const breatheSpeed = isComplete ? 1.2 : 0.5
    const breatheOff = Math.sin(elapsed * breatheSpeed) * lerpedBreathe.current * (isComplete ? 1.5 : 1)
    const globalShape = shapeProgressRef.current
    // More dynamic wandering when complete
    const wanderMult = isComplete ? stepConfig.wanderAmplitudeMultiplier * 2.5 : stepConfig.wanderAmplitudeMultiplier
    const pulseKick = progressPulseRef.current * 3
    const lineWidth = 700
    const yOffset = 100

    for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) {
      const p = particlesData[i]
      const i3 = i * 3

      currentAnglesRef.current[i] += p.orbitSpeed * lerpedOrbitSpeed.current
      const curAngle = currentAnglesRef.current[i] + angleOffsets[i]

      let wanderOffset = 0
      if (p.isWanderer) {
        wanderOffset = Math.sin(elapsed * p.wanderSpeed + p.wanderPhase) * p.wanderAmplitude * wanderMult * p.wanderDirection
      }

      const pRadius = currentRadius[i] + breatheOff + wanderOffset + pulseKick

      // Line (step 1)
      const numStrands = 5
      const strandIndex = i % numStrands
      const strandT = Math.floor(i / numStrands) / Math.floor(PARTICLE_CONFIG.particleCount / numStrands)
      const lineX = (strandT - 0.5) * lineWidth
      const rawEnvelope = Math.sin(strandT * Math.PI)
      const envelope = rawEnvelope * rawEnvelope
      const strandSpread = 20
      const strandOffset = (strandIndex - (numStrands - 1) / 2) * strandSpread * envelope
      const strandSeed = strandIndex * 137.5
      const wave1 = Math.sin(strandT * Math.PI * 4 + elapsed * (0.7 + strandIndex * 0.2) + strandSeed) * 10
      const wave2 = Math.sin(strandT * Math.PI * 7 + elapsed * (1.1 + strandIndex * 0.15) + strandSeed * 0.7) * 5
      const wave3 = Math.sin(strandT * Math.PI * 11 + elapsed * (0.5 + strandIndex * 0.25) + p.breatheOffset) * 3
      const escapePhase = p.breatheOffset + elapsed * p.wanderSpeed * 2
      const escapeAmount = Math.sin(escapePhase) * Math.sin(escapePhase * 0.37)
      const escapeDist = p.wanderAmplitude * 0.8 * escapeAmount * envelope
      const escapeAngle = p.breatheOffset * 3 + elapsed * 0.3
      const baseY = strandOffset + (wave1 + wave2 + wave3) * envelope
      const lineY = baseY + Math.sin(escapeAngle) * escapeDist
      const lineZ = Math.cos(escapeAngle) * escapeDist + Math.sin(p.breatheOffset + elapsed * 0.3 + strandIndex) * 3 * envelope

      // Circle (step 2+)
      const circleX = Math.cos(curAngle) * pRadius
      const circleY = Math.sin(curAngle) * pRadius

      // Spontaneous transition: each particle has its own random delay
      // Use particle's breatheOffset as a stable random seed for consistent behavior
      const randomDelay = (Math.sin(p.breatheOffset * 7.3) * 0.5 + 0.5) * 0.6 // 0 to 0.6 random delay
      const delayedLineToCircle = Math.max(0, (lineToCircle - randomDelay) / (1 - randomDelay + 0.001))
      const clampedTransition = Math.min(delayedLineToCircle, 1)
      // Smooth easing for organic feel
      const easedTransition = clampedTransition * clampedTransition * (3 - 2 * clampedTransition)

      let finalX = lineX + (circleX - lineX) * easedTransition
      let finalY = lineY + (circleY - lineY) * easedTransition
      let finalZ = lineZ * (1 - easedTransition)

      // Inner shape convergence
      if (p.isShapeParticle && p.shapeIndex >= 0 && globalShape > 0.003) {
        const delayedProg = Math.max(0, globalShape - p.convergenceDelay) / (1 - p.convergenceDelay + 0.001)
        const clamped = Math.min(delayedProg, 1)
        particleConv[i] += (clamped - particleConv[i]) * p.convergenceSpeed
        const eased = 1 - Math.pow(1 - particleConv[i], 4)
        const si = p.shapeIndex
        const shapeBreathe = Math.sin(elapsed * 0.6 + si * 0.04) * 3.0 + Math.sin(elapsed * 1.1 + si * 0.07) * 1.2
        const localX = morphX[si] + Math.cos(curAngle) * shapeBreathe
        const localY = morphY[si] + Math.sin(curAngle) * shapeBreathe
        const localZ = morphZ[si]
        const rx = localX * cosRy + localZ * sinRy
        const rz1 = -localX * sinRy + localZ * cosRy
        const ry = localY * cosRx - rz1 * sinRx
        const rz = localY * sinRx + rz1 * cosRx
        finalX = circleX + (rx - circleX) * eased
        finalY = circleY + (ry - circleY) * eased
        finalZ = rz * eased
      } else if (!p.isShapeParticle && globalShape > 0.003) {
        const pushAmt = Math.min(globalShape, 1) * PARTICLE_CONFIG.convergenceOutwardPush
        const ang = Math.atan2(circleY, circleX)
        finalX = circleX + Math.cos(ang) * pushAmt
        finalY = circleY + Math.sin(ang) * pushAmt
        particleConv[i] *= 0.97
      } else {
        particleConv[i] *= 0.97
      }

      // Final sphere convergence
      if (globalFinal > 0.003) {
        const delayedFinal = Math.max(0, globalFinal - p.finalDelay) / (1 - p.finalDelay + 0.001)
        const clampedFinal = Math.min(delayedFinal, 1)
        finalConv[i] += (clampedFinal - finalConv[i]) * p.finalSpeed
        const easedFinal = 1 - Math.pow(1 - finalConv[i], 3)
        const sp = finalSpherePositions[i]
        // Faster breathing when complete
        const breatheSpeed = isComplete ? 1.0 : 0.4
        const breatheAmt = isComplete ? 0.08 : 0.04
        const spBreathe = 1 + Math.sin(elapsed * breatheSpeed + i * 0.003) * breatheAmt
        const spikeDisp = sphereDisp[i]

        // Dynamic in/out particle movement when complete
        let wanderDisp = 0
        if (isComplete && p.isWanderer) {
          // Some particles drift out and back in
          const wanderPhase = elapsed * p.wanderSpeed * 1.5 + p.wanderPhase
          wanderDisp = Math.sin(wanderPhase) * p.wanderAmplitude * 0.4
          // Add occasional "escape" particles that go further out
          if (Math.sin(wanderPhase * 0.3) > 0.7) {
            wanderDisp *= 2.5
          }
        }

        const spLen = Math.sqrt(sp.x * sp.x + sp.y * sp.y + sp.z * sp.z) || 1
        const nx = sp.x / spLen, ny = sp.y / spLen, nz = sp.z / spLen
        const totalDisp = spikeDisp + wanderDisp
        const slx = sp.x * spBreathe + nx * totalDisp
        const sly = sp.y * spBreathe + ny * totalDisp
        const slz = sp.z * spBreathe + nz * totalDisp
        const srx = slx * cosRy + slz * sinRy
        const srz1 = -slx * sinRy + slz * cosRy
        const sry = sly * cosRx - srz1 * sinRx
        const srz = sly * sinRx + srz1 * cosRx
        finalX = finalX + (srx - finalX) * easedFinal
        finalY = finalY + (sry - finalY) * easedFinal
        finalZ = finalZ + (srz - finalZ) * easedFinal
      }

      // Processing pulse
      let sizeMul = 1
      if (isProcessing && !isComplete) {
        const ang = Math.atan2(finalY, finalX)
        sizeMul = 1 + 0.4 * Math.sin(elapsed * 4 + ang * 3) + 0.15 * Math.sin(elapsed * 7 + ang * 5)
      }

      positions[i3] = finalX
      positions[i3 + 1] = finalY + yOffset
      positions[i3 + 2] = finalZ
      glowPositions[i3] = finalX
      glowPositions[i3 + 1] = finalY + yOffset
      glowPositions[i3 + 2] = finalZ - 1

      const restR = p.restRadius + (lerpedRadius.current - PARTICLE_CONFIG.baseRadius)
      const disp = Math.abs(currentRadius[i] - restR) + Math.abs(wanderOffset) * 0.3
      sizesArr[i] = 3.5 * (1 + Math.min(disp * 0.04, 2.0)) * sizeMul
      if (glowSizesArr) {
        glowSizesArr[i] = 18 * (1 + Math.min(disp * 0.06, 3.0))
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.size.needsUpdate = true
    if (glowPointsRef.current) {
      glowPointsRef.current.geometry.attributes.position.needsUpdate = true
      glowPointsRef.current.geometry.attributes.size.needsUpdate = true
      glowPointsRef.current.visible = true
    }
  })

  return (
    <group>
      <points ref={glowPointsRef} renderOrder={0}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
          <bufferAttribute attach="attributes-size" args={[glowSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          ref={glowMaterialRef} size={18} sizeAttenuation transparent opacity={0.12}
          map={glowTexture} depthWrite={false} color="#333333" blending={THREE.NormalBlending}
        />
      </points>
      <points ref={pointsRef} renderOrder={1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMaterialRef} size={3} sizeAttenuation transparent opacity={0.6}
          map={particleTexture} depthWrite={false} color="#ffffff"
        />
      </points>
    </group>
  )
}

// =============================================================================
// SCENE (wraps Particles + Labels)
// =============================================================================
function Scene({
  onboardingStep,
  assistantName,
  isProcessing,
  isComplete,
  isDark,
  formProgress,
  spikeEvents,
}: {
  onboardingStep: number
  assistantName: string
  isProcessing: boolean
  isComplete: boolean
  isDark: boolean
  formProgress: number
  spikeEvents: SpikeEvent[]
}) {
  const [spikeLabels, setSpikeLabels] = useState<ActiveSpikeLabel[]>([])
  const [visibleLabels, setVisibleLabels] = useState<Map<string, ActiveSpikeLabel & { isExiting: boolean }>>(new Map())
  const [sphereProgress, setSphereProgress] = useState(0)

  // Track sphere collapse progress
  useEffect(() => {
    if (isComplete) {
      // Animate sphere progress from 0 to 1 over ~1.5 seconds
      const startTime = Date.now()
      const duration = 1500

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        setSphereProgress(progress)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    } else {
      setSphereProgress(0)
    }
  }, [isComplete])

  const handleSpikeLabelsUpdate = useCallback((labels: ActiveSpikeLabel[]) => {
    setSpikeLabels(labels)
  }, [])

  useEffect(() => {
    setVisibleLabels(prev => {
      const next = new Map(prev)
      const activeIds = new Set(spikeLabels.map(l => l.id))

      // Mark labels that are no longer active as exiting
      for (const [id, label] of next) {
        if (!activeIds.has(id) && !label.isExiting) {
          next.set(id, { ...label, isExiting: true })
        }
      }

      // Add or update active labels
      for (const label of spikeLabels) {
        if (!next.has(label.id) || !next.get(label.id)!.isExiting) {
          next.set(label.id, { ...label, isExiting: false })
        } else {
          // Update position of existing label
          const existing = next.get(label.id)!
          if (!existing.isExiting) {
            next.set(label.id, { ...label, isExiting: false })
          }
        }
      }

      return next
    })
  }, [spikeLabels])

  const handleExitComplete = useCallback((id: string) => {
    setVisibleLabels(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  return (
    <>
      <Particles
        onboardingStep={onboardingStep}
        assistantName={assistantName}
        isProcessing={isProcessing}
        isComplete={isComplete}
        isDark={isDark}
        formProgress={formProgress}
        triggeredSpikes={spikeEvents}
        onSpikeLabelsUpdate={handleSpikeLabelsUpdate}
      />

      {Array.from(visibleLabels.values()).map(label => (
        <SpikeLabel
          key={label.id}
          label={label}
          isDark={isDark}
          isExiting={label.isExiting}
          isCollapsingToSphere={isComplete}
          sphereProgress={sphereProgress}
          onExitComplete={() => handleExitComplete(label.id)}
        />
      ))}
    </>
  )
}

// =============================================================================
// EXPORTED WRAPPER
// =============================================================================
export function ThreeBackground({
  onboardingStep,
  assistantName,
  isProcessing,
  isComplete,
  isDark,
  formProgress,
  spikeEvents = [],
}: {
  onboardingStep: number
  assistantName: string
  isProcessing: boolean
  isComplete: boolean
  isDark: boolean
  formProgress: number
  spikeEvents?: SpikeEvent[]
}) {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 300], fov: 90 }} gl={{ antialias: true, alpha: false }} dpr={[1, 2]}>
        <Scene
          onboardingStep={onboardingStep}
          assistantName={assistantName}
          isProcessing={isProcessing}
          isComplete={isComplete}
          isDark={isDark}
          formProgress={formProgress}
          spikeEvents={spikeEvents}
        />
      </Canvas>
    </div>
  )
}

export default ThreeBackground
