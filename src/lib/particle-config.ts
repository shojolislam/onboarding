// =============================================================================
// PARTICLE SYSTEM CONFIGURATION
// =============================================================================

export const PARTICLE_CONFIG = {
  particleCount: 2000,
  baseRadius: 100,
  breatheAmount: 2,

  // Anomaly / spike selection
  potentialAnomalyChance: 0.08,   // 8% can become spike leaders
  chargeRate: 0.003,
  chargeThreshold: 1.0,
  maxActiveSpikes: 2,

  // Spike properties
  spikeMinPower: 25,
  spikeMaxPower: 55,
  spikeMinDuration: 4.0,
  spikeMaxDuration: 8.0,

  attractionStrength: 0.85,
  maxAngularDist: 0.2,

  fixedAnchorPercent: 0.12,
  anomalyCooldown: 10.0,
  minSpikeSeparation: 0.9,

  // Wanderers — particles that spontaneously drift in/out
  wandererPercent: 0.06,          // 6% of particles are wanderers
  wanderMinAmplitude: 8,
  wanderMaxAmplitude: 25,
  wanderMinSpeed: 0.3,
  wanderMaxSpeed: 0.8,

  // Shape convergence
  shapeParticlePercent: 0.15,     // fewer particles = less dense, more airy shapes
  shapeScale: 55,                 // bigger shapes inside the circle
  convergenceOutwardPush: 10,
} as const

// Per-step visual parameters
export interface StepConfig {
  radius: number
  breathe: number
  orbitSpeedMultiplier: number
  // Spike intensity per step
  chargeRateMultiplier: number
  maxSpikes: number
  spikePowerMultiplier: number
  cooldownMultiplier: number
  inwardBias: number              // 0-1, probability spike goes inward
  // Wanderer intensity per step
  wanderAmplitudeMultiplier: number
}

export const STEP_CONFIGS: Record<number, StepConfig> = {
  1: {
    radius: 55,
    breathe: 1.2,
    orbitSpeedMultiplier: 0.3,
    chargeRateMultiplier: 0.5,
    maxSpikes: 1,
    spikePowerMultiplier: 0.4,
    cooldownMultiplier: 2.0,      // slow, rare spikes
    inwardBias: 0.4,
    wanderAmplitudeMultiplier: 0.6,
  },
  2: {
    radius: 120,
    breathe: 3,
    orbitSpeedMultiplier: 0.7,
    chargeRateMultiplier: 1.2,
    maxSpikes: 2,
    spikePowerMultiplier: 0.7,
    cooldownMultiplier: 1.2,
    inwardBias: 0.35,
    wanderAmplitudeMultiplier: 1.0,
  },
  3: {
    radius: 180,
    breathe: 4.5,
    orbitSpeedMultiplier: 1.3,
    chargeRateMultiplier: 2.5,
    maxSpikes: 3,
    spikePowerMultiplier: 1.0,
    cooldownMultiplier: 0.5,      // very frequent
    inwardBias: 0.4,
    wanderAmplitudeMultiplier: 1.4,
  },
  4: {
    radius: 200,
    breathe: 4,
    orbitSpeedMultiplier: 1.8,          // noticeably faster orbiting
    chargeRateMultiplier: 4.0,          // spikes charge up very fast
    maxSpikes: 5,                       // many simultaneous spikes
    spikePowerMultiplier: 1.2,          // strong spikes
    cooldownMultiplier: 0.25,           // very short cooldown → constant activity
    inwardBias: 0.3,
    wanderAmplitudeMultiplier: 1.8,     // more wanderers drifting out
  },
  5: {
    radius: 120,                        // smaller circle for permissions step
    breathe: 3.5,
    orbitSpeedMultiplier: 1.0,
    chargeRateMultiplier: 1.5,
    maxSpikes: 3,
    spikePowerMultiplier: 0.6,          // gentler spikes
    cooldownMultiplier: 1.0,
    inwardBias: 0.35,
    wanderAmplitudeMultiplier: 1.2,
  },
  6: {
    radius: 140,
    breathe: 3,
    orbitSpeedMultiplier: 0.8,
    chargeRateMultiplier: 1.0,
    maxSpikes: 2,
    spikePowerMultiplier: 0.5,
    cooldownMultiplier: 1.5,
    inwardBias: 0.4,
    wanderAmplitudeMultiplier: 1.0,
  },
}
