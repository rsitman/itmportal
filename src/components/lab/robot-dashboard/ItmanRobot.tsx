'use client'

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'

// ITMAN brand paleta (podle itman.cz)
const WHITE = 0xffffff
const BLACK = 0x0b0b0b
const GREEN = 0x49b141 // ITMAN zelená
const GREEN_BRIGHT = 0x5bb348
const EYE_GREEN = 0xb6ff9e // světle zelená, svítící

// Tělo je o něco menší v poměru k hlavě
const BODY_SCALE = 0.82

// Mávnutí na úvod: robot mává v oknu [WAVE_START, WAVE_END] (s). Během něj
// musí zůstat vzpřímeně — otočení podle scrollování se aktivuje až po WAVE_END.
export const WAVE_START = 0.4
export const WAVE_END = 3.2

function shellMat(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.12,
    roughness: 0.42,
  })
}
function darkMat(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.3,
    roughness: 0.3,
  })
}
function glowMat(color: number, emissive: number, intensity = 1.6) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    toneMapped: false,
  })
}
function roundedBox(w: number, h: number, d: number, radius = 0.2, smooth = 5) {
  return new RoundedBoxGeometry(w, h, d, smooth, radius)
}

export interface ItmanRobotHandle {
  group: THREE.Group
  update: (
    t: number,
    delta: number,
    pointer: THREE.Vector2,
    viewport: { width: number; height: number },
    flying: boolean,
    scale: number,
  ) => void
  /** Světová pozice zeleného halo prstence (podstavec) — odsud vychází stopa. */
  getHaloWorldPosition: (out: THREE.Vector3) => void
  dispose: () => void
}

/**
 * ITMAN robot podle ilustrace z itman.cz:
 *  - tělo = zaoblený jehlan na špičce (lathe), zmenšený v poměru k hlavě
 *  - menší zaoblená hlava
 *  - visor = prohnutý, kopíruje přední stranu hlavy, končí za očima (zaoblené konce)
 *  - svítící světle zelené oči
 *  - zelené boční akcenty, černý krk
 *  - zelené ITMAN logo na hrudi (textura 2-1-2)
 *  - paže mírně ohnuté v loktech
 */
