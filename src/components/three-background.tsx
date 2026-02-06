"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { PARTICLE_CONFIG, STEP_CONFIGS } from "@/lib/particle-config"
import { generateAllShapes } from "@/lib/shape-points"

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

// Generate volumetric sphere positions (particles distributed throughout the volume, not just surface)
function generateFinalSphere(count: number, radius: number): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    // Use cube root for uniform volume distribution (not just surface)
    const t = i / (count - 1)
    const r = Math.cbrt(0.15 + t * 0.85) * radius // Range from 15% to 100% of radius

    // Fibonacci-like angular distribution
    const y = 1 - (i / (count - 1)) * 2 // -1 to 1
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = goldenAngle * i

    points.push({
      x: Math.cos(theta) * radiusAtY * r,
      y: y * r,
      z: Math.sin(theta) * radiusAtY * r,
    })
  }
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
  // Final sphere convergence personality
  finalDelay: number
  finalSpeed: number
  // Sphere heartbeat
  sphereSpikeCharge: number
  sphereLastSpikeTime: number
}

interface Spike {
  leaderIndex: number
  direction: number
  power: number
  startTime: number
  duration: number
}

// Sphere spike: a radial pulse on the sphere surface
interface SphereSpike {
  leaderIndex: number
  power: number       // radial displacement
  startTime: number
  duration: number
  direction: number   // +1 outward, -1 inward
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
}: {
  onboardingStep: number
  assistantName: string
  isProcessing: boolean
  isComplete: boolean
  isDark: boolean
  formProgress: number
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

  // Lerped step parameters
  const lerpedRadius = useRef(STEP_CONFIGS[1].radius)
  const lerpedBreathe = useRef(STEP_CONFIGS[1].breathe)
  const lerpedOrbitSpeed = useRef(STEP_CONFIGS[1].orbitSpeedMultiplier)

  // Convergence (inner shape when naming)
  const shapeProgressRef = useRef(0)
  const prevAssistantNameRef = useRef("")
  const particleConvergenceRef = useRef<Float32Array>(new Float32Array(PARTICLE_CONFIG.particleCount))

  // Final sphere convergence (when complete)
  const finalConvergenceRef = useRef<Float32Array>(new Float32Array(PARTICLE_CONFIG.particleCount))
  const finalProgressRef = useRef(0)

  // Morphing: current interpolated target positions for each shape particle (3D)
  const morphTargetsXRef = useRef<Float32Array>(new Float32Array(0))
  const morphTargetsYRef = useRef<Float32Array>(new Float32Array(0))
  const morphTargetsZRef = useRef<Float32Array>(new Float32Array(0))

  // 3D rotation for shape
  const shapeRotationRef = useRef({ x: 0, y: 0 })

  // Form progress pulse: detect changes to trigger visual burst
  const prevFormProgressRef = useRef(formProgress)
  const progressPulseRef = useRef(0)

  const { scene } = useThree()

  // Theme
  const targetBgRef = useRef(new THREE.Color(0x0a0a0a))
  useEffect(() => { targetBgRef.current = new THREE.Color(isDark ? 0x0a0a0a : 0xffffff) }, [isDark])
  useEffect(() => { scene.background = new THREE.Color(isDark ? 0x0a0a0a : 0xffffff) }, [scene, isDark])

  // Shape variants
  const shapeCount = Math.floor(PARTICLE_CONFIG.particleCount * PARTICLE_CONFIG.shapeParticlePercent)
  const allShapes = useMemo(
    () => generateAllShapes(shapeCount, PARTICLE_CONFIG.shapeScale),
    [shapeCount]
  )

  // Final sphere target positions for ALL particles
  const finalSpherePositions = useMemo(
    () => generateFinalSphere(PARTICLE_CONFIG.particleCount, 65),
    []
  )

  // Line-to-circle transition tracking
  const lineToCircleProgressRef = useRef(0)

  // Init morph target buffers
  useEffect(() => {
    morphTargetsXRef.current = new Float32Array(shapeCount)
    morphTargetsYRef.current = new Float32Array(shapeCount)
    morphTargetsZRef.current = new Float32Array(shapeCount)
  }, [shapeCount])

  // Particle init
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
        wanderAmplitude: PARTICLE_CONFIG.wanderMinAmplitude +
          Math.random() * (PARTICLE_CONFIG.wanderMaxAmplitude - PARTICLE_CONFIG.wanderMinAmplitude),
        wanderSpeed: PARTICLE_CONFIG.wanderMinSpeed +
          Math.random() * (PARTICLE_CONFIG.wanderMaxSpeed - PARTICLE_CONFIG.wanderMinSpeed),
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

  // Init angles
  useMemo(() => {
    for (let i = 0; i < particlesData.length; i++) {
      currentAnglesRef.current[i] = particlesData[i].baseAngle
    }
  }, [particlesData])

  // Buffers
  const positions = useMemo(() => new Float32Array(PARTICLE_CONFIG.particleCount * 3), [])
  const glowPositions = useMemo(() => new Float32Array(PARTICLE_CONFIG.particleCount * 3), [])
  const sizes = useMemo(() => { const a = new Float32Array(PARTICLE_CONFIG.particleCount); a.fill(3); return a }, [])
  const glowSizes = useMemo(() => { const a = new Float32Array(PARTICLE_CONFIG.particleCount); a.fill(15); return a }, [])
  const particleTexture = useMemo(() => createParticleTexture(), [])
  const glowTexture = useMemo(() => createGlowTexture(), [])

  // ==========================================================================
  // ANIMATION LOOP
  // ==========================================================================
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

    // -------------------------------------------------------------------
    // FORM PROGRESS PULSE — detect input changes
    // -------------------------------------------------------------------
    if (formProgress > prevFormProgressRef.current + 0.01) {
      // Progress increased — trigger gentle visual pulse
      progressPulseRef.current = Math.min(progressPulseRef.current + 0.4, 1.0)
    }
    prevFormProgressRef.current = formProgress
    // Very slow decay so pulse is gentle, not jarring
    progressPulseRef.current *= 0.985

    // -------------------------------------------------------------------
    // LERP STEP PARAMETERS — very slow, natural transitions
    // Much slower lerp rate (0.006) so changes feel organic like the particles
    // -------------------------------------------------------------------
    const progressBoost = formProgress * 12
    const lr = 0.006 // very slow — matches particle animation speed
    lerpedRadius.current += (stepConfig.radius + progressBoost - lerpedRadius.current) * lr
    lerpedBreathe.current += (stepConfig.breathe - lerpedBreathe.current) * lr
    const targetOrbitSpeed = stepConfig.orbitSpeedMultiplier * (1 + formProgress * 0.2)
    lerpedOrbitSpeed.current += (targetOrbitSpeed - lerpedOrbitSpeed.current) * lr

    // -------------------------------------------------------------------
    // CONVERGENCE STATE (inner shape when assistant named)
    // -------------------------------------------------------------------
    const hasName = assistantName.trim().length > 0
    const hadName = prevAssistantNameRef.current.trim().length > 0
    if (hasName && !hadName) {
      shapeProgressRef.current = 0
      particleConv.fill(0)
    }
    const shapeGoal = hasName ? 1 : 0
    shapeProgressRef.current += (shapeGoal - shapeProgressRef.current) * 0.006
    prevAssistantNameRef.current = assistantName

    // -------------------------------------------------------------------
    // FINAL SPHERE CONVERGENCE (when processing is complete)
    // -------------------------------------------------------------------
    const finalGoal = isComplete ? 1 : 0
    finalProgressRef.current += (finalGoal - finalProgressRef.current) * 0.008

    // -------------------------------------------------------------------
    // 3D ROTATION for shapes
    // -------------------------------------------------------------------
    const rot = shapeRotationRef.current
    rot.y = elapsed * 0.15
    rot.x = Math.sin(elapsed * 0.08) * 0.3
    const cosRy = Math.cos(rot.y), sinRy = Math.sin(rot.y)
    const cosRx = Math.cos(rot.x), sinRx = Math.sin(rot.x)

    // -------------------------------------------------------------------
    // MORPHING SHAPE TARGETS (3D)
    // -------------------------------------------------------------------
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

    // -------------------------------------------------------------------
    // THEME
    // -------------------------------------------------------------------
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(targetBgRef.current, 0.05)
    }
    if (pointsMaterialRef.current) {
      pointsMaterialRef.current.opacity = isDark ? 0.6 : 0.45
      pointsMaterialRef.current.color.set(isDark ? "#ffffff" : "#1a1a1a")
    }
    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = 0.12
      glowMaterialRef.current.color.set(isDark ? "#333333" : "#4a4a4a")
    }

    // -------------------------------------------------------------------
    // SPIKE PHYSICS
    // -------------------------------------------------------------------
    angleOffsets.fill(0)

    for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) {
      currentRadius[i] = particlesData[i].restRadius + (lerpedRadius.current - PARTICLE_CONFIG.baseRadius)
    }

    // Progress pulse: gently increase spike activity when user fills a field
    const pulseChargeMul = 1 + progressPulseRef.current * 1.5
    const pulseSpikeLimit = stepConfig.maxSpikes + (progressPulseRef.current > 0.5 ? 1 : 0)

    const effectiveCooldown = PARTICLE_CONFIG.anomalyCooldown * stepConfig.cooldownMultiplier
    const effectiveChargeRate = PARTICLE_CONFIG.chargeRate * stepConfig.chargeRateMultiplier * pulseChargeMul

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
        const basePow = PARTICLE_CONFIG.spikeMinPower +
          Math.random() * (PARTICLE_CONFIG.spikeMaxPower - PARTICLE_CONFIG.spikeMinPower)
        p.charge = 0
        p.lastSpikeTime = elapsed
        activeSpikesRef.current.push({
          leaderIndex: i, direction: dir,
          power: basePow * stepConfig.spikePowerMultiplier * (1 + progressPulseRef.current * 0.25),
          startTime: elapsed,
          duration: PARTICLE_CONFIG.spikeMinDuration +
            Math.random() * (PARTICLE_CONFIG.spikeMaxDuration - PARTICLE_CONFIG.spikeMinDuration),
        })
      }
    }

    activeSpikesRef.current = activeSpikesRef.current.filter(s => elapsed - s.startTime < s.duration)

    for (const spike of activeSpikesRef.current) {
      const prog = (elapsed - spike.startTime) / spike.duration
      let envelope: number
      if (prog < 0.15) { const u = prog / 0.15; envelope = u * u * (3 - 2 * u) }
      else if (prog < 0.7) { envelope = 1 }
      else { const u = (prog - 0.7) / 0.3; envelope = 1 - u * u * (3 - 2 * u) }

      const leaderDisp = spike.power * envelope * spike.direction
      displacements[spike.leaderIndex] += leaderDisp

      const leaderAngle = currentAnglesRef.current[spike.leaderIndex]
      for (let j = 0; j < PARTICLE_CONFIG.particleCount; j++) {
        if (j === spike.leaderIndex || particlesData[j].isFixedAnchor) continue
        const angDist = normalizedAngularDistance(currentAnglesRef.current[j], leaderAngle)
        if (angDist > PARTICLE_CONFIG.maxAngularDist) continue
        const f = 1 - angDist / PARTICLE_CONFIG.maxAngularDist
        displacements[j] += leaderDisp * f * f * f * PARTICLE_CONFIG.attractionStrength
      }
    }

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

    // -------------------------------------------------------------------
    // SPHERE HEARTBEAT SPIKES (3D radial spikes on the final sphere)
    // Only active once sphere has mostly converged
    // -------------------------------------------------------------------
    const sphereDisp = sphereDisplacementsRef.current
    sphereDisp.fill(0)
    const globalFinal = finalProgressRef.current

    if (globalFinal > 0.5) {
      const sphereSpikes = activeSphereSpikeRef.current

      // Charge and trigger sphere spikes
      const sphereCooldown = 8.0
      const sphereChargeRate = 0.004
      for (let i = 0; i < particlesData.length; i++) {
        const p = particlesData[i]
        if (!p.isPotentialAnomaly) continue
        if (elapsed - p.sphereLastSpikeTime < sphereCooldown) continue
        p.sphereSpikeCharge += sphereChargeRate * p.chargeRateMultiplier
        if (p.sphereSpikeCharge >= 1 && sphereSpikes.length < 3) {
          p.sphereSpikeCharge = 0
          p.sphereLastSpikeTime = elapsed
          sphereSpikes.push({
            leaderIndex: i,
            power: 8 + Math.random() * 14,
            startTime: elapsed,
            duration: 5 + Math.random() * 4,
            direction: Math.random() < 0.5 ? 1 : -1,
          })
        }
      }

      // Remove expired
      activeSphereSpikeRef.current = sphereSpikes.filter(s => elapsed - s.startTime < s.duration)

      // Compute sphere spike displacements with neighbor attraction
      for (const spike of activeSphereSpikeRef.current) {
        const prog = (elapsed - spike.startTime) / spike.duration
        let envelope: number
        if (prog < 0.2) { const u = prog / 0.2; envelope = u * u * (3 - 2 * u) }
        else if (prog < 0.6) { envelope = 1 }
        else { const u = (prog - 0.6) / 0.4; envelope = 1 - u * u * (3 - 2 * u) }

        const leaderDisp = spike.power * envelope * spike.direction
        sphereDisp[spike.leaderIndex] += leaderDisp

        // Neighbor attraction: particles near the leader on the sphere follow it
        // Use 3D distance on sphere surface (dot product of normals)
        const lsp = finalSpherePositions[spike.leaderIndex]
        const lLen = Math.sqrt(lsp.x * lsp.x + lsp.y * lsp.y + lsp.z * lsp.z) || 1
        const lnx = lsp.x / lLen, lny = lsp.y / lLen, lnz = lsp.z / lLen

        for (let j = 0; j < PARTICLE_CONFIG.particleCount; j++) {
          if (j === spike.leaderIndex) continue
          const jsp = finalSpherePositions[j]
          const jLen = Math.sqrt(jsp.x * jsp.x + jsp.y * jsp.y + jsp.z * jsp.z) || 1
          const jnx = jsp.x / jLen, jny = jsp.y / jLen, jnz = jsp.z / jLen

          // Dot product gives angular proximity (1 = same spot, -1 = opposite)
          const dot = lnx * jnx + lny * jny + lnz * jnz
          // Only affect nearby particles (dot > 0.85 ≈ ~30° cone)
          if (dot < 0.85) continue
          const proximity = (dot - 0.85) / 0.15 // 0-1
          sphereDisp[j] += leaderDisp * proximity * proximity * 0.7
        }
      }
    }

    // -------------------------------------------------------------------
    // LINE-TO-CIRCLE TRANSITION (Step 1 = line, Step 2+ = circle)
    // -------------------------------------------------------------------
    const lineToCircleTarget = onboardingStep >= 2 ? 1 : 0
    lineToCircleProgressRef.current += (lineToCircleTarget - lineToCircleProgressRef.current) * 0.02
    const lineToCircle = lineToCircleProgressRef.current

    // -------------------------------------------------------------------
    // RENDER PARTICLES
    // -------------------------------------------------------------------
    const sizesArr = pointsRef.current.geometry.attributes.size.array as Float32Array
    const glowSizesArr = glowPointsRef.current?.geometry.attributes.size.array as Float32Array | undefined
    const breatheOff = Math.sin(elapsed * 0.5) * lerpedBreathe.current
    const globalShape = shapeProgressRef.current
    const wanderMult = stepConfig.wanderAmplitudeMultiplier
    // Progress pulse adds a gentle breathe kick
    const pulseKick = progressPulseRef.current * 3

    // Line parameters - like a string tied at both ends, loose in the middle
    const lineWidth = 400 // Total width of the line

    for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) {
      const p = particlesData[i]
      const i3 = i * 3

      // Orbital motion
      currentAnglesRef.current[i] += p.orbitSpeed * lerpedOrbitSpeed.current
      const curAngle = currentAnglesRef.current[i] + angleOffsets[i]

      // Wanderer drift
      let wanderOffset = 0
      if (p.isWanderer) {
        wanderOffset = Math.sin(elapsed * p.wanderSpeed + p.wanderPhase) *
          p.wanderAmplitude * wanderMult * p.wanderDirection
      }

      const pRadius = currentRadius[i] + breatheOff + wanderOffset + pulseKick

      // ---------------------------------------------------------------
      // STEP 1: Organic diverging lines - tightly tied at corners
      // Particles drift in and out for organic feel
      // ---------------------------------------------------------------
      const numStrands = 5
      const strandIndex = i % numStrands
      const strandT = Math.floor(i / numStrands) / Math.floor(PARTICLE_CONFIG.particleCount / numStrands)

      const lineX = (strandT - 0.5) * lineWidth

      // Tighter envelope - more aggressively tied at corners
      // Using power of 2 makes edges much tighter
      const rawEnvelope = Math.sin(strandT * Math.PI)
      const envelope = rawEnvelope * rawEnvelope // Squared for tighter corners

      // Strand vertical spread in the center
      const strandSpread = 20
      const strandOffset = (strandIndex - (numStrands - 1) / 2) * strandSpread * envelope

      // Multiple overlapping waves for spontaneous motion
      const strandSeed = strandIndex * 137.5 // Golden angle for variety
      const wave1 = Math.sin(strandT * Math.PI * 4 + elapsed * (0.7 + strandIndex * 0.2) + strandSeed) * 10
      const wave2 = Math.sin(strandT * Math.PI * 7 + elapsed * (1.1 + strandIndex * 0.15) + strandSeed * 0.7) * 5
      const wave3 = Math.sin(strandT * Math.PI * 11 + elapsed * (0.5 + strandIndex * 0.25) + p.breatheOffset) * 3

      // Particle escape - some particles drift away and return
      // Uses particle's unique properties for organic randomness
      const escapePhase = p.breatheOffset + elapsed * p.wanderSpeed * 2
      const escapeAmount = Math.sin(escapePhase) * Math.sin(escapePhase * 0.37) // Irregular timing
      const escapeDist = p.wanderAmplitude * 0.8 * escapeAmount * envelope
      const escapeAngle = p.breatheOffset * 3 + elapsed * 0.3

      // Combine everything
      const baseY = strandOffset + (wave1 + wave2 + wave3) * envelope
      const lineY = baseY + Math.sin(escapeAngle) * escapeDist
      const lineZ = Math.cos(escapeAngle) * escapeDist + Math.sin(p.breatheOffset + elapsed * 0.3 + strandIndex) * 3 * envelope

      // ---------------------------------------------------------------
      // STEP 2+: Circle
      // ---------------------------------------------------------------
      const circleX = Math.cos(curAngle) * pRadius
      const circleY = Math.sin(curAngle) * pRadius

      // Blend between line and circle
      const easedTransition = 1 - Math.pow(1 - lineToCircle, 3) // Ease out cubic
      let finalX = lineX + (circleX - lineX) * easedTransition
      let finalY = lineY + (circleY - lineY) * easedTransition
      let finalZ = lineZ * (1 - easedTransition)

      // ---------------------------------------------------------------
      // INNER SHAPE CONVERGENCE (naming the assistant)
      // ---------------------------------------------------------------
      if (p.isShapeParticle && p.shapeIndex >= 0 && globalShape > 0.003) {
        const delayedProg = Math.max(0, globalShape - p.convergenceDelay) / (1 - p.convergenceDelay + 0.001)
        const clamped = Math.min(delayedProg, 1)
        particleConv[i] += (clamped - particleConv[i]) * p.convergenceSpeed
        const eased = 1 - Math.pow(1 - particleConv[i], 4)

        const si = p.shapeIndex
        const shapeBreathe = Math.sin(elapsed * 0.6 + si * 0.04) * 3.0
          + Math.sin(elapsed * 1.1 + si * 0.07) * 1.2

        const localX = morphX[si] + Math.cos(curAngle) * shapeBreathe
        const localY = morphY[si] + Math.sin(curAngle) * shapeBreathe
        const localZ = morphZ[si]

        // 3D rotation
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

      // ---------------------------------------------------------------
      // FINAL SPHERE CONVERGENCE (when complete)
      // All particles slowly converge into a rotating 3D sphere
      // with 3D heartbeat spikes — particles push out along normals
      // and neighbors follow with gravity effect
      // ---------------------------------------------------------------
      if (globalFinal > 0.003) {
        const delayedFinal = Math.max(0, globalFinal - p.finalDelay) / (1 - p.finalDelay + 0.001)
        const clampedFinal = Math.min(delayedFinal, 1)
        finalConv[i] += (clampedFinal - finalConv[i]) * p.finalSpeed
        const easedFinal = 1 - Math.pow(1 - finalConv[i], 3)

        const sp = finalSpherePositions[i]
        const spBreathe = 1 + Math.sin(elapsed * 0.4 + i * 0.003) * 0.04

        // Apply sphere spike displacement along the radial normal
        const spikeDisp = sphereDisp[i]
        const spLen = Math.sqrt(sp.x * sp.x + sp.y * sp.y + sp.z * sp.z) || 1
        const nx = sp.x / spLen, ny = sp.y / spLen, nz = sp.z / spLen

        const slx = sp.x * spBreathe + nx * spikeDisp
        const sly = sp.y * spBreathe + ny * spikeDisp
        const slz = sp.z * spBreathe + nz * spikeDisp

        // Rotate sphere
        const srx = slx * cosRy + slz * sinRy
        const srz1 = -slx * sinRy + slz * cosRy
        const sry = sly * cosRx - srz1 * sinRx
        const srz = sly * sinRx + srz1 * cosRx

        finalX = finalX + (srx - finalX) * easedFinal
        finalY = finalY + (sry - finalY) * easedFinal
        finalZ = finalZ + (srz - finalZ) * easedFinal
      }

      // Processing pulse — energetic size modulation
      let sizeMul = 1
      if (isProcessing && !isComplete) {
        const ang = Math.atan2(finalY, finalX)
        sizeMul = 1 + 0.4 * Math.sin(elapsed * 4 + ang * 3) + 0.15 * Math.sin(elapsed * 7 + ang * 5)
      }

      positions[i3] = finalX
      positions[i3 + 1] = finalY
      positions[i3 + 2] = finalZ
      glowPositions[i3] = finalX
      glowPositions[i3 + 1] = finalY
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
// EXPORTED WRAPPER
// =============================================================================
export function ThreeBackground({
  onboardingStep, assistantName, isProcessing, isComplete, isDark, formProgress,
}: {
  onboardingStep: number; assistantName: string; isProcessing: boolean; isComplete: boolean; isDark: boolean; formProgress: number
}) {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 400], fov: 75 }} gl={{ antialias: true, alpha: false }} dpr={[1, 2]}>
        <Particles
          onboardingStep={onboardingStep} assistantName={assistantName}
          isProcessing={isProcessing} isComplete={isComplete} isDark={isDark}
          formProgress={formProgress}
        />
      </Canvas>
    </div>
  )
}

export default ThreeBackground
