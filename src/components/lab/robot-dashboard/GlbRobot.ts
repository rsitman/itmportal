'use client'

import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'

// Mávnutí na úvod: probíhá v okně [WAVE_START, WAVE_END] sekund od načtení.
// Během něj se robot nesmí transformovat na stíhačku.
export const WAVE_START = 0.6
export const WAVE_END = 3.8

const MODEL_URL = '/lab/robot.glb'
// GLB má výšku 2 (y −1..1); škálujeme na ~3.8 světových jednotek jako původní robot.
const MODEL_SCALE = 1.9

// Zdvižená paže v lokálních souřadnicích GLB (zjištěno analýzou meshe):
// válec od ramenního pivotu podél osy paže. Vrcholy uvnitř se ve vertex
// shaderu otáčejí kolem pivotu — mesh nemá kosti, mávání řeší shader.
const ARM_PIVOT = 'vec3(0.30, 0.12, 0.25)'
const ARM_AXIS = 'vec3(0.5008, 0.6120, 0.6120)' // normalize(0.45, 0.55, 0.55)

const ARM_GLSL = `
uniform float uWave;
const vec3 armPivot = ${ARM_PIVOT};
const vec3 armAxis = ${ARM_AXIS};
float armWeight(vec3 p) {
  vec3 ap = p - armPivot;
  float tArm = dot(ap, armAxis);
  float radial = length(ap - armAxis * tArm);
  return smoothstep(-0.02, 0.2, tArm) * (1.0 - smoothstep(0.24, 0.36, radial));
}
`

export interface GlbRobotHandle {
  group: THREE.Group
  update: (
    t: number,
    delta: number,
    pointer: THREE.Vector2,
    viewport: { width: number; height: number },
  ) => void
  dispose: () => void
}

export function createGlbRobot(): GlbRobotHandle {
  const group = new THREE.Group()
  const root = new THREE.Group() // idle vznášení + natáčení za kurzorem
  group.add(root)

  const waveUniform = { value: 0 }
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  let disposed = false

  const loader = new GLTFLoader()
  loader.load(MODEL_URL, (gltf) => {
    if (disposed) return
    const model = gltf.scene
    model.scale.setScalar(MODEL_SCALE)
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!(mesh as THREE.Mesh).isMesh) return
      mesh.castShadow = true
      geometries.push(mesh.geometry)
      const mat = mesh.material as THREE.MeshStandardMaterial
      materials.push(mat)
      mat.envMapIntensity = 0.9
      mat.emissiveIntensity = 1.6
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uWave = waveUniform
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>\n${ARM_GLSL}`)
          .replace(
            '#include <beginnormal_vertex>',
            `#include <beginnormal_vertex>
            {
              float wN = armWeight(position) * uWave;
              if (abs(wN) > 0.0001) {
                float caN = cos(wN); float saN = sin(wN);
                objectNormal = vec3(
                  objectNormal.x * caN - objectNormal.y * saN,
                  objectNormal.x * saN + objectNormal.y * caN,
                  objectNormal.z
                );
              }
            }`,
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            {
              float wV = armWeight(position) * uWave;
              if (abs(wV) > 0.0001) {
                float caV = cos(wV); float saV = sin(wV);
                vec2 q = transformed.xy - armPivot.xy;
                transformed.x = armPivot.x + q.x * caV - q.y * saV;
                transformed.y = armPivot.y + q.x * saV + q.y * caV;
              }
            }`,
          )
      }
      mat.needsUpdate = true
    })
    root.add(model)
  })

  function update(
    t: number,
    delta: number,
    pointer: THREE.Vector2,
    viewport: { width: number; height: number },
  ) {
    void viewport
    // idle vznášení
    root.position.y = Math.sin(t * 1.1) * 0.08
    root.rotation.z = Math.sin(t * 0.6) * 0.03

    // natáčení celého robota za kurzorem (mesh nemá oddělenou hlavu)
    const yawTarget = THREE.MathUtils.clamp(pointer.x * 0.4, -0.4, 0.4)
    const pitchTarget = THREE.MathUtils.clamp(-pointer.y * 0.16, -0.22, 0.22)
    root.rotation.y = THREE.MathUtils.damp(root.rotation.y, yawTarget, 4, delta)
    root.rotation.x = THREE.MathUtils.damp(root.rotation.x, pitchTarget, 4, delta)

    // mávnutí zdviženou (pravou z pohledu diváka) rukou — jednou po načtení
    const phase = t - WAVE_START
    const dur = WAVE_END - WAVE_START
    if (phase >= 0 && phase <= dur) {
      const rise = THREE.MathUtils.clamp(phase / 0.4, 0, 1)
      const fall = 1 - THREE.MathUtils.clamp((phase - (dur - 0.4)) / 0.4, 0, 1)
      const env = Math.min(rise, fall)
      // záporný bias kýve paži ven od hlavy, sinus dělá samotné mávání
      waveUniform.value = env * (Math.sin(phase * 7.5) * 0.5 - 0.1)
    } else {
      waveUniform.value = THREE.MathUtils.damp(waveUniform.value, 0, 6, delta)
    }
  }

  function dispose() {
    disposed = true
    geometries.forEach((g) => g.dispose())
    materials.forEach((m) => m.dispose())
  }

  return { group, update, dispose }
}