export function createItmanRobot(): ItmanRobotHandle {
  const group = new THREE.Group()
  group.position.y = -0.12 // trochu odsazen od vrchu, ať hlava neořezává
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(o: T): T => {
    disposables.push(o)
    return o
  }

  const root = new THREE.Group()
  group.add(root)

  const whiteMat = shellMat(WHITE)
  const blackMat = darkMat(BLACK)
  const greenMat = darkMat(GREEN)
  greenMat.metalness = 0.4
  greenMat.roughness = 0.35

  // ===== TORSO — zaoblený jehlan na špičce (lathe), zúžený BODY_SCALE =====
  const profile = [
    [0.0, -1.42],
    [0.1, -1.39],
    [0.22, -1.31],
    [0.34, -1.18],
    [0.45, -1.0],
    [0.55, -0.78],
    [0.64, -0.52],
    [0.72, -0.22],
    [0.79, 0.08],
    [0.82, 0.32],
    [0.8, 0.5],
    [0.74, 0.64],
    [0.62, 0.74],
    [0.46, 0.82],
    [0.32, 0.88],
    [0.28, 0.94],
  ].map(([x, y]) => new THREE.Vector2(x * BODY_SCALE, y))

  const torsoGeo = new THREE.LatheGeometry(profile, 64)
  track(torsoGeo)
  const torsoMesh = new THREE.Mesh(torsoGeo, whiteMat)
  torsoMesh.castShadow = true
  root.add(torsoMesh)

  // Zelené ITMAN logo na hrudi (textura 2-1-2)
  const logoTex = makeLogoTexture()
  track({ dispose: () => logoTex.dispose() })
  const logoMat = new THREE.MeshBasicMaterial({
    map: logoTex,
    transparent: true,
    alphaTest: 0.5,
    depthWrite: false,
  })
  const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), logoMat)
  track(logoPlane.geometry)
  logoPlane.position.set(0, 0.28, 0.82 * BODY_SCALE + 0.03)
  root.add(logoPlane)

  // ===== PAŽE (bílé, mírně ohnuté v loktech) =====
  // Předloktí je vlastní subgroup s pivotem v loktu, aby šlo mávat ohýbáním
  // v loktu (celá paže se zvedne rovně nahoru, vlní se jen předloktí).
  const shoulderX = 0.86 * BODY_SCALE
  let rightArm: THREE.Group | null = null
  let rightForearm: THREE.Group | null = null
  ;[-1, 1].forEach((s) => {
    const arm = new THREE.Group()
    arm.position.set(s * shoulderX, 0.26, 0)

    // nadloktí (ven)
    const upper = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.4, 12, 24),
      whiteMat,
    )
    upper.position.set(s * 0.07, -0.32, 0.02)
    upper.rotation.z = s * 0.22
    track(upper.geometry)

    // loket (kulatý kloub) — pivot předloktí
    const elbowX = s * 0.19
    const elbowY = -0.58
    const elbowZ = 0.04
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), whiteMat)
    elbow.position.set(elbowX, elbowY, elbowZ)
    track(elbow.geometry)

    // předloktí — subgroup pivotovaný v loktu
    const forearm = new THREE.Group()
    forearm.position.set(elbowX, elbowY, elbowZ)

    // předloktí (zpět dovnitř -> ohnutí v lokti), pozice relativně k loktu
    const lower = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.4, 12, 24),
      whiteMat,
    )
    lower.position.set(s * -0.09, -0.34, 0.02)
    lower.rotation.z = s * -0.3
    track(lower.geometry)

    // ruka
    const hand = new THREE.Mesh(roundedBox(0.26, 0.26, 0.26, 0.1, 4), whiteMat)
    hand.position.set(s * -0.17, -0.64, 0.04)
    disposables.push(hand.geometry)

    // zelený náramek nad rukou
    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.026, 12, 32),
      greenMat,
    )
    cuff.position.set(s * -0.14, -0.52, 0.03)
    cuff.rotation.x = Math.PI / 2
    track(cuff.geometry)

    forearm.add(lower, hand, cuff)
    arm.add(upper, elbow, forearm)
    root.add(arm)
    if (s === 1) {
      rightArm = arm
      rightForearm = forearm
    }
  })

  // ===== KRK (černý) =====
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.23, 0.22, 32),
    blackMat,
  )
  neck.position.set(0, 1.05, 0)
  track(neck.geometry)
  root.add(neck)

  // ===== HLAVA (menší, zaoblená) =====
  const head = new THREE.Group()
  head.position.set(0, 1.7, 0)
  root.add(head)

  const HEAD_R = 0.6
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(HEAD_R, 48, 48),
    whiteMat,
  )
  headMesh.scale.set(1.05, 0.92, 1.0)
  headMesh.castShadow = true
  track(headMesh.geometry)
  head.add(headMesh)

  // Visor — prohnutý oblouk s kulatými konci (torusová trubka okolo přední strany hlavy).
  // Místo řezu koule (ostré svislé okraje) používáme torusový oblouk: konce jsou díky
  // trubkovému průřezu přirozeně zaoblené. Oblouk leží v rovině XZ (horizontálně), 
  // centrovaný na +Z (předek), končí za očima.
  const VISOR_R = HEAD_R * 1.06
  const VISOR_TUBE = 0.13
  const VISOR_ARC = 1.5
  const visorGeo = new THREE.TorusGeometry(VISOR_R, VISOR_TUBE, 20, 64, VISOR_ARC)
  track(visorGeo)
  const visor = new THREE.Mesh(visorGeo, blackMat)
  // torus default: prstec v rovině XY, oblouk od +X. Nejprve nakloníme do XZ (rot X -90°),
  // pak pootočíme kolem světové Y o -(π/2 + arc/2), aby střed oblouku mířil na +Z (předek).
  const vq = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -Math.PI / 2,
  )
  const vqy = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    -Math.PI / 2 - VISOR_ARC / 2,
  )
  vq.premultiply(vqy)
  visor.quaternion.copy(vq)
  // přizpůsobení elipsoidu hlavy: local X→world X (šířka 1.05), local Y→world Z (hloubka 1.0),
  // local Z→world Y (výška 0.92)
  visor.scale.set(1.05, 1.0, 0.92)
  head.add(visor)

  // Oči — svítící světle zelené obdélníky na visoru
  const leftEyeMat = glowMat(EYE_GREEN, EYE_GREEN, 1.8)
  const rightEyeMat = glowMat(EYE_GREEN, EYE_GREEN, 1.8)
  const eyeGeo = roundedBox(0.24, 0.12, 0.04, 0.05, 3)
  disposables.push(eyeGeo)

  const placeEye = (phi: number, mat: THREE.Material) => {
    // oko sedí na vnějším povrchu visorové trubky ve směru (cos φ, 0, sin φ)
    const r = VISOR_R + VISOR_TUBE + 0.02
    const pos = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi))
      .multiplyScalar(r)
      .multiply(new THREE.Vector3(1.05, 1.0, 1.0))
    const eye = new THREE.Mesh(eyeGeo, mat)
    eye.position.copy(pos)
    eye.lookAt(pos.clone().multiplyScalar(2))
    return eye
  }
  const leftEye = placeEye(Math.PI / 2 - 0.5, leftEyeMat)
  const rightEye = placeEye(Math.PI / 2 + 0.5, rightEyeMat)
  head.add(leftEye, rightEye)

  // Boční zelené akcenty ("uši")
  ;[-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.18, 32),
      greenMat,
    )
    ear.position.set(s * (HEAD_R * 1.05 + 0.06), 0, 0)
    ear.rotation.z = (s * Math.PI) / 2
    track(ear.geometry)
    head.add(ear)
    const earCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 24, 24),
      glowMat(GREEN_BRIGHT, GREEN_BRIGHT, 0.9),
    )
    earCore.position.set(s * (HEAD_R * 1.05 + 0.15), 0, 0)
    track(earCore.geometry)
    head.add(earCore)
  })

  // ===== LEVITUJÍCÍ ZÁKLAD (zelený prstenec kolem špičky) =====
  const baseGroup = new THREE.Group()
  baseGroup.position.set(0, -1.5, 0)
  root.add(baseGroup)

  const ringMat = glowMat(GREEN, GREEN_BRIGHT, 0.7)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 16, 64), ringMat)
  ring.rotation.x = Math.PI / 2
  track(ring.geometry)
  baseGroup.add(ring)

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.01, 12, 64),
    glowMat(0x9fe6ff, 0x9fe6ff, 0.35),
  )
  outerRing.rotation.x = Math.PI / 2
  track(outerRing.geometry)
  baseGroup.add(outerRing)

  const targetYaw = { v: 0 }
  const targetPitch = { v: 0 }

  function update(
    t: number,
    delta: number,
    pointer: THREE.Vector2,
    viewport: { width: number; height: number },
    flying: boolean,
    scale: number,
  ) {
    root.scale.setScalar(scale)
    root.position.y = Math.sin(t * 1.1) * 0.08
    root.rotation.z = Math.sin(t * 0.6) * 0.03

    const px = (pointer.x * viewport.width) / 2
    const py = (pointer.y * viewport.height) / 2
    targetYaw.v = THREE.MathUtils.clamp(px * 0.25, -0.4, 0.4)
    targetPitch.v = THREE.MathUtils.clamp(-py * 0.14, -0.25, 0.25)
    head.rotation.y = THREE.MathUtils.damp(head.rotation.y, targetYaw.v, 4, delta)
    head.rotation.x = THREE.MathUtils.damp(head.rotation.x, targetPitch.v, 4, delta)

    const blink = Math.max(0, Math.sin(t * 0.7) - 0.97) * 18
    const eyeIntensity = 1.8 - blink
    leftEyeMat.emissiveIntensity = eyeIntensity
    rightEyeMat.emissiveIntensity = eyeIntensity

    ring.rotation.z = t * 0.4
    ringMat.emissiveIntensity = 0.7 + Math.sin(t * 1.5) * 0.25

    // Mávnutí pravou rukou na úvod — proběhne JEDNOU po načtení podle času,
    // nezávisle na tom, jestli uživatel roluje. Paže se zvedne do ~135° (ne do
    // plných 180°, ať ruka není za hlavou a mávání dává smysl — paže míří
    // šikmo vzhůru) a mává OHÝBÁNÍM V LOKTU — vlní se jen předloktí
    // (rightForearm), nadloktí zůstává v klidu. Po skončení envelopey paže
    // i předloktí klesnou dampem zpět do klidu.
    if (rightArm && rightForearm) {
      const phase = t - WAVE_START
      if (phase >= 0 && phase <= WAVE_END - WAVE_START) {
        const dur = WAVE_END - WAVE_START
        const raise = THREE.MathUtils.clamp(phase / 0.5, 0, 1)
        const lower = 1 - THREE.MathUtils.clamp((phase - (dur - 0.5)) / 0.5, 0, 1)
        const env = Math.min(raise, lower)
        // nadloktí šikmo vzhůru (~135° → ruka nad ramenem, ne za hlavou)
        const WAVE_ARM_RAISE = (3 * Math.PI) / 4
        rightArm.rotation.z = env * WAVE_ARM_RAISE
        rightArm.rotation.x = env * -0.08
        // mávání ohýbáním loktu: předloktí kýve ze strany na stranu
        const wiggle = Math.sin(phase * 9) * 0.45
        rightForearm.rotation.z = env * wiggle
        rightForearm.rotation.x = 0
      } else {
        rightArm.rotation.z = THREE.MathUtils.damp(
          rightArm.rotation.z,
          0,
          4,
          delta,
        )
        rightArm.rotation.x = THREE.MathUtils.damp(
          rightArm.rotation.x,
          0,
          4,
          delta,
        )
        rightForearm.rotation.z = THREE.MathUtils.damp(
          rightForearm.rotation.z,
          0,
          4,
          delta,
        )
        rightForearm.rotation.x = THREE.MathUtils.damp(
          rightForearm.rotation.x,
          0,
          4,
          delta,
        )
      }
    }
  }

  function getHaloWorldPosition(out: THREE.Vector3) {
    baseGroup.getWorldPosition(out)
  }

  function dispose() {
    disposables.forEach((d) => {
      try {
        d.dispose()
      } catch {
        /* ignore */
      }
    })
    group.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => m.dispose())
      }
    })
  }

  return { group, update, getHaloWorldPosition, dispose }
}

