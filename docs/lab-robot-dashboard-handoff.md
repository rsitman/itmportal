# Handoff — ITMAN robot dashboard (Lusion-style redesign)

Tento dokument shrnuje kontext pro pokračování v novém chatu. Projekt: `/home/oak/firma-portal`, větev `test`.

## Cíl
Redesign dashboardu firmy-portal ve stylu https://lusion.co/ s 3D ITMAN robotem (three.js + GSAP). Zatím jen dashboard stránka, uložená jako **nová standalone webpage, která neovlivňuje stávající portál**.

## Kde to běží
- Dev server už běží: `http://localhost:3000` (Next.js 16, Turbopack). Stránka: **`http://localhost:3000/lab/robot-dashboard`**
- Spuštěno přes `npm run dev` v `/home/oak/firma-portal` (background shell).
- **DB/Postgres není potřeba** pro `/lab/*` (auth obešty, viz níže). Pro zbytek portálu DB neběží (Docker není v WSL dostupný).

## Tech stack
- Next.js 16.1.6 (App Router, Turbopack) + React 18.3.1 + TypeScript (strict) + Tailwind v4
- 3D: **čistý three.js** (`three@0.160`, `three-stdlib`) — **NE @react-three/fiber/drei**
- Animace: `gsap` + `ScrollTrigger` (jen pro hero reveal + scroll cue; let robota je řešen přímo přes `window.scrollY`)
- npm installuje s **`--legacy-peer-deps`** (kvůli peer konfliktu `@azure/msal-react` ↔ React 18)

## Zásadní rozhodnutí (proč tak, jak tak)
- **r3f/drei bylo zahozeno.** `@react-three/fiber` + jeho `react-reconciler` házel `Cannot read properties of undefined (reading 'ReactCurrentOwner')` pod Next 16 Turbopack + React 18. Přepsáno na čistý three.js v jednom `useEffect`. `@react-three/fiber`/`drei` jsou stále v `package.json` (neimportují se ničím) — lze odinstalovat.
- **Let robota je řízen uvnitř `RobotScene`**, ne přes GSAP ScrollTrigger a ne přes sdílený `scrollState` modul. Scroll listener + waypoint interpolace přímo v `RobotScene`, aplikace přes `THREE.MathUtils.damp` v render cyklu.
- **🔥 Kritický bug, který už je opravený: `THREE.Clock` pořadí volání.** V tick cyklu se **musí jako první volat `clock.getDelta()`** a elapsed čas se čte z `clock.elapsedTime`. **NE** `const t = clock.getElapsedTime(); const delta = clock.getDelta()` — `getElapsedTime()` interně zavolá `getDelta()` a posune `oldTime`, takže následné `getDelta()` vrátí ~0. Pak každý `damp(current, target, lambda, 0)` vrátí `current` (faktor `1 - exp(0) = 0`) a robot se nikdy nepohne (jen bob/smrk, které používají `t`). Příznak: scéna žije, ale robot stojí.
- **Postoj robota při letu je podle směru scrollování**, ne podle směru pohybu. Scroll dolů → robot se otočí hlavou dolů (roll `rotation.z → π`), scroll nahoru → hlavou nahoru (`→ 0`). Při nečinnosti drží poslední postoj. Ruce zůstávají u těla. Posun do stran (x) je nezávislý (waypointy).
- **Stopa je vertikální mlha ze zeleného halo podstavce**, ne stopa pohybu. Vždy vertikální (výška > šířka sprity), vychází z bodu podstavce (robot-local y −1.5), origin se posouvá horizontálně s robotem, intenzita (spawn rate) odpovídá rychlosti scrollování.

## Soubory
Nové:
- `src/app/lab/robot-dashboard/page.tsx` — routa `/lab/robot-dashboard`, metadata (noindex), renderuje `<RobotDashboard />`
- `src/components/lab/robot-dashboard/RobotDashboard.tsx` — stránka (hero, statistiky, sekce Aplikace/Moje práce/Aktuality, CTA, footer), GSAP hero reveal + scroll cue, stylizace přes `<style jsx global>`
- `src/components/lab/robot-dashboard/RobotScene.tsx` — **čistý three.js**: WebGLRenderer, kamera, světla, PMREMGenerator + RoomEnvironment, hvězdy, contact shadow, **scroll-driven flight (waypointy + damp + postoj podle scroll direction)**, contrail, debug HUD (DOM)
- `src/components/lab/robot-dashboard/ItmanRobot.tsx` — `createItmanRobot()` (procedurální ITMAN robot z three.js primitiv, včetně **mávnutí pravou rukou na úvod**), `createStars()`, `createContactShadow()`, `createTrail()` (vertikální mlha), `makeSmokeTexture()`, `makeLogoTexture()`

