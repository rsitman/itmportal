'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  mockAplikace,
  mockMojePrace,
  mockProvozniInformace,
} from '@/data/dashboard-mock'

// three.js scéna se načítá až v prohlížeči (Canvas nelze SSR)
const RobotScene = dynamic(() => import('./RobotScene'), {
  ssr: false,
  loading: () => null,
})

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { value: '17', label: 'let integrujeme' },
  { value: '99', label: 'členů týmu' },
  { value: '66', label: 'aktivních klientů' },
  { value: '130', label: 'serverů ve správě' },
]

const PROVOZNI_LABEL: Record<string, string> = {
  odstavky: 'Odstávky',
  oznameni: 'Oznámení',
  novinky: 'Novinky',
  zmeny_procesu: 'Změny procesů',
}

export default function RobotDashboard() {
  const scope = useRef<HTMLDivElement>(null!)
  const canvasWrap = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero — stagger reveal nadpisu
      gsap.from('[data-hero-line]', {
        yPercent: 120,
        opacity: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.2,
      })
      gsap.from('[data-hero-fade]', {
        opacity: 0,
        y: 24,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.9,
      })

      // Reveal pro každou sekci
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 60,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
      })

      // Reveal jednotlivých karet / položek
      gsap.utils.toArray<HTMLElement>('[data-reveal-item]').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power3.out',
          delay: (i % 4) * 0.06,
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        })
      })

      // Scroll cue mizí po posunu
      gsap.to('[data-scroll-cue]', {
        opacity: 0,
        scrollTrigger: {
          trigger: scope.current,
          start: 'top top',
          end: '+=300',
          scrub: true,
        },
      })
    }, scope)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={scope} className="robot-dashboard">
      {/* ===== Pozadí: gradient + 3D plátno ===== */}
      <div className="robot-bg" aria-hidden />
      <div ref={canvasWrap} className="robot-canvas-wrap" aria-hidden>
        <RobotScene />
      </div>
      <div className="robot-vignette" aria-hidden />

      {/* ===== Horní navigační lišta ===== */}
      <header className="robot-header">
        <div className="robot-logo">
          <span className="robot-logo-dot" />
          ITMAN<span className="robot-logo-accent">.</span>portal
        </div>
        <nav className="robot-nav">
          <a href="#aplikace">Aplikace</a>
          <a href="#moje-prace">Moje práce</a>
          <a href="#aktuality">Aktuality</a>
          <a href="/dashboard" className="robot-nav-cta">Přejít na portál →</a>
        </nav>
      </header>

      {/* ===== HERO ===== */}
      <section className="robot-hero">
        <p className="robot-eyebrow" data-hero-fade>
          ERP KARAT · ICT · AI — jeden tým, jedna platforma
        </p>
        <h1 className="robot-hero-title">
          <span className="robot-hero-mask"><span data-hero-line>Intranet,</span></span>
          <span className="robot-hero-mask"><span data-hero-line>Brought to Life.</span></span>
        </h1>
        <p className="robot-hero-sub" data-hero-fade>
          Interaktivní rozhraní ITMAN, které ožije pod rukama — váš denní
          přehled projektů, aplikací i provozu na jednom místě.
        </p>

        <div className="robot-scroll-cue" data-scroll-cue>
          <span>scroll to explore</span>
          <span className="robot-scroll-line" />
        </div>
      </section>

      {/* ===== STATISTIKY ===== */}
      <section className="robot-stats" data-reveal>
        {STATS.map((s) => (
          <div key={s.label} className="robot-stat">
            <div className="robot-stat-value">{s.value}</div>
            <div className="robot-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ===== APLIKACE A SYSTÉMY ===== */}
      <section id="aplikace" className="robot-section">
        <div className="robot-section-head" data-reveal>
          <span className="robot-section-kicker">01 — Rozcestník</span>
          <h2 className="robot-section-title">Aplikace a systémy</h2>
          <p className="robot-section-desc">
            Skoky do každého nástroje, který tým ITMAN denně používá.
          </p>
        </div>
        <div className="robot-card-grid">
          {mockAplikace.map((a, i) => (
            <a
              key={a.id}
              href={a.href}
              className="robot-card"
              data-reveal-item
              target={a.external ? '_blank' : undefined}
              rel={a.external ? 'noopener noreferrer' : undefined}
            >
              <span className="robot-card-index">{String(i + 1).padStart(2, '0')}</span>
              <div className="robot-card-body">
                <h3 className="robot-card-title">{a.nazev}</h3>
                <p className="robot-card-desc">{a.popis}</p>
              </div>
              <span className="robot-card-arrow" aria-hidden>↗</span>
            </a>
          ))}
        </div>
      </section>

      {/* ===== MOJE PRÁCE ===== */}
      <section id="moje-prace" className="robot-section">
        <div className="robot-section-head" data-reveal>
          <span className="robot-section-kicker">02 — Osobní přehled</span>
          <h2 className="robot-section-title">Moje práce</h2>
          <p className="robot-section-desc">Co máte dnes na stole.</p>
        </div>
        <div className="robot-list">
          {mockMojePrace.map((m) => (
            <a key={m.id} href={m.href} className="robot-list-item" data-reveal-item>
              <div className="robot-list-main">
                <h3 className="robot-list-title">{m.nazev}</h3>
                <p className="robot-list-desc">{m.popis}</p>
              </div>
              {typeof m.pocet === 'number' && (
                <span className="robot-list-badge">{m.pocet}</span>
              )}
              <span className="robot-list-arrow" aria-hidden>→</span>
            </a>
          ))}
        </div>
      </section>

      {/* ===== AKTUALITY + PROVOZNÍ INFO ===== */}
      <section id="aktuality" className="robot-section">
        <div className="robot-section-head" data-reveal>
          <span className="robot-section-kicker">03 — Provoz</span>
          <h2 className="robot-section-title">Provozní informace</h2>
          <p className="robot-section-desc">Stav služeb a aktuální oznámení.</p>
        </div>
        <div className="robot-info-grid">
          {mockProvozniInformace.map((p) => (
            <article key={p.id} className="robot-info-card" data-reveal-item>
              <span className="robot-info-tag">{PROVOZNI_LABEL[p.typ] ?? p.typ}</span>
              <h3 className="robot-info-title">{p.nadpis}</h3>
              <p className="robot-info-text">{p.text}</p>
              {p.datum && <time className="robot-info-date">{p.datum}</time>}
            </article>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="robot-cta" data-reveal>
        <h2 className="robot-cta-title">Jeden tým. Jedna platforma. Denně po ruce.</h2>
        <p className="robot-cta-sub">
          Náhled nového rozhraní ITMAN. Otevřete produkční portál a pokračujte v práci.
        </p>
        <a href="/dashboard" className="robot-cta-button">Přejít na dashboard →</a>
      </section>

      <footer className="robot-footer">
        <span>© 2026 ITMAN — náhled nového rozhraní</span>
        <a href="https://www.itman.cz/" target="_blank" rel="noopener noreferrer">itman.cz</a>
      </footer>

      <style jsx global>{`
        .robot-dashboard,
        .robot-dashboard * {
          box-sizing: border-box;
        }
        .robot-dashboard {
          position: relative;
          min-height: 100vh;
          width: 100%;
          color: #e6edf6;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-x: hidden;
          background: #05070d;
        }
        .robot-dashboard a { color: inherit; text-decoration: none; }
        .robot-dashboard h1, .robot-dashboard h2, .robot-dashboard h3 {
          color: #ffffff;
          margin: 0;
        }

        /* Pozadí */
        .robot-bg {
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(120% 90% at 70% 10%, rgba(16,185,129,0.18), transparent 55%),
            radial-gradient(120% 90% at 20% 90%, rgba(34,211,238,0.14), transparent 55%),
            linear-gradient(180deg, #05070d 0%, #07101f 45%, #05070d 100%);
        }
        .robot-canvas-wrap {
          position: fixed; inset: 0; z-index: 1;
          pointer-events: none;
        }
        .robot-vignette {
          position: fixed; inset: 0; z-index: 2;
          pointer-events: none;
          background: radial-gradient(130% 100% at 50% 40%, transparent 50%, rgba(0,0,0,0.55) 100%);
        }

        /* Layer pro obsah nad plátnem */
        .robot-dashboard > header,
        .robot-dashboard > section,
        .robot-dashboard > footer {
          position: relative;
          z-index: 3;
        }

        /* Header */
        .robot-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 40px;
          backdrop-filter: blur(8px);
          background: linear-gradient(180deg, rgba(5,7,13,0.6), transparent);
        }
        .robot-logo {
          display: flex; align-items: center; gap: 10px;
          font-weight: 700; font-size: 18px; letter-spacing: 0.02em; color: #fff;
        }
        .robot-logo-dot {
          width: 10px; height: 10px; border-radius: 999px;
          background: #10b981; box-shadow: 0 0 14px #10b981;
        }
        .robot-logo-accent { color: #10b981; }
        .robot-nav { display: flex; align-items: center; gap: 28px; font-size: 14px; }
        .robot-nav a { color: #9fb0c8; transition: color .2s; }
        .robot-nav a:hover { color: #fff; }
        .robot-nav-cta {
          padding: 8px 16px; border-radius: 999px;
          border: 1px solid rgba(16,185,129,0.5);
          color: #6ee7b7 !important;
        }
        .robot-nav-cta:hover { background: rgba(16,185,129,0.12); }

        /* Hero */
        .robot-hero {
          min-height: 100vh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 0 40px; max-width: 1200px; margin: 0 auto;
        }
        .robot-eyebrow {
          font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase;
          color: #6ee7b7; margin: 0 0 22px;
        }
        .robot-hero-title {
          font-size: clamp(48px, 11vw, 168px);
          line-height: 0.92; font-weight: 800; letter-spacing: -0.03em;
          margin: 0; color: #fff;
        }
        .robot-hero-mask { display: block; overflow: hidden; padding-bottom: 0.06em; }
        .robot-hero-mask > span { display: block; will-change: transform; }
        .robot-hero-sub {
          max-width: 620px; margin: 28px 0 0;
          font-size: clamp(16px, 1.6vw, 20px); line-height: 1.55; color: #a9bcd6;
        }

        .robot-scroll-cue {
          position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #6f819b;
        }
        .robot-scroll-line {
          width: 1px; height: 46px;
          background: linear-gradient(180deg, #6f819b, transparent);
          animation: robotPulse 1.8s ease-in-out infinite;
        }
        @keyframes robotPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.7); }
          50% { opacity: 1; transform: scaleY(1); }
        }

        /* Stats */
        .robot-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
          padding: 120px 40px; max-width: 1200px; margin: 0 auto;
        }
        .robot-stat { border-top: 1px solid rgba(255,255,255,0.12); padding-top: 20px; }
        .robot-stat-value {
          font-size: clamp(40px, 6vw, 72px); font-weight: 800; color: #fff;
          letter-spacing: -0.02em; line-height: 1;
        }
        .robot-stat-label { margin-top: 10px; color: #8898b3; font-size: 14px; }

        /* Sections */
        .robot-section { padding: 120px 40px; max-width: 1200px; margin: 0 auto; }
        .robot-section-head { max-width: 640px; margin-bottom: 56px; }
        .robot-section-kicker {
          font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #22d3ee;
        }
        .robot-section-title {
          font-size: clamp(32px, 5vw, 64px); font-weight: 700; letter-spacing: -0.02em;
          margin: 14px 0 16px;
        }
        .robot-section-desc { color: #a9bcd6; font-size: 17px; line-height: 1.5; }

        /* Card grid (Aplikace) */
        .robot-card-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;
        }
        .robot-card {
          position: relative; display: flex; flex-direction: column; justify-content: space-between;
          min-height: 180px; padding: 26px;
          border-radius: 18px;
          background: linear-gradient(160deg, rgba(20,32,52,0.7), rgba(10,16,30,0.7));
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          transition: transform .35s cubic-bezier(.2,.7,.2,1), border-color .35s, box-shadow .35s;
          overflow: hidden;
        }
        .robot-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(120% 120% at 100% 0, rgba(16,185,129,0.18), transparent 50%);
          opacity: 0; transition: opacity .35s;
        }
        .robot-card:hover {
          transform: translateY(-6px);
          border-color: rgba(16,185,129,0.4);
          box-shadow: 0 24px 60px -20px rgba(16,185,129,0.35);
        }
        .robot-card:hover::before { opacity: 1; }
        .robot-card-index {
          font-size: 12px; color: #4f6485; letter-spacing: 0.1em;
        }
        .robot-card-body { position: relative; z-index: 1; }
        .robot-card-title { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
        .robot-card-desc { color: #9fb0c8; font-size: 14px; line-height: 1.45; }
        .robot-card-arrow {
          position: relative; z-index: 1; align-self: flex-end;
          color: #6ee7b7; font-size: 20px;
          transform: translate(-4px, 2px); transition: transform .35s;
        }
        .robot-card:hover .robot-card-arrow { transform: translate(2px, -2px); }

        /* List (Moje práce) */
        .robot-list { display: flex; flex-direction: column; }
        .robot-list-item {
          display: flex; align-items: center; gap: 20px;
          padding: 26px 6px; border-top: 1px solid rgba(255,255,255,0.1);
          transition: padding .3s, background .3s;
        }
        .robot-list-item:last-child { border-bottom: 1px solid rgba(255,255,255,0.1); }
        .robot-list-item:hover { padding-left: 18px; background: rgba(16,185,129,0.05); }
        .robot-list-main { flex: 1; }
        .robot-list-title { font-size: 22px; font-weight: 600; }
        .robot-list-desc { color: #9fb0c8; font-size: 14px; margin-top: 4px; }
        .robot-list-badge {
          min-width: 44px; height: 44px; padding: 0 14px; border-radius: 999px;
          display: inline-flex; align-items: justify-center; justify-content: center;
          background: rgba(16,185,129,0.15); color: #6ee7b7; font-weight: 700;
        }
        .robot-list-arrow { color: #6f819b; font-size: 22px; transition: transform .3s, color .3s; }
        .robot-list-item:hover .robot-list-arrow { color: #6ee7b7; transform: translateX(6px); }

        /* Info grid (Provozní informace) */
        .robot-info-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
        }
        .robot-info-card {
          padding: 28px; border-radius: 18px;
          background: linear-gradient(160deg, rgba(20,32,52,0.6), rgba(10,16,30,0.6));
          border: 1px solid rgba(255,255,255,0.08);
        }
        .robot-info-tag {
          display: inline-block; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
          color: #22d3ee; padding: 4px 10px; border-radius: 999px;
          background: rgba(34,211,238,0.12); margin-bottom: 16px;
        }
        .robot-info-title { font-size: 20px; font-weight: 600; margin-bottom: 10px; }
        .robot-info-text { color: #a9bcd6; font-size: 14px; line-height: 1.55; }
        .robot-info-date { display: block; margin-top: 16px; color: #4f6485; font-size: 12px; }

        /* CTA */
        .robot-cta {
          text-align: center; padding: 160px 40px 120px; max-width: 900px; margin: 0 auto;
        }
        .robot-cta-title {
          font-size: clamp(36px, 6vw, 84px); font-weight: 800; letter-spacing: -0.02em;
          line-height: 1; color: #fff;
        }
        .robot-cta-sub { color: #a9bcd6; font-size: 17px; margin: 24px 0 36px; }
        .robot-cta-button {
          display: inline-block; padding: 16px 32px; border-radius: 999px;
          background: #10b981; color: #04140d !important; font-weight: 700; font-size: 16px;
          box-shadow: 0 20px 50px -16px rgba(16,185,129,0.6);
          transition: transform .3s, box-shadow .3s;
        }
        .robot-cta-button:hover { transform: translateY(-3px); box-shadow: 0 28px 70px -16px rgba(16,185,129,0.8); }

        .robot-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 40px; border-top: 1px solid rgba(255,255,255,0.08);
          color: #6f819b; font-size: 13px;
        }

        @media (max-width: 768px) {
          .robot-nav a:not(.robot-nav-cta) { display: none; }
          .robot-header { padding: 18px 20px; }
          .robot-hero, .robot-section, .robot-stats, .robot-cta { padding-left: 20px; padding-right: 20px; }
          .robot-stats { grid-template-columns: repeat(2, 1fr); padding-top: 80px; padding-bottom: 80px; }
          .robot-footer { flex-direction: column; gap: 10px; }
        }
      `}</style>
    </div>
  )
}