/**
 * Zelené ITMAN logo na průhledném pozadí (canvas textura pro hrud).
 * 3 pruhy (dle originálu itman.cz):
 *  - horní: krátký + mezera + střední
 *  - prostřední: kousek odsazený (vpravo) dlouhý
 *  - spodní: střední + mezera + krátký
 */
function makeLogoTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  const green = '#49b141'
  const barH = 30
  const radius = barH / 2 // kapsle (zaoblené konce)
  const rowGap = 22
  const rows = 3
  const totalH = rows * barH + (rows - 1) * rowGap
  const startY = (size - totalH) / 2

  const capsule = (x: number, y: number, w: number) => {
    ctx.fillStyle = green
    ctx.beginPath()
    ctx.roundRect(x, y, w, barH, radius)
    ctx.fill()
  }

  // Blok loga (levý okraj = 0, pravý okraj = blockW)
  const blockW = 196
  const indent = 30 // prostřední řádek odsazen vpravo
  const gap = 22
  const rightEdge = blockW // pravý okraj všech řádků

  // šířky
  const topShort = 58
  const topMedium = rightEdge - (topShort + gap) // -> až k pravému okraji
  const midLong = rightEdge - indent
  const botMedium = 120
  const botShort = rightEdge - (botMedium + gap)

  const offsetX = (size - blockW) / 2

  // řádek 1: krátký + mezera + střední
  let y = startY
  capsule(offsetX + 0, y, topShort)
  capsule(offsetX + topShort + gap, y, topMedium)

  // řádek 2: odsazený dlouhý
  y += barH + rowGap
  capsule(offsetX + indent, y, midLong)

  // řádek 3: střední + mezera + krátký
  y += barH + rowGap
  capsule(offsetX + 0, y, botMedium)
  capsule(offsetX + botMedium + gap, y, botShort)

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Hvězdné pozadí. */
export function createStars(count = 1400, radius = 60): {
  points: THREE.Points
  dispose: () => void
} {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = radius * (0.5 + Math.random() * 0.5)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color: 0xcfe0ff,
    size: 0.16,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  })
  const points = new THREE.Points(geo, mat)
  return {
    points,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}