Změněné (jen bypass, neovlivňuje portál):
- `src/components/ClientLayout.tsx` — `/lab/*` vynechá app shell (jako `/login`): `const isLabPage = pathname.startsWith('/lab')`; render bypass `(isLoginPage || isLabPage)`
- `middleware.ts` — `/lab/*` propuštěno z auth: `|| pathname.startsWith('/lab')`

Smazané:
- `src/components/lab/robot-dashboard/scrollState.ts` (původní sdílený stav — už nepoužíváno)

## Robot — aktuální design (podle itman.cz, AI-Robot.webp)
- **Tělo**: zaoblený jehlan na špičce (`LatheGeometry`), bílý plast, zúžený `BODY_SCALE=0.82` vůči hlavě
- **Hlava**: menší zaoblená koule (r=0.6, scale 1.05/0.92/1.0), bílá
- **Visor**: **torusový oblouk** (`TorusGeometry(VISOR_R=HEAD_R*1.06, VISOR_TUBE=0.13, 20, 64, arc=1.5)`) — přirozeně kulaté konce díky trubkovému průřezu. Leží v rovině XZ (horizontálně), centrovaný na +Z (předek). Orientace přes složenou kvaternion: rot X `−π/2` (prstec do XZ), pak rot Y `−π/2 − arc/2` (střed oblouku na +Z). Scale `(1.05, 1.0, 0.92)` přizpůsobí elipsoidu hlavy. **Klíčové znaménko rotace Y je mínus** (`−π/2 − arc/2`); s plus oblouk míří na bok/za hlavu a není vidět.
- **Oči**: svítící světle zelené obdélníky (`EYE_GREEN=0xb6ff9e`), na vnějším povrchu visorové trubky (`r = VISOR_R + VISOR_TUBE + 0.02`), natočené podle normály, s mrknutím
- **Uši**: zelené boční válečky + svítící jádro (`GREEN=0x49b141`)
- **Krk**: černý válec
- **Paže**: bílé kapsule, mírně ohnuté v loktech, zelený náramek. **Pravá paže (`rightArm`, s===1) je uložena jako reference** pro mávnutí.
- **Logo na hrudi**: canvas textura, 3 pruhy 2-1-2 dle originálu. Zelené kapsle na průhledném pozadí, `MeshBasicMaterial` s `alphaTest`
- **Základ**: zelený levitační prstenec + tenký modrozelený vnější prstenec (zelené halo — **z toho vychází stopa**)
- Robot plovoucí (bob), hlava sleduje myš, oči blikají, prstenec pulzuje

## Mávnutí pravou rukou na úvod
V `createItmanRobot().update` (gated `!flying`, tj. proběhne jen než uživatel začne rolovat):
- `WAVE_START=0.4s`, `WAVE_END=3.2s`. Envelopa: zvednutí (0.5s) → kýv → složení (0.5s).
- `rightArm.rotation.z = env * (2.9 + sin(phase*9)*0.3)` — paže **nahoru vedle hlavy** (~2.9 rad ≈ 166°, ruka nad ramenem). `rotation.x = env * -0.2` (mírný předklon).
- `flying` flag se počítá v `RobotScene` (`progress > 0.02`) a předává do `robot.update(t, delta, pointer, viewport, flying)`. Při letu se mávnutí přeruší a paže se přes `damp` vrátí do klidu (ruce u těla).

## Flight path (waypointy v `RobotScene`)
`WAYPOINTS` podle progressu scrollování (0→1):
- 0.00: cam 7.0, x 0, y 0 (start, blízko)
- 0.14: cam 22.0, x 0, y 0 (intro odzoom — **výrazný**, robot hodně zmenšený)
- 0.40: cam 22.0, x +5.5, y +0.6 (Aplikace, vpravo — **výrazný pohyb do stran**)
- 0.66: cam 22.0, x −5.5, y −0.4 (Moje práce, vlevo)
- 0.84: cam 22.0, x +4.8, y +0.7 (Aktuality, vpravo)
- 1.00: cam 17.0, x 0, y +0.35 (CTA, návrat na střed)

Aplikace: `robot.group.position.x/y` a `camera.position.z` se dotvarují `damp(..., 2.5, delta)`. Kamera `lookAt(0,0,0)`.
Pozice robota je nezávislá na postoji (postoj = scroll direction, viz níže).

