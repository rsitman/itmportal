'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three-stdlib'
import {
  createItmanRobot,
  createStars,
  createContactShadow,
  createTrail,
  WAVE_END,
} from './ItmanRobot'

/**
 * RobotScene — čistý three.js (bez @react-three/fiber/drei) pro maximální
 * kompatibilitu s Next.js 16 + Turbopack + React 18.
 * Let robota (odzoom + trasa + rotace) je řízen PŘÍMO z window.scrollY
 * uvnitř této komponenty — žádné sdílení stavu s ostatními moduly.
 */
type Waypoint = { p: number; cam: number; x: number; y: number; rot: number }

// Během letu se robot zmenší na tuto frakci velikosti (méně rušivý ve stránce).
const FLIGHT_SCALE = 0.6
// Vzdálenost bodu emise stopy ZA zeleným halo, ve směru od těla robota
// (contrail za letadlem). Vždy přítomná — i v klidu — aby stopa neležela
// v špičce robota. Funguje pro hlavu nahoru (halo dole → stopa pod) i dolů.
const TRAIL_OFFSET = 1.4
const TRAIL_DIR_THRESHOLD = 0.03
// Jak dlouho robot drží poslední postoj (hlavou dolů) po zastavení scrollování,
// než se začne plynule narovnávat (s).
const ATTITUDE_HOLD = 0.8

const WAYPOINTS: Waypoint[] = [
  // Start: robot vpravo nahoře, ale ne až na okraj a ne příliš velký
  // (cam 9 → menší než původních 7, x +2 → jen mírně vpravo od centra),
  // ať nepřekrývá centrovaný hero text a vejde se do okna.
  { p: 0.0, cam: 9.0, x: 2.0, y: 0.4, rot: 0.0 },
  { p: 0.14, cam: 24.0, x: 2.0, y: 0.4, rot: 0.0 },
  // Sekce mají obsah centrovaný (max 1200px), proto robot hážeme hodně do
  // stran a k okrajům viewportu (y nahoru/dolů), ať text zůstává čitelný.
  { p: 0.4, cam: 24.0, x: 7.8, y: 1.9, rot: -0.55 }, // Aplikace — pravý horní roh
  { p: 0.66, cam: 24.0, x: -7.8, y: -1.9, rot: 0.6 }, // Moje práce — levý dolní roh
  { p: 0.84, cam: 24.0, x: 7.8, y: 1.7, rot: -0.42 }, // Aktuality — pravý horní roh
  { p: 1.0, cam: 19.0, x: -6.2, y: 1.5, rot: 0.0 }, // CTA — levý horní roh (text je centrovaný)
]