/**
 * Contrail — jemná mlhová stopa z „trysky" robota (zeleného halo prstence).
 * Jako výfuk za letadlem: puff se spawnuje v aktuální pozici trysky a jak
 * robot odlétává, zůstává stopa za ním. Spawn rate ∝ rychlost scrollování.
 * Puffy se rozšiřují, mizí a driftují ve směru výfuku (drift: +1 nahoru při
 * letu dolů, −1 dolů při letu nahoru, 0 v klidu). Halo se s robotem otáčí,
 * takže při letu hlavou dolů tryska přirozeně míří nahoru.
 */
function makeSmokeTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createTrail(count = 160, life = 1.4): {
  group: THREE.Group
  update: (
    delta: number,
    basePos: THREE.Vector3,
    scrollSpeed: number,
    drift: number,
  ) => void
  dispose: () => void
} {
  const group = new THREE.Group()
  const tex = makeSmokeTexture()
  const puffs: {
    sprite: THREE.Sprite
    mat: THREE.SpriteMaterial
    age: number
    sx: number
    sy: number
    rise: number
  }[] = []
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const sprite = new THREE.Sprite(mat)
    sprite.frustumCulled = false
    sprite.visible = false
    group.add(sprite)
    puffs.push({ sprite, mat, age: life, sx: 0.4, sy: 1.0, rise: 0.3 })
  }

  let spawnAcc = 0
  let cursor = 0
  const tmp = new THREE.Vector3()

  const spawn = (pos: THREE.Vector3) => {
    const p = puffs[cursor]
    cursor = (cursor + 1) % count
    // jemnější vertikální čárka (tenčí proud z trysky)
    p.sx = 0.2 + Math.random() * 0.18
    p.sy = 0.85 + Math.random() * 0.7
    p.rise = 0.3 + Math.random() * 0.3
    tmp.copy(pos)
    tmp.x += (Math.random() - 0.5) * 0.22
    tmp.z += (Math.random() - 0.5) * 0.1
    p.sprite.position.copy(tmp)
    p.sprite.scale.set(p.sx, p.sy, 1)
    p.age = 0
    p.sprite.visible = true
  }

  function update(
    delta: number,
    basePos: THREE.Vector3,
    scrollSpeed: number,
    drift: number,
  ) {
    // spawn rate vyšší → hustší souvislý contrail (ne řídké maskované chomáče)
    const rate = 16 + THREE.MathUtils.clamp(scrollSpeed * 85, 0, 240)
    spawnAcc += delta * rate
    while (spawnAcc >= 1) {
      spawnAcc -= 1
      spawn(basePos)
    }

    for (const p of puffs) {
      if (!p.sprite.visible) continue
      p.age += delta
      const t = p.age / life
      if (t >= 1) {
        p.sprite.visible = false
        continue
      }
      const fade = 1 - t
      p.mat.opacity = fade * fade * 0.34
      // contrail se rozšiřuje a rychleji odchází ve směru výfuku (od robota).
      // drift = +1 → stopa odchází nahoru (let dolů), −1 → dolů (let nahoru),
      // 0 → v klidu zůstává na místě a jen rozplyne.
      const grow = 1 + t * 1.6
      p.sprite.scale.set(p.sx * grow, p.sy * grow * 1.2, 1)
      p.sprite.position.y += delta * p.rise * fade * 3.4 * drift
    }
  }

  function dispose() {
    tex.dispose()
    puffs.forEach((p) => p.mat.dispose())
  }

  return { group, update, dispose }
}

/** Měkký kruhový stín pod robotem. */
export function createContactShadow(size = 4): {
  mesh: THREE.Mesh
  dispose: () => void
} {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(0,0,0,0.5)')
  grad.addColorStop(0.6, 'rgba(0,0,0,0.16)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(canvas)
  const geo = new THREE.PlaneGeometry(size, size)
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -2.1
  return {
    mesh,
    dispose: () => {
      geo.dispose()
      mat.dispose()
      tex.dispose()
    },
  }
}
