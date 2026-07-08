'use client'

import * as THREE from 'three'

// ITMAN paleta (shodná s robotem)
const WHITE = 0xeef1f6
const NAVY = 0x101828
const GREEN = 0x49b141
const GREEN_BRIGHT = 0x6fe05e

/**
 * Stylizovaná stíhačka v ITMAN barvách. Nos míří na +X, svislá směrovka na +Y.
 * Délka ~4.3 světových jednotek (odpovídá objemu robota při scale 1.9).
 */
export interface JetHandle {
  group: THREE.Group
  /** Světová pozice trysky (ocas) — bod emise kondenzační stopy. */
  getEngineWorldPosition: (out: THREE.Vector3) => void
  /** Světové pozice konců křídel (side −1 / +1) — wingtip stopy. */
  getWingtipWorldPosition: (side: number, out: THREE.Vector3) => void
  update: (t: number) => void
  dispose: () => void
}

export function createJet(): JetHandle {
  const group = new THREE.Group()
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(o: T): T => {
    disposables.push(o)
    return o
  }

  const whiteMat = track(
    new THREE.MeshStandardMaterial({ color: WHITE, metalness: 0.25, roughness: 0.35 }),
  )
  const navyMat = track(
    new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.4, roughness: 0.3 }),
  )
  const greenMat = track(
    new THREE.MeshStandardMaterial({ color: GREEN, metalness: 0.35, roughness: 0.4 }),
  )
  const burnerMat = track(
    new THREE.MeshStandardMaterial({
      color: GREEN_BRIGHT,
      emissive: GREEN_BRIGHT,
      emissiveIntensity: 2.2,
      toneMapped: false,
    }),
  )

  // ===== TRUP — lathe kolem osy, poté položený do osy X (nos +X) =====
  const profile = [
    [0.0, -2.1],
    [0.17, -2.08],
    [0.22, -1.85],
    [0.3, -1.15],
    [0.35, -0.2],
    [0.31, 0.7],
    [0.21, 1.4],
    [0.09, 1.9],
    [0.0, 2.15],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const fuselageGeo = track(new THREE.LatheGeometry(profile, 48))
  const fuselage = new THREE.Mesh(fuselageGeo, whiteMat)
  fuselage.rotation.z = -Math.PI / 2 // +Y (osa lathe) -> +X
  fuselage.castShadow = true
  group.add(fuselage)

  // ===== KOKPIT =====
  const canopyGeo = track(new THREE.SphereGeometry(0.5, 32, 24))
  const canopy = new THREE.Mesh(canopyGeo, navyMat)
  canopy.position.set(0.75, 0.26, 0)
  canopy.scale.set(1.0, 0.5, 0.52)
  group.add(canopy)

  // ===== KŘÍDLA (delta, horizontální rovina XZ) =====
  const wingShape = new THREE.Shape()
  wingShape.moveTo(0.95, 0.28)
  wingShape.lineTo(-0.2, 1.55)
  wingShape.lineTo(-0.78, 1.55)
  wingShape.lineTo(-1.0, 0.28)
  wingShape.closePath()
  const wingGeo = track(
    new THREE.ExtrudeGeometry(wingShape, { depth: 0.07, bevelEnabled: false }),
  )
  ;[-1, 1].forEach((s) => {
    const wing = new THREE.Mesh(wingGeo, whiteMat)
    // shape (x = podélná, y = rozpětí) -> položit do XZ; s určuje stranu
    wing.rotation.x = (s * Math.PI) / 2
    wing.position.y = s * 0.035
    wing.castShadow = true
    group.add(wing)

    // zelený pruh na konci křídla
    const tipGeo = track(new THREE.BoxGeometry(0.55, 0.1, 0.09))
    const tip = new THREE.Mesh(tipGeo, greenMat)
    tip.position.set(-0.48, 0, s * 1.5)
    group.add(tip)
  })

  // ===== VODOROVNÉ STABILIZÁTORY (ocas) =====
  const stabShape = new THREE.Shape()
  stabShape.moveTo(-1.15, 0.18)
  stabShape.lineTo(-1.75, 0.85)
  stabShape.lineTo(-2.05, 0.85)
  stabShape.lineTo(-2.05, 0.18)
  stabShape.closePath()
  const stabGeo = track(
    new THREE.ExtrudeGeometry(stabShape, { depth: 0.05, bevelEnabled: false }),
  )
  ;[-1, 1].forEach((s) => {
    const stab = new THREE.Mesh(stabGeo, whiteMat)
    stab.rotation.x = (s * Math.PI) / 2
    stab.position.y = s * 0.025
    group.add(stab)
  })

  // ===== SVISLÁ SMĚROVKA =====
  const finShape = new THREE.Shape()
  finShape.moveTo(-1.1, 0.1)
  finShape.lineTo(-1.72, 1.0)
  finShape.lineTo(-2.0, 1.0)
  finShape.lineTo(-2.05, 0.1)
  finShape.closePath()
  const finGeo = track(
    new THREE.ExtrudeGeometry(finShape, { depth: 0.05, bevelEnabled: false }),
  )
  const fin = new THREE.Mesh(finGeo, whiteMat)
  fin.position.z = -0.025
  group.add(fin)

  const finTipGeo = track(new THREE.BoxGeometry(0.32, 0.12, 0.08))
  const finTip = new THREE.Mesh(finTipGeo, greenMat)
  finTip.position.set(-1.87, 0.98, 0)
  group.add(finTip)

  // ===== TRYSKA + AFTERBURNER =====
  const nozzleGeo = track(new THREE.CylinderGeometry(0.17, 0.14, 0.22, 24))
  const nozzle = new THREE.Mesh(nozzleGeo, navyMat)
  nozzle.rotation.z = Math.PI / 2
  nozzle.position.set(-2.16, 0, 0)
  group.add(nozzle)

  const burnerGeo = track(new THREE.SphereGeometry(0.12, 16, 16))
  const burner = new THREE.Mesh(burnerGeo, burnerMat)
  burner.position.set(-2.27, 0, 0)
  burner.scale.set(1.5, 1, 1)
  group.add(burner)

  const engineLocal = new THREE.Vector3(-2.35, 0, 0)
  const wingtipLocal = new THREE.Vector3()

  function getEngineWorldPosition(out: THREE.Vector3) {
    out.copy(engineLocal)
    group.localToWorld(out)
  }
  function getWingtipWorldPosition(side: number, out: THREE.Vector3) {
    wingtipLocal.set(-0.75, 0, side * 1.52)
    out.copy(wingtipLocal)
    group.localToWorld(out)
  }

  function update(t: number) {
    // pulsování afterburneru
    burnerMat.emissiveIntensity = 2.0 + Math.sin(t * 22) * 0.5
    const s = 1.35 + Math.sin(t * 17) * 0.2
    burner.scale.set(s, 1, 1)
  }

  function dispose() {
    disposables.forEach((d) => d.dispose())
  }

  return { group, getEngineWorldPosition, getWingtipWorldPosition, update, dispose }
}

