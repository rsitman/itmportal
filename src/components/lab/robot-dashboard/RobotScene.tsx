'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three-stdlib'
import { createGlbRobot, WAVE_END } from './GlbRobot'
import { createJet, createJetTrail } from './Jet'
import { createStars, createContactShadow } from './SceneExtras'

/**
 * RobotScene — čistý three.js (bez @react-three/fiber/drei) pro maximální
 * kompatibilitu s Next.js 16 + Turbopack + React 18.
 *
 * Chování: v klidu se vznáší GLB robot (po načtení zamává). Jakmile uživatel
 * scrolluje, robot se "transformuje" na stíhačku, která letí po trase
 * z waypointů, natáčí se nosem do směru letu a nechává za sebou dlouhou
 * kondenzační stopu. Po ~1 s bez scrollování se stíhačka změní zpět na robota.
 */
type Waypoint = { p: number; cam: number; x: number; y: number }

// Kolik sekund po posledním scrollu zůstává stíhačka, než se změní zpět.
const JET_HOLD = 1.0
// Rychlost scrollování (progress/s), která spouští proměnu na stíhačku.
const JET_VEL_THRESHOLD = 0.05
// Měřítko stíhačky a robota během letu stránkou (dál od kamery => menší)
const JET_SCALE = 0.85
const FLIGHT_ROBOT_SCALE = 0.7
// Rozestup chomáčů kondenzační stopy (světové jednotky)
const TRAIL_SPACING = 0.28
const WINGTIP_SPACING = 0.42

const WAYPOINTS: Waypoint[] = [
  // Start: robot vpravo nahoře, ale ne až na okraj a ne příliš velký,
  // ať nepřekrývá centrovaný hero text a vejde se do okna.
  { p: 0.0, cam: 9.0, x: 2.0, y: 0.4 },
  { p: 0.14, cam: 24.0, x: 2.0, y: 0.4 },
  // Sekce mají obsah centrovaný (max 1200px), proto letoun hážeme hodně do
  // stran a k okrajům viewportu, ať text zůstává čitelný.
  { p: 0.4, cam: 24.0, x: 7.8, y: 1.9 }, // Aplikace — pravý horní roh
  { p: 0.66, cam: 24.0, x: -7.8, y: -1.9 }, // Moje práce — levý dolní roh
  { p: 0.84, cam: 24.0, x: 7.8, y: 1.7 }, // Aktuality — pravý horní roh
  { p: 1.0, cam: 19.0, x: -6.2, y: 1.5 }, // CTA — levý horní roh
]

function computeFlight(progress: number, out: { cam: number; x: number; y: number }) {
  const p = Math.min(1, Math.max(0, progress))
  let i = 0
  while (i < WAYPOINTS.length - 1 && p > WAYPOINTS[i + 1].p) i++
  const a = WAYPOINTS[i]
  const b = WAYPOINTS[Math.min(i + 1, WAYPOINTS.length - 1)]
  const span = b.p - a.p
  const t = span <= 0 ? 0 : (p - a.p) / span
  out.cam = a.cam + (b.cam - a.cam) * t
  out.x = a.x + (b.x - a.x) * t
  out.y = a.y + (b.y - a.y) * t
}

