// =============================================================================
// MEANINGFUL SHAPE POINT GENERATORS
// =============================================================================
// Three shapes that tell the assistant's story:
//   1. Sphere   — wholeness, raw potential
//   2. Eye      — perception and awareness
//   3. Infinity — limitless capability

function distributeOnOutline(
  outlinePoints: { x: number; y: number; z?: number }[],
  count: number,
  scale: number,
  scatter: number = 0.06
): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = []

  for (let i = 0; i < Math.min(count, outlinePoints.length); i++) {
    points.push({
      x: outlinePoints[i].x * scale,
      y: outlinePoints[i].y * scale,
      z: (outlinePoints[i].z ?? 0) * scale,
    })
  }

  const outlineCount = points.length
  while (points.length < count) {
    const base = points[Math.floor(Math.random() * outlineCount)]
    points.push({
      x: base.x + (Math.random() - 0.5) * scatter * scale,
      y: base.y + (Math.random() - 0.5) * scatter * scale,
      z: base.z + (Math.random() - 0.5) * scatter * scale * 0.5,
    })
  }

  return points
}

// ---------------------------------------------------------------------------
// SPHERE — 3D sphere outline (points distributed on surface)
// ---------------------------------------------------------------------------
function generateSphere(count: number): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = []
  // Fibonacci sphere for even 3D distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2 // -1 to 1
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = goldenAngle * i
    points.push({
      x: Math.cos(theta) * radiusAtY * 0.5,
      y: y * 0.5,
      z: Math.sin(theta) * radiusAtY * 0.5,
    })
  }
  return points
}

// ---------------------------------------------------------------------------
// EYE — 3D almond shape with iris, has depth curvature
// ---------------------------------------------------------------------------
function generateEye(count: number): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = []
  const outerCount = Math.floor(count * 0.55)
  const irisCount = count - outerCount

  // Outer almond with 3D curvature (bulges forward in center)
  for (let i = 0; i < outerCount; i++) {
    const t = (i / outerCount) * Math.PI * 2
    const xBase = Math.cos(t) * 0.75
    const yBase = Math.sin(t) * 0.32 * (1 - 0.3 * Math.cos(t) * Math.cos(t))
    // Z depth: eye bulges outward at center, flat at edges
    const centerDist = Math.sqrt(xBase * xBase + yBase * yBase)
    const zBase = Math.max(0, 0.18 - centerDist * 0.2) * Math.sin(t * 0.5 + 0.5)
    points.push({ x: xBase, y: yBase, z: zBase })
  }

  // Iris circle — sits slightly forward in z
  for (let i = 0; i < irisCount; i++) {
    const a = (i / irisCount) * Math.PI * 2
    points.push({
      x: Math.cos(a) * 0.18,
      y: Math.sin(a) * 0.18,
      z: 0.08,
    })
  }

  return points
}

// ---------------------------------------------------------------------------
// INFINITY — 3D lemniscate with depth twist
// ---------------------------------------------------------------------------
function generateInfinity(count: number): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = []
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2
    const denom = 1 + Math.sin(t) * Math.sin(t)
    const x = (Math.cos(t) / denom) * 0.7
    const y = (Math.sin(t) * Math.cos(t) / denom) * 0.45
    // Z twist: one loop tilts forward, the other backward (like a Möbius hint)
    const z = Math.sin(t) * 0.15
    points.push({ x, y, z })
  }
  return points
}

/**
 * Generates 3 shape variants with the same point count.
 * Points maintain consistent ordering for smooth morphing.
 *
 * Shape narrative: sphere → eye → infinity → repeat
 */
export function generateAllShapes(count: number, scale: number = 35): {
  shapes: { x: number; y: number; z: number }[][]
  shapeCount: number
} {
  const outlineCount = Math.floor(count * 0.9)

  const shapes = [
    distributeOnOutline(generateSphere(outlineCount), count, scale, 0.05),
    distributeOnOutline(generateEye(outlineCount), count, scale, 0.06),
    distributeOnOutline(generateInfinity(outlineCount), count, scale, 0.06),
  ]

  return { shapes, shapeCount: shapes.length }
}