/**
 * Kondenzační stopa (contrail) za stíhačkou — dlouho viditelná, realistická:
 * měkké bílé chomáče s normálním blendingem, pomalu rostou a blednou,
 * spawn řízený VZDÁLENOSTÍ (volající interpoluje po segmentu), takže stopa
 * je souvislá čára nezávisle na framerate a ukazuje, kudy stíhačka letěla.
 */
export interface JetTrailHandle {
  group: THREE.Group
  spawn: (pos: THREE.Vector3, size: number) => void
  update: (delta: number) => void
  dispose: () => void
}

function makePuffTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.35, 'rgba(240,246,252,0.55)')
  g.addColorStop(0.7, 'rgba(225,235,246,0.18)')
  g.addColorStop(1, 'rgba(225,235,246,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createJetTrail(count = 520, life = 4.2): JetTrailHandle {
  const group = new THREE.Group()
  const tex = makePuffTexture()
  const puffs: {
    sprite: THREE.Sprite
    mat: THREE.SpriteMaterial
    age: number
    size: number
    driftX: number
    driftY: number
  }[] = []
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const sprite = new THREE.Sprite(mat)
    sprite.frustumCulled = false
    sprite.visible = false
    group.add(sprite)
    puffs.push({ sprite, mat, age: life, size: 0.3, driftX: 0, driftY: 0 })
  }

  let cursor = 0
  const tmp = new THREE.Vector3()

  function spawn(pos: THREE.Vector3, size: number) {
    const p = puffs[cursor]
    cursor = (cursor + 1) % count
    p.size = size * (0.85 + Math.random() * 0.35)
    // mírná turbulence: každý chomáč pomalu driftuje jinam
    p.driftX = (Math.random() - 0.5) * 0.14
    p.driftY = (Math.random() - 0.5) * 0.14 + 0.03
    tmp.copy(pos)
    tmp.x += (Math.random() - 0.5) * 0.06
    tmp.y += (Math.random() - 0.5) * 0.06
    tmp.z += (Math.random() - 0.5) * 0.05
    p.sprite.position.copy(tmp)
    p.sprite.scale.setScalar(p.size)
    p.age = 0
    p.sprite.visible = true
  }

  function update(delta: number) {
    for (const p of puffs) {
      if (!p.sprite.visible) continue
      p.age += delta
      const t = p.age / life
      if (t >= 1) {
        p.sprite.visible = false
        continue
      }
      // rychlý nástup, dlouhé doznívání (kvadratické)
      const fadeIn = Math.min(1, p.age / 0.12)
      const fadeOut = (1 - t) * (1 - t)
      p.mat.opacity = fadeIn * (0.06 + fadeOut * 0.3)
      const grow = 1 + t * 2.6
      p.sprite.scale.setScalar(p.size * grow)
      p.sprite.position.x += p.driftX * delta
      p.sprite.position.y += p.driftY * delta
    }
  }

  function dispose() {
    tex.dispose()
    puffs.forEach((p) => p.mat.dispose())
  }

  return { group, spawn, update, dispose }
}