/** Nejkratší úhlová vzdálenost a→b v (−π, π]. */
function angleDelta(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

export default function RobotScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200,
    )
    const target = { cam: 9.0, x: 2.0, y: 0.4 }
    camera.position.set(0, 0.35, target.cam)
    camera.lookAt(0, 0.0, 0)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    // Environment pro kovové odlesky
    const pmrem = new THREE.PMREMGenerator(renderer)
    const roomEnv = RoomEnvironment()
    const envTex = pmrem.fromScene(roomEnv, 0.04).texture
    scene.environment = envTex

    // Osvětlení
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(4, 6, 5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 30
    key.shadow.camera.left = -6
    key.shadow.camera.right = 6
    key.shadow.camera.top = 6
    key.shadow.camera.bottom = -6
    scene.add(key)

    const emerald = new THREE.PointLight(0x10b981, 2.2, 30)
    emerald.position.set(-5, -2, 3)
    scene.add(emerald)

    const cyan = new THREE.PointLight(0x22d3ee, 1.4, 30)
    cyan.position.set(5, 2, -4)
    scene.add(cyan)

    const spot = new THREE.SpotLight(0xa7f3d0, 1.2, 30, 0.5, 1, 1)
    spot.position.set(0, 8, 2)
    scene.add(spot)

    // ===== Aktér: kontejner s robotem a stíhačkou (crossfade morph) =====
    const actor = new THREE.Group()
    scene.add(actor)
    actor.position.set(target.x, -0.12 + target.y, 0)

    const robot = createGlbRobot()
    const robotHolder = new THREE.Group()
    robotHolder.add(robot.group)
    actor.add(robotHolder)

    const jet = createJet()
    const jetHeading = new THREE.Group() // natočení nosu do směru letu (Z)
    const jetSpin = new THREE.Group() // spin během transformace (Y)
    jetSpin.add(jet.group)
    jetHeading.add(jetSpin)
    actor.add(jetHeading)
    jetHeading.visible = false

    // Hvězdy + stín
    const stars = createStars(1800, 60)
    scene.add(stars.points)
    const shadow = createContactShadow(4)
    scene.add(shadow.mesh)

    // Kondenzační stopa za stíhačkou
    const trail = createJetTrail(520, 4.2)
    scene.add(trail.group)

    // Pointer (normalizováno -1..1)
    const pointer = new THREE.Vector2(0, 0)
    const viewport = { width: 1, height: 1 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer)

    // Scroll -> flight target
    let progress = 0
    const debug = document.createElement('div')
    debug.style.cssText =
      'position:fixed;right:12px;bottom:12px;z-index:50;padding:6px 10px;' +
      'background:rgba(0,0,0,0.6);border:1px solid rgba(16,185,129,0.5);' +
      'border-radius:8px;color:#6ee7b7;font:11px/1.4 ui-monospace,monospace;' +
      'pointer-events:none;'
    debug.textContent = 'init'
    document.body.appendChild(debug)

    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      progress = docH > 0 ? window.scrollY / docH : 0
      computeFlight(progress, target)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()

    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ===== Animační stav =====
    const clock = new THREE.Clock()
    let raf = 0
    let mounted = true
    let lastProgress = 0
    let lastScrollTime = -Infinity
    let morph = 0 // 0 = robot, 1 = stíhačka
    let morphTarget = 0
    // Orientace stíhačky jako u skutečného letadla: yaw (kolem svislé osy,
    // nos doprava = 0 / doleva = π), omezený pitch (nos nahoru/dolů) a bank
    // (náklon křídly do zatáčky kolem podélné osy). Nikdy hlavou dolů,
    // nikdy pozpátku.
    let yaw = 0
    let pitch = 0
    let bank = 0
    const prevActorPos = new THREE.Vector3(target.x, -0.12 + target.y, 0)
    const velocity = new THREE.Vector3()
    const enginePos = new THREE.Vector3()
    const prevEnginePos = new THREE.Vector3()
    const wingtipPos = new THREE.Vector3()
    const prevWingtipPos = [new THREE.Vector3(), new THREE.Vector3()]
    const segTmp = new THREE.Vector3()
    let engineResidual = 0
    const wingtipResidual = [0, 0]
    let trailPrimed = false

    const tick = () => {
      if (!mounted) return
      raf = requestAnimationFrame(tick)
      // getDelta() musí být první — getElapsedTime() by interně posunul oldTime
      // a delta by pak vyšla ~0.
      const delta = clock.getDelta()
      const t = clock.elapsedTime

      const vFOV = THREE.MathUtils.degToRad(camera.fov)
      const height = 2 * Math.tan(vFOV / 2) * camera.position.length()
      viewport.width = height * camera.aspect
      viewport.height = height

      // Rychlost scrollování (progress/s)
      const scrollVel = (progress - lastProgress) / Math.max(delta, 1e-4)
      lastProgress = progress

      // ===== Morph robot <-> stíhačka =====
      // Aktivní scroll => stíhačka. Klid delší než JET_HOLD => zpět robot.
      // Během úvodního mávnutí se robot netransformuje.
      if (Math.abs(scrollVel) > JET_VEL_THRESHOLD && t > WAVE_END) {
        lastScrollTime = t
        morphTarget = 1
      } else if (t - lastScrollTime > JET_HOLD) {
        morphTarget = 0
      }
      morph = THREE.MathUtils.damp(morph, morphTarget, 5, delta)

      // ===== Pohyb aktéra po trase =====
      actor.position.x = THREE.MathUtils.damp(actor.position.x, target.x, 2.5, delta)
      actor.position.y = THREE.MathUtils.damp(
        actor.position.y,
        -0.12 + target.y,
        2.5,
        delta,
      )
      camera.position.z = THREE.MathUtils.damp(camera.position.z, target.cam, 2.5, delta)
      camera.lookAt(0, 0.0, 0)

      velocity.copy(actor.position).sub(prevActorPos).divideScalar(Math.max(delta, 1e-4))
      prevActorPos.copy(actor.position)
      const speed = velocity.length()

      // ===== Robot (viditelný při morph < 1) =====
      const robotScale = (1 - morph) * (progress > 0.02 ? FLIGHT_ROBOT_SCALE : 1)
      robotHolder.visible = morph < 0.985
      if (robotHolder.visible) {
        robotHolder.scale.setScalar(Math.max(robotScale, 0.001))
        // spin během transformace — robot se zatočí a "složí" do stíhačky
        robotHolder.rotation.y = morph * Math.PI * 2
        robot.update(t, delta, pointer, viewport)
      }

      // ===== Stíhačka (viditelná při morph > 0) =====
      jetHeading.visible = morph > 0.015
      if (jetHeading.visible) {
        jetHeading.scale.setScalar(Math.max(morph * JET_SCALE, 0.001))
        jetSpin.rotation.y = (morph - 1) * Math.PI * 2

        // Cílový yaw podle vodorovné složky rychlosti: letí doprava (0)
        // nebo doleva (π). Bez dostatečného vodorovného pohybu drží směr.
        let yawTarget = yaw
        if (Math.abs(velocity.x) > 0.4) {
          yawTarget = velocity.x > 0 ? 0 : Math.PI
        }
        // Cílový pitch ze svislé rychlosti — omezený na ±50°, aby nos
        // nikdy nemířil kolmo vzhůru/dolů (jet stoupá/klesá pod úhlem).
        let pitchTarget = 0
        if (speed > 0.6) {
          pitchTarget = THREE.MathUtils.clamp(
            Math.atan2(velocity.y, Math.max(Math.abs(velocity.x), 0.8)),
            -0.9,
            0.9,
          )
        }

        const prevYaw = yaw
        yaw += angleDelta(yaw, yawTarget) * Math.min(1, delta * 3.2)
        const yawRate = (yaw - prevYaw) / Math.max(delta, 1e-4)
        pitch = THREE.MathUtils.damp(pitch, pitchTarget, 4, delta)

        // Bank do zatáčky: hlavně při obratu (yawRate), lehce i podle
        // stoupání/klesání, ať let působí živě. Křídla max ~65°.
        const bankTarget = THREE.MathUtils.clamp(
          yawRate * 0.55 + pitch * 0.25 * Math.cos(yaw),
          -1.15,
          1.15,
        )
        bank = THREE.MathUtils.damp(bank, bankTarget, 4, delta)

        // Euler pořadí XYZ: rotation.z (pitch) se aplikuje první, pak
        // rotation.y (yaw) — stoupání proto zůstává stoupáním i po otočce
        // nosem doleva a letoun nikdy neletí hlavou dolů.
        jetHeading.rotation.y = yaw
        jetHeading.rotation.z = pitch
        jet.group.rotation.x = bank
        jet.update(t)

        // ===== Kondenzační stopa — spawn po vzdálenosti (souvislá čára) =====
        jet.getEngineWorldPosition(enginePos)
        if (!trailPrimed) {
          prevEnginePos.copy(enginePos)
          jet.getWingtipWorldPosition(-1, prevWingtipPos[0])
          jet.getWingtipWorldPosition(1, prevWingtipPos[1])
          trailPrimed = true
        }
        if (morph > 0.5) {
          const puffSize = 0.34 + Math.min(speed * 0.012, 0.14)
          engineResidual = spawnAlong(
            trail,
            prevEnginePos,
            enginePos,
            engineResidual,
            TRAIL_SPACING,
            puffSize,
            segTmp,
          )
          // wingtip víry — jemnější, jen při rychlém letu
          if (speed > 3) {
            for (let s = 0; s < 2; s++) {
              jet.getWingtipWorldPosition(s === 0 ? -1 : 1, wingtipPos)
              wingtipResidual[s] = spawnAlong(
                trail,
                prevWingtipPos[s],
                wingtipPos,
                wingtipResidual[s],
                WINGTIP_SPACING,
                0.16,
                segTmp,
              )
              prevWingtipPos[s].copy(wingtipPos)
            }
          } else {
            jet.getWingtipWorldPosition(-1, prevWingtipPos[0])
            jet.getWingtipWorldPosition(1, prevWingtipPos[1])
          }
        } else {
          jet.getWingtipWorldPosition(-1, prevWingtipPos[0])
          jet.getWingtipWorldPosition(1, prevWingtipPos[1])
        }
        prevEnginePos.copy(enginePos)
      } else {
        trailPrimed = false
        yaw = 0
        pitch = 0
        bank = 0
      }

      trail.update(delta)
      stars.points.rotation.y = t * 0.01

      debug.textContent =
        `prog ${progress.toFixed(2)} · vel ${scrollVel.toFixed(2)} · ` +
        `morph ${morph.toFixed(2)} · yaw ${((yaw * 180) / Math.PI).toFixed(0)}° · ` +
        `pitch ${((pitch * 180) / Math.PI).toFixed(0)}° · bank ${((bank * 180) / Math.PI).toFixed(0)}°`

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      mounted = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('resize', onResize)
      robot.dispose()
      jet.dispose()
      stars.dispose()
      shadow.dispose()
      trail.dispose()
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
      if (debug.parentNode) debug.parentNode.removeChild(debug)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="robot-canvas-mount"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

/**
 * Rozprostře chomáče stopy rovnoměrně po úsečce from→to s daným rozestupem.
 * residual = přenesená vzdálenost z minulého framu; vrací nový residual.
 */
function spawnAlong(
  trail: { spawn: (pos: THREE.Vector3, size: number) => void },
  from: THREE.Vector3,
  to: THREE.Vector3,
  residual: number,
  spacing: number,
  size: number,
  tmp: THREE.Vector3,
): number {
  const dist = from.distanceTo(to)
  if (dist < 1e-5) return residual
  let travelled = residual
  while (travelled + spacing <= residual + dist) {
    travelled += spacing
    const f = (travelled - residual) / dist
    tmp.lerpVectors(from, to, f)
    trail.spawn(tmp, size)
  }
  return residual + dist - travelled
}