## Postoj robota při letu (podle scroll direction)
V tick cyklu:
- `scrollVel = (progress - lastProgress) / delta` (progress/s).
- `attitudeTarget`: `scrollVel > 0.06 → Math.PI` (hlavou dolů), `scrollVel < -0.06 → 0` (hlavou nahoru), jinak drží.
- `robot.group.rotation.z = damp(..., attitudeTarget, 3, delta)`.
- `rotation.x` a `rotation.y` se dotvarují k 0.
- `rot` pole v `WAYPOINTS` je **zastaralé/nepoužité** (smazat lze).

## Stopa (vertikální mlha z podstavce)
`createTrail(160, 1.4)` v `ItmanRobot.tsx`:
- Měkké sprity (`THREE.Sprite` + `SpriteMaterial`) s radiálním gradientem (`makeSmokeTexture`), aditivní blend, billboard ke kameře.
- **Vertikální** (`scale.y > scale.x`, sy ~1.0–1.9, sx ~0.3–0.55), stoupají (`position.y += delta * rise * fade * 2.2`) a rozšiřují se, kvadratický fade.
- Spawnuje se z **podstavce** (robot world pos + `(0, -1.5, 0)`), s horizontálním jitterem. Origin se posouvá s robotem.
- **Spawn rate ∝ scroll speed**: `rate = 5 + clamp(|scrollVel| * 45, 0, 90)` puffs/s.
- API: `trail.update(delta, basePos, scrollSpeed)`. `scrollSpeed = Math.abs(scrollVel)` předává `RobotScene`.

## Ověřovací příkazy
- Lint: `ReadLints` na `src/components/lab/robot-dashboard/*.tsx`
- Typy: `cd /home/oak/firma-portal && npx tsc --noEmit -p tsconfig.json` (trvá ~3 min)
- HTTP check: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/lab/robot-dashboard"` (vyžaduje `full_network`)
- Pozor: sandbox blokuje network bez `required_permissions:["full_network"]`.

## Otevřené body / TODO
1. **OVĚŘIT** nový model letu (postoj hlavou dolů/nahoru podle scroll direction, výrazný odzoom na cam 22, pohyb do stran x ±5.5) a stopu (vertikální mlha z podstavce ∝ scroll speed). Uživatel ještě nepotvrdil.
2. **Po ověření: odebrat debug HUD** z `RobotScene` (blok `const debug = document.createElement('div') ...` + `debug.textContent` v `onScroll` + `document.body.appendChild(debug)` + remove v cleanup). Aktuálně HUD ukazuje `scroll · prog · cam · x`.
3. **Smazat nepoužívané `rot` pole** z `Waypoint`/`WAYPOINTS` a `computeFlight` (už se nepoužívá pro orientaci).
4. `@react-three/fiber`/`drei` jsou stále v `package.json` (neimportují se) — lze odinstalovat.
5. Ev. doladění: úhel roll pro "hlavou dolů" (aktuálně π = plný překlop; možná uživatel bude chtít míň), rychlost/množství mlhy, velikost robota.

## Reference — originální assety (staženo do /tmp, ne v repu)
- Robot: `https://www.itman.cz/wp-content/uploads/2024/02/AI-Robot.webp`
- Logo: `https://www.itman.cz/wp-content/uploads/2023/11/ITMAN-Logo.png`
- Barvy: white `#ffffff`, black `#0b0b0b`, ITMAN green `#49b141`, oči světle zelená `#b6ff9e`

## Kontext portálu (pro bezpečnost)
- Stávající dashboard: `src/app/dashboard/page.tsx` (klientský, NextAuth session guard) — **nedotčeno**.
- App shell: `src/components/ClientLayout.tsx` (sidebar + header) — jen přidán bypass pro `/lab/*`.
- Auth: `middleware.ts` — jen přidán bypass pro `/lab/*`.
- Mock data pro sekce: `@/data/dashboard-mock` (`mockAplikace`, `mockMojePrace`, `mockProvozniInformace`).

## Verze GSAP/three
- `gsap@3.12.5`, `three@0.160.1`, `three-stdlib` (poskytuje `RoundedBoxGeometry`, `RoomEnvironment`)
- `RoundedBoxGeometry` import z `'three-stdlib'`; `RoomEnvironment()` se volá **bez `new`** (je to funkce vracející `THREE.Scene`).
- `ctx.roundRect` na canvas 2D funguje v browseru (pro logo texturu).