function computeFlight(progress: number, out: { cam: number; x: number; y: number; rot: number }) {
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
  out.rot = a.rot + (b.rot - a.rot) * t
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
    const target = { cam: 9.0, x: 2.0, y: 0.4, rot: 0.0 }
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

    // Robot
    const robot = createItmanRobot()
    scene.add(robot.group)
    // Startovní pozice robota už vpravo/nahoře (odpovídá waypointu 0),
    // ať při načtení nepřejíždí z centra přes hero text.
    robot.group.position.set(target.x, -0.12 + target.y, 0)
    // Hvězdy
    const stars = createStars(1800, 60)
    scene.add(stars.points)

    // Stín
    const shadow = createContactShadow(4)
    scene.add(shadow.mesh)

    // Stopa za robotem (contrail) — jemná bílá mlha jako čárky
    const trail = createTrail(260, 1.0)
    scene.add(trail.group)
    const robotWorldPos = new THREE.Vector3()
    const robotBodyPos = new THREE.Vector3()
    const awayDir = new THREE.Vector3()

    // Pointer (normalizováno -1..1)
    const pointer = new THREE.Vector2(0, 0)
    const viewport = { width: 1, height: 1 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer)

    // Scroll -> flight target (přímo zde, bez sdílení stavu)
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
      debug.textContent =
        `scroll ${Math.round(window.scrollY)} · prog ${progress.toFixed(2)} · ` +
        `cam ${target.cam.toFixed(1)} · x ${target.x.toFixed(2)}`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()

    // Resize (kamera/renderer)
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Animace
    const clock = new THREE.Clock()
    let raf = 0
    let mounted = true
    let lastRobotY = -0.12
    let lastProgress = 0
    let attitudeTarget = 0 // cílový roll robota: 0 = hlavou nahoru, π = hlavou dolů
    let lastScrollTime = -Infinity // čas posledního aktivního scrollování (pro ATTITUDE_HOLD)
    let currentScale = 1.0
    let scaleTarget = 1.0

    const tick = () => {
      if (!mounted) return
      raf = requestAnimationFrame(tick)
      // Důležité: getElapsedTime() interně volá getDelta() a posune oldTime,
      // takže následné getDelta() by vrátilo ~0 a damp()/trail by se nikdy nehybaly.
      // Proto getDelta() voláme jako první a elapsed čas čteme z clock.elapsedTime.
      const delta = clock.getDelta()
      const t = clock.elapsedTime

      const vFOV = THREE.MathUtils.degToRad(camera.fov)
      const height = 2 * Math.tan(vFOV / 2) * camera.position.length()
      const width = height * camera.aspect
      viewport.width = width
      viewport.height = height

      const flying = progress > 0.02

      // Během letu robota zmenšíme (méně rušivý ve stránce). Klidový stav
      // (start, blízko kamery) drží plnou velikost. scale se dotvaruje dampem.
      scaleTarget = flying ? FLIGHT_SCALE : 1.0
      currentScale = THREE.MathUtils.damp(currentScale, scaleTarget, 2.5, delta)

      robot.update(t, delta, pointer, viewport, flying, currentScale)

      stars.points.rotation.y = t * 0.01

      // Flight path: dotvarování pozice robota a kamery k cíli z waypointů
      robot.group.position.x = THREE.MathUtils.damp(
        robot.group.position.x,
        target.x,
        2.5,
        delta,
      )
      robot.group.position.y = THREE.MathUtils.damp(
        robot.group.position.y,
        -0.12 + target.y,
        2.5,
        delta,
      )
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        target.cam,
        2.5,
        delta,
      )
      camera.lookAt(0, 0.0, 0)

      // Rychlost scrollování (progress/s). Podle ní se staví postoj robota i intenzita stopy.
      const scrollVel =
        (progress - lastProgress) / Math.max(delta, 1e-4)
      lastProgress = progress

      // Postoj robota podle směru scrollování:
      //  scroll dolů (vel>0) → hlavou dolů (roll π), scroll nahoru (vel<0) → hlavou nahoru (0).
      //  Při NEČINNOSTI robot NEJPRVE drží poslední postoj ATTITUDE_HOLD s, a teprve
      //  poté se plynule narovná (head up, attitude 0) — ne okamžitě.
      // Během úvodního mávnutí (t <= WAVE_END) se attitude vůbec nemění — robot
      // zůstává vzpřímeně, ať uživatel scrolluje nebo ne, jinak by se překlopil
      // a mávnutí by za otočením zmizelo.
      if (t > WAVE_END) {
        if (scrollVel > 0.06) {
          attitudeTarget = Math.PI
          lastScrollTime = t
        } else if (scrollVel < -0.06) {
          attitudeTarget = 0
          lastScrollTime = t
        } else if (t - lastScrollTime > ATTITUDE_HOLD) {
          attitudeTarget = 0
        }
        // jinak (krátce po zastavení) drží poslední attitudeTarget
      }
      robot.group.rotation.z = THREE.MathUtils.damp(
        robot.group.rotation.z,
        attitudeTarget,
        2.4,
        delta,
      )
      robot.group.rotation.x = THREE.MathUtils.damp(
        robot.group.rotation.x,
        0,
        2.4,
        delta,
      )
      robot.group.rotation.y = THREE.MathUtils.damp(
        robot.group.rotation.y,
        0,
        3,
        delta,
      )

      lastRobotY = robot.group.position.y

      // Stopa — contrail z trysky (zelené halo). Bod emise se vždy posune
      // VE SMĚRU OD TĚLA ROBOTA K HALU (a ještě o TRAIL_OFFSET za něj) — tak
      // je stopa vždy VNĚ robota, ať je hlavou nahoru (halo dole → stopa pod),
      // hlavou dolů (halo nahoře → stopa nad) nebo během překlopení. Funguje
      // to i v klidu (scrollVel ≈ 0), kdy dříve offset byl 0 a stopa lezla
      // do špičky robota. drift určuje kam puffy odcházejí (+1 nahoru při
      // letu dolů, −1 dolů při letu nahoru, 0 v klidu).
      robot.group.getWorldPosition(robotBodyPos)
      robot.getHaloWorldPosition(robotWorldPos)
      awayDir.copy(robotWorldPos).sub(robotBodyPos) // tělo → halo
      const awayLen = awayDir.length()
      if (awayLen > 1e-3) {
        awayDir.multiplyScalar(TRAIL_OFFSET / awayLen)
        robotWorldPos.add(awayDir)
      }
      const goingDown = scrollVel > TRAIL_DIR_THRESHOLD
      const goingUp = scrollVel < -TRAIL_DIR_THRESHOLD
      const drift = goingDown ? 1 : goingUp ? -1 : 0
      trail.update(delta, robotWorldPos, Math.abs(scrollVel), drift)

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

  return <div ref={mountRef} className="robot-canvas-mount" style={{ width: '100%', height: '100%' }} />
}
