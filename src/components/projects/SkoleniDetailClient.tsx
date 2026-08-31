'use client'

import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { SkoleniDetail, SkoleniExtraField, SkoleniUcastnik } from '@/types/project'
import { logger } from '@/lib/logger'
import {
  canFinishSkoleni,
  canStartSkoleni,
  displayText,
  formatSkoleniDate,
  formatSkoleniStav,
  getStavBadgeClass,
  getOdeslanoBadgeClass,
  isDotaznikVyplneny,
  isUcastPositive,
} from '@/lib/skoleni-format'

type SkoleniDetailClientProps = {
  doklad: string
  poradiSkol: number
  returnTo?: string | null
}

function safeInternalHref(value: string | undefined | null): string | null {
  const v = (value ?? '').trim()
  if (!v) return null
  if (!v.startsWith('/')) return null
  if (v.startsWith('//')) return null
  return v
}

const linkFocus =
  'group inline-flex rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'

const primaryBtn =
  'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600'
const secondaryBtn =
  'px-4 py-2 rounded border border-gray-600 bg-gray-800/80 text-gray-300 hover:text-gray-100 hover:bg-gray-700 hover:border-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800/80 disabled:hover:text-gray-300'
const smallBtn =
  'px-2 py-1 text-xs rounded border border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

type ModalState =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'note'; person: SkoleniUcastnik }
  | { type: 'resend'; person: SkoleniUcastnik }
  | { type: 'confirmStav'; stav: 20 | 30 }

type Notice = { tone: 'ok' | 'error'; text: string }

function skoleniApiPath(doklad: string, poradiSkol: number, suffix: string): string {
  return `/api/skoleni/${encodeURIComponent(doklad)}/${encodeURIComponent(String(poradiSkol))}${suffix}`
}

async function postSkoleniAction(url: string, body: Record<string, unknown>): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  let payload: { message?: string; error?: string } | null = null
  try {
    payload = await response.clone().json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    return {
      ok: false,
      message: payload?.message || payload?.error || 'Požadavek se nepodařilo odeslat.',
    }
  }

  return { ok: true }
}

export default function SkoleniDetailClient({
  doklad,
  poradiSkol,
  returnTo = null,
}: SkoleniDetailClientProps) {
  const [detail, setDetail] = useState<SkoleniDetail | null>(null)
  const [ucastnici, setUcastnici] = useState<SkoleniUcastnik[]>([])
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [loadingUcastnici, setLoadingUcastnici] = useState(true)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [ucastniciError, setUcastniciError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })
  const [notice, setNotice] = useState<Notice | null>(null)
  const [savingStav, setSavingStav] = useState<20 | 30 | null>(null)
  const [savingUcast, setSavingUcast] = useState<number | null>(null)

  const backHref = safeInternalHref(returnTo) ?? '/evidence-skoleni'
  const projectHref = `/projects/doklad-projektu/${encodeURIComponent(doklad)}`

  const fetchAll = useCallback(async () => {
    const encodedDoklad = encodeURIComponent(doklad)
    const encodedPoradi = encodeURIComponent(String(poradiSkol))

    const detailPromise = fetch(`/api/skoleni/${encodedDoklad}/${encodedPoradi}`)
      .then(async (response) => {
        if (response.status === 404) {
          setDetail(null)
          setDetailError('Školení nebylo nalezeno.')
          return
        }
        if (!response.ok) {
          let errorBody: { message?: string } | null = null
          try {
            errorBody = await response.clone().json()
          } catch {
            errorBody = null
          }
          setDetailError(errorBody?.message || 'Nepodařilo se načíst detail školení.')
          return
        }
        const data = await response.json()
        setDetailError(null)
        setDetail(data.detail ?? null)
      })
      .catch((error) => {
        logger.error('Error fetching skoleni detail:', error)
        setDetailError('Došlo k chybě při načítání detailu školení.')
      })
      .finally(() => setLoadingDetail(false))

    const ucastniciPromise = fetch(`/api/skoleni/${encodedDoklad}/${encodedPoradi}/ucastnici`)
      .then(async (response) => {
        if (!response.ok) {
          let errorBody: { message?: string } | null = null
          try {
            errorBody = await response.clone().json()
          } catch {
            errorBody = null
          }
          setUcastniciError(errorBody?.message || 'Nepodařilo se načíst účastníky školení.')
          return
        }
        const data = await response.json()
        setUcastniciError(null)
        setUcastnici(Array.isArray(data.ucastnici) ? data.ucastnici : [])
      })
      .catch((error) => {
        logger.error('Error fetching skoleni ucastnici:', error)
        setUcastniciError('Došlo k chybě při načítání účastníků školení.')
      })
      .finally(() => setLoadingUcastnici(false))

    await Promise.all([detailPromise, ucastniciPromise])
  }, [doklad, poradiSkol])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (modal.type === 'closed') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal({ type: 'closed' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modal.type])

  const changeStav = async (stav: 20 | 30) => {
    setSavingStav(stav)
    setNotice(null)
    try {
      const result = await postSkoleniAction(skoleniApiPath(doklad, poradiSkol, '/stav'), { stav })
      if (!result.ok) {
        setNotice({ tone: 'error', text: result.message })
        return
      }
      setDetail((current) => (current ? { ...current, stav: String(stav) } : current))
      setNotice({
        tone: 'ok',
        text: stav === 20 ? 'Školení bylo zahájeno.' : 'Školení bylo ukončeno.',
      })
      setLoadingDetail(true)
      await fetchAll()
    } catch (error) {
      logger.error('Error changing skoleni stav:', error)
      setNotice({ tone: 'error', text: 'Změna stavu školení se nezdařila.' })
    } finally {
      setSavingStav(null)
    }
  }

  const toggleUcast = async (person: SkoleniUcastnik, next: boolean) => {
    const previous = person.ucast
    setSavingUcast(person.poradi_osoba)
    setNotice(null)
    setUcastnici((current) =>
      current.map((item) =>
        item.poradi_osoba === person.poradi_osoba ? { ...item, ucast: next ? '1' : '0' } : item
      )
    )
    try {
      const result = await postSkoleniAction(
        skoleniApiPath(doklad, poradiSkol, `/osoba/${encodeURIComponent(String(person.poradi_osoba))}/ucast`),
        { ucast: next ? 1 : 0 }
      )
      if (!result.ok) {
        setUcastnici((current) =>
          current.map((item) =>
            item.poradi_osoba === person.poradi_osoba ? { ...item, ucast: previous } : item
          )
        )
        setNotice({ tone: 'error', text: result.message })
        return
      }
      setLoadingUcastnici(true)
      await fetchAll()
    } catch (error) {
      logger.error('Error changing skoleni ucast:', error)
      setUcastnici((current) =>
        current.map((item) =>
          item.poradi_osoba === person.poradi_osoba ? { ...item, ucast: previous } : item
        )
      )
      setNotice({ tone: 'error', text: 'Změna účasti se nezdařila.' })
    } finally {
      setSavingUcast(null)
    }
  }

  const title = detail?.tema.trim() || `Školení ${poradiSkol}`

  const filteredUcastnici = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const sorted = [...ucastnici].sort((a, b) => {
      const order = a.poradi_osoba - b.poradi_osoba
      if (order !== 0) return order
      return a.ucastnik.localeCompare(b.ucastnik, 'cs')
    })

    if (!query) return sorted

    return sorted.filter((person) => {
      const haystacks = [
        person.ucastnik,
        String(person.poradi_osoba),
        person.e_mail,
        person.poznamka,
        person.ucast,
        person.dotaznik,
        person.odeslano,
      ]
      return haystacks.some((value) => value.toLowerCase().includes(query))
    })
  }, [ucastnici, searchTerm])

  const attendedCount = ucastnici.filter((person) => isUcastPositive(person.ucast)).length
  const canStart = canStartSkoleni(detail?.stav)
  const canFinish = canFinishSkoleni(detail?.stav)

  if (loadingDetail && !detail) {
    return (
      <div className="w-full py-10 bg-transparent">
        <div className="px-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="px-4 sm:px-6 space-y-6 min-w-0">
        <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5 min-w-0">
          <header className="border-b border-gray-700/50 pb-4">
            <nav className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href="/evidence-skoleni" className={linkFocus}>
                <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
                  Evidence školení
                </span>
              </Link>
              <span className="text-gray-700">/</span>
              <Link href={projectHref} className={linkFocus} title={doklad}>
                <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
                  {detail?.nazev_projektu.trim() || doklad}
                </span>
              </Link>
              <span className="text-gray-700">/</span>
              <span className="text-gray-300">{title}</span>
            </nav>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">{title}</h1>
                <p className="mt-1 text-sm text-gray-400">
                  {detail?.nazev_projektu.trim() ? (
                    <>
                      <span className="text-gray-200">{detail.nazev_projektu}</span>
                      <span className="mx-1.5 text-gray-600">·</span>
                    </>
                  ) : null}
                  <span className="font-mono text-[11px] text-gray-500">{doklad}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModal({ type: 'confirmStav', stav: 20 })}
                  disabled={!detail || !canStart || savingStav !== null}
                  title={
                    !detail
                      ? 'Nejprve načtěte detail školení'
                      : canStart
                        ? 'Nastavit stav školení na zahájeno'
                        : 'Školení už bylo zahájeno nebo ukončeno'
                  }
                  className={primaryBtn}
                >
                  {savingStav === 20 ? 'Zahajuji…' : 'Zahájit školení'}
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'confirmStav', stav: 30 })}
                  disabled={!detail || !canFinish || savingStav !== null}
                  title={
                    canFinish
                      ? 'Nastavit stav školení na ukončeno'
                      : 'Ukončit školení lze až po jeho zahájení'
                  }
                  className={
                    canFinish
                      ? 'px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-600'
                      : secondaryBtn
                  }
                >
                  {savingStav === 30 ? 'Ukončuji…' : 'Ukončit školení'}
                </button>
                <button
                  onClick={() => {
                    setLoadingDetail(true)
                    setLoadingUcastnici(true)
                    void fetchAll()
                  }}
                  className={primaryBtn}
                >
                  Obnovit
                </button>
                <Link href={backHref} className={secondaryBtn}>
                  ← Zpět
                </Link>
              </div>
            </div>
          </header>

          {notice ? (
            <div
              className={`mt-4 rounded-lg border px-5 py-3 text-sm ${
                notice.tone === 'ok'
                  ? 'border-green-700/70 bg-green-900/30 text-green-100'
                  : 'border-red-700/70 bg-red-900/40 text-red-100'
              }`}
            >
              {notice.text}
            </div>
          ) : null}

          {detailError && !detail ? (
            <div className="mt-4 rounded-lg border border-red-700/70 bg-red-900/40 px-5 py-4 text-red-100">
              {detailError}
            </div>
          ) : detail ? (
            <DetailFields detail={detail} projectHref={projectHref} />
          ) : null}
        </div>

        <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Účastníci školení</h2>
              <p className="text-sm text-gray-400 mt-1">
                Účastník, e-mail, účast, stav a odeslání dotazníku
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <dl className="grid grid-cols-2 gap-x-6 text-right">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Celkem</dt>
                  <dd className="text-sm font-semibold text-white mt-0.5">{ucastnici.length}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Účast</dt>
                  <dd className="text-sm font-semibold text-gray-200 mt-0.5">{attendedCount}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setModal({ type: 'add' })}
                disabled={!detail}
                className={primaryBtn}
              >
                Přidat osobu
              </button>
            </div>
          </div>

          <div className="mt-4 w-full sm:max-w-md">
            <label htmlFor="skoleni-ucastnici-search" className="block text-sm font-medium text-gray-400 mb-1">
              Hledat v účastnících
            </label>
            <input
              id="skoleni-ucastnici-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Účastník, e-mail, poznámka…"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {ucastniciError ? (
            <div className="mt-4 rounded-lg border border-red-700/70 bg-red-900/40 px-5 py-4 text-red-100">
              {ucastniciError}
            </div>
          ) : null}

          <UcastniciTable
            loading={loadingUcastnici && ucastnici.length === 0}
            people={filteredUcastnici}
            hasAny={ucastnici.length > 0}
            hasFilters={Boolean(searchTerm.trim())}
            savingUcast={savingUcast}
            onToggleUcast={(person, next) => void toggleUcast(person, next)}
            onEditPoznamka={(person) => setModal({ type: 'note', person })}
            onResendDotaznik={(person) => setModal({ type: 'resend', person })}
          />
        </div>
      </div>

      {modal.type === 'add' ? (
        <AddOsobaModal
          onClose={() => setModal({ type: 'closed' })}
          onSubmit={async (payload) => {
            const result = await postSkoleniAction(skoleniApiPath(doklad, poradiSkol, '/osoba'), payload)
            if (!result.ok) return result
            setModal({ type: 'closed' })
            setNotice({ tone: 'ok', text: 'Osoba byla přidána.' })
            setLoadingUcastnici(true)
            await fetchAll()
            return result
          }}
        />
      ) : null}

      {modal.type === 'note' ? (
        <PoznamkaModal
          person={modal.person}
          onClose={() => setModal({ type: 'closed' })}
          onSubmit={async (poznamka) => {
            const result = await postSkoleniAction(
              skoleniApiPath(
                doklad,
                poradiSkol,
                `/osoba/${encodeURIComponent(String(modal.person.poradi_osoba))}/poznamka`
              ),
              { poznamka }
            )
            if (!result.ok) return result
            setModal({ type: 'closed' })
            setNotice({ tone: 'ok', text: 'Poznámka byla uložena.' })
            setLoadingUcastnici(true)
            await fetchAll()
            return result
          }}
        />
      ) : null}

      {modal.type === 'resend' ? (
        <ResendDotaznikModal
          person={modal.person}
          onClose={() => setModal({ type: 'closed' })}
          onSubmit={async (e_mail) => {
            const result = await postSkoleniAction(
              skoleniApiPath(
                doklad,
                poradiSkol,
                `/osoba/${encodeURIComponent(String(modal.person.poradi_osoba))}/dtz-odeslat`
              ),
              e_mail ? { e_mail } : {}
            )
            if (!result.ok) return result
            setModal({ type: 'closed' })
            setNotice({ tone: 'ok', text: 'Dotazník byl odeslán.' })
            setLoadingUcastnici(true)
            await fetchAll()
            return result
          }}
        />
      ) : null}

      {modal.type === 'confirmStav' ? (
        <ConfirmStavDialog
          stav={modal.stav}
          saving={savingStav !== null}
          onClose={() => setModal({ type: 'closed' })}
          onConfirm={() => {
            const stav = modal.stav
            setModal({ type: 'closed' })
            void changeStav(stav)
          }}
        />
      ) : null}
    </div>
  )
}

function DetailFields({
  detail,
  projectHref,
}: {
  detail: SkoleniDetail
  projectHref: string
}) {
  return (
    <div className="mt-5 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-6 items-start min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 min-w-0">
        <Kv label="Projekt">
          <Link href={projectHref} className={linkFocus} title={detail.doklad}>
            <span className="text-gray-200 group-hover:text-white group-hover:underline transition-colors">
              {displayText(detail.nazev_projektu || detail.doklad)}
            </span>
          </Link>
        </Kv>
        <Kv label="Doklad" mono>
          <Link href={projectHref} className={linkFocus}>
            <span className="text-gray-200 group-hover:text-white group-hover:underline transition-colors">
              {displayText(detail.doklad)}
            </span>
          </Link>
        </Kv>
        <Kv label="Pořadí školení">{detail.poradi_skol}</Kv>
        <Kv label="Téma">{displayText(detail.tema)}</Kv>
        <Kv label="Školitel">{displayText(detail.skolitel)}</Kv>
        <Kv label="Místo">{displayText(detail.misto)}</Kv>
        <Kv label="Datum">{formatSkoleniDate(detail.datum)}</Kv>
        <Kv label="Stav">
            {detail.stav ? (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${getStavBadgeClass(detail.stav)}`}
              >
                {formatSkoleniStav(detail.stav)}
              </span>
            ) : (
              '—'
            )}
        </Kv>
        {detail.extraFields.map((field) => (
          <Kv key={field.key} label={field.label}>
            <ExtraFieldValue field={field} />
          </Kv>
        ))}
      </div>

      <AnonymniDotaznikQr url={detail.odkaz_anonymni_dotaznik} />
    </div>
  )
}

function AnonymniDotaznikQr({ url }: { url: string | null }) {
  const wrapRef = useRef<HTMLSpanElement>(null)

  if (!url) {
    return (
      <aside className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-4 py-4 w-fit max-w-full min-w-0 xl:w-[220px]">
        <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Anonymní dotazník
        </div>
        <p className="mt-2 text-sm text-gray-500">Odkaz na anonymní dotazník není k dispozici.</p>
      </aside>
    )
  }

  return (
    <aside className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-4 py-4 w-fit max-w-full min-w-0 xl:w-[220px] flex flex-col">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Anonymní dotazník
      </div>
      <button
        type="button"
        onClick={() => openQrPreviewWindow(wrapRef.current, 'Anonymní dotazník')}
        className="mt-3 inline-flex w-full max-w-[168px] rounded-md bg-white p-2 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        aria-label="Zobrazit zvětšený QR kód anonymního dotazníku"
        title="Otevřít zvětšený QR kód v novém okně"
      >
        <span ref={wrapRef} className="block w-full min-w-0 [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-full">
          <QRCodeSVG
            value={url}
            size={168}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
            title="QR kód anonymního dotazníku"
          />
        </span>
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkFocus} mt-3 self-start text-sm text-gray-300 hover:text-white`}
      >
        <span className="group-hover:underline transition-colors">Otevřít dotazník</span>
      </a>
    </aside>
  )
}

function Kv({
  label,
  children,
  mono = false,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-0.5 text-sm text-gray-200 ${mono ? 'font-mono text-[12px] break-all' : 'break-words'}`}>
        {children}
      </div>
    </div>
  )
}

function ConfirmStavDialog({
  stav,
  saving,
  onClose,
  onConfirm,
}: {
  stav: 20 | 30
  saving: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const isStart = stav === 20

  return (
    <FormDialog
      title={isStart ? 'Zahájit školení?' : 'Ukončit školení?'}
      description={
        isStart
          ? 'Opravdu chcete zahájit toto školení? Tuto akci nelze v portálu vrátit zpět.'
          : 'Opravdu chcete ukončit toto školení? Tuto akci nelze v portálu vrátit zpět.'
      }
      onClose={onClose}
    >
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={saving} className={secondaryBtn}>
          Zrušit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className={
            isStart
              ? primaryBtn
              : 'px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
          }
        >
          {isStart ? 'Zahájit školení' : 'Ukončit školení'}
        </button>
      </div>
    </FormDialog>
  )
}

function ExtraFieldValue({ field }: { field: SkoleniExtraField }) {
  if (field.href) {
    return <ExternalLink href={field.href} label={field.value} />
  }
  return <>{displayText(field.value)}</>
}

function FormDialog({
  title,
  description,
  children,
  onClose,
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="skoleni-dialog-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Zavřít"
      />
      <div className="relative w-full max-w-md rounded-lg border border-gray-700/70 bg-gray-900 p-5 shadow-xl">
        <h3 id="skoleni-dialog-title" className="text-lg font-semibold text-white">
          {title}
        </h3>
        {description ? <p className="mt-1 text-sm text-gray-400">{description}</p> : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

const fieldClass =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500'
const fieldLabelClass = 'block text-sm font-medium text-gray-300 mb-1'

function AddOsobaModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (payload: {
    jmeno: string
    prijmeni: string
    e_mail: string
    poznamka: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
}) {
  const [jmeno, setJmeno] = useState('')
  const [prijmeni, setPrijmeni] = useState('')
  const [eMail, setEMail] = useState('')
  const [poznamka, setPoznamka] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const result = await onSubmit({
        jmeno: jmeno.trim(),
        prijmeni: prijmeni.trim(),
        e_mail: eMail.trim(),
        poznamka: poznamka.trim(),
      })
      if (!result.ok) setError(result.message)
    } catch (submitError) {
      logger.error('Error adding skoleni osoba:', submitError)
      setError('Osobu se nepodařilo přidat.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog title="Nová osoba" description="Přidání účastníka na školení." onClose={onClose}>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        <div>
          <label htmlFor="skoleni-jmeno" className={fieldLabelClass}>
            Jméno
          </label>
          <input
            id="skoleni-jmeno"
            required
            value={jmeno}
            onChange={(event) => setJmeno(event.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="skoleni-prijmeni" className={fieldLabelClass}>
            Příjmení
          </label>
          <input
            id="skoleni-prijmeni"
            required
            value={prijmeni}
            onChange={(event) => setPrijmeni(event.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="skoleni-email" className={fieldLabelClass}>
            E-mail
          </label>
          <input
            id="skoleni-email"
            type="email"
            value={eMail}
            onChange={(event) => setEMail(event.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="skoleni-poznamka" className={fieldLabelClass}>
            Poznámka
          </label>
          <textarea
            id="skoleni-poznamka"
            rows={3}
            value={poznamka}
            onChange={(event) => setPoznamka(event.target.value)}
            className={fieldClass}
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Zrušit
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? 'Ukládám…' : 'Přidat'}
          </button>
        </div>
      </form>
    </FormDialog>
  )
}

function PoznamkaModal({
  person,
  onClose,
  onSubmit,
}: {
  person: SkoleniUcastnik
  onClose: () => void
  onSubmit: (poznamka: string) => Promise<{ ok: true } | { ok: false; message: string }>
}) {
  const [poznamka, setPoznamka] = useState(person.poznamka)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const result = await onSubmit(poznamka)
      if (!result.ok) setError(result.message)
    } catch (submitError) {
      logger.error('Error updating skoleni poznamka:', submitError)
      setError('Poznámku se nepodařilo uložit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title="Změna poznámky"
      description={person.ucastnik.trim() || `Osoba ${person.poradi_osoba}`}
      onClose={onClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        <div>
          <label htmlFor="skoleni-edit-poznamka" className={fieldLabelClass}>
            Poznámka
          </label>
          <textarea
            id="skoleni-edit-poznamka"
            rows={4}
            value={poznamka}
            onChange={(event) => setPoznamka(event.target.value)}
            className={fieldClass}
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Zrušit
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? 'Ukládám…' : 'Uložit'}
          </button>
        </div>
      </form>
    </FormDialog>
  )
}

function ResendDotaznikModal({
  person,
  onClose,
  onSubmit,
}: {
  person: SkoleniUcastnik
  onClose: () => void
  onSubmit: (e_mail: string) => Promise<{ ok: true } | { ok: false; message: string }>
}) {
  const [eMail, setEMail] = useState(person.e_mail)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const result = await onSubmit(eMail.trim())
      if (!result.ok) setError(result.message)
    } catch (submitError) {
      logger.error('Error resending skoleni dotaznik:', submitError)
      setError('Dotazník se nepodařilo odeslat.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title="Odeslat dotazník"
      description={person.ucastnik.trim() || `Osoba ${person.poradi_osoba}`}
      onClose={onClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        <div>
          <label htmlFor="skoleni-resend-email" className={fieldLabelClass}>
            E-mail (nepovinný)
          </label>
          <input
            id="skoleni-resend-email"
            type="email"
            value={eMail}
            onChange={(event) => setEMail(event.target.value)}
            className={fieldClass}
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Zrušit
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? 'Odesílám…' : 'Odeslat'}
          </button>
        </div>
      </form>
    </FormDialog>
  )
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${linkFocus} break-all`}
    >
      <span className="text-gray-200 group-hover:text-white group-hover:underline transition-colors">
        {label}
      </span>
    </a>
  )
}

function UcastniciTable({
  loading,
  people,
  hasAny,
  hasFilters,
  savingUcast,
  onToggleUcast,
  onEditPoznamka,
  onResendDotaznik,
}: {
  loading: boolean
  people: SkoleniUcastnik[]
  hasAny: boolean
  hasFilters: boolean
  savingUcast: number | null
  onToggleUcast: (person: SkoleniUcastnik, next: boolean) => void
  onEditPoznamka: (person: SkoleniUcastnik) => void
  onResendDotaznik: (person: SkoleniUcastnik) => void
}) {
  if (loading) {
    return (
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 rounded-lg bg-gray-800/60 border border-gray-700/60 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!people.length) {
    return (
      <div className="mt-4 rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6 text-center text-gray-400">
        {hasAny && hasFilters
          ? 'Nebyly nalezeny žádné osoby odpovídající zadanému vyhledávání.'
          : 'Toto školení zatím nemá žádné evidované účastníky.'}
      </div>
    )
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Účastník
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">E-mail</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Poznámka</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Účast</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dotazník</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Odesláno</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Akce</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {people.map((person, index) => (
              <tr
                key={`${person.doklad}-${person.poradi_osoba}-${person.ucastnik}-${index}`}
                className="hover:bg-gray-800/60"
              >
                <td className="px-4 py-3 text-sm text-gray-200">{displayText(person.ucastnik)}</td>
                <td className="px-4 py-3 text-sm text-gray-200">
                  {person.e_mail ? (
                    <a href={`mailto:${person.e_mail}`} className={`${linkFocus} break-all`}>
                      <span className="text-gray-300 group-hover:text-gray-100 transition-colors">
                        {person.e_mail}
                      </span>
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-200">{displayText(person.poznamka)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                  <input
                    type="checkbox"
                    checked={isUcastPositive(person.ucast)}
                    disabled={savingUcast === person.poradi_osoba}
                    onChange={(event) => onToggleUcast(person, event.target.checked)}
                    aria-label={`Účast osoby ${person.ucastnik || person.poradi_osoba}`}
                    className="h-4 w-4 cursor-pointer rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-200">
                  <DotaznikCell person={person} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {person.odeslano ? (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${getOdeslanoBadgeClass(person.odeslano)}`}
                    >
                      {person.odeslano}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditPoznamka(person)}
                      className={smallBtn}
                    >
                      Upravit poznámku
                    </button>
                    <button
                      type="button"
                      onClick={() => onResendDotaznik(person)}
                      disabled={isDotaznikVyplneny(person.dotaznik)}
                      title={
                        isDotaznikVyplneny(person.dotaznik)
                          ? 'Dotazník už je vyplněný'
                          : 'Odeslat dotazník e-mailem'
                      }
                      className={smallBtn}
                    >
                      Odeslat dotazník
                    </button>
                  </div>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DotaznikCell({ person }: { person: SkoleniUcastnik }) {
  if (isDotaznikVyplneny(person.dotaznik)) {
    const badge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium bg-green-900/60 text-green-200 border-green-700 group-hover:border-green-500 group-hover:text-white transition-colors">
        Vyplněný
      </span>
    )

    if (person.odkaz_dotaznik) {
      return (
        <a
          href={person.odkaz_dotaznik}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkFocus}`}
          title="Otevřít vyplněný dotazník"
        >
          {badge}
        </a>
      )
    }

    return badge
  }

  if (person.odkaz_dotaznik) {
    return <DotaznikQrButton url={person.odkaz_dotaznik} label={person.ucastnik} />
  }

  return <span className="text-gray-500">Chybí dotazník</span>
}

function DotaznikQrButton({ url, label }: { url: string; label: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const caption = label.trim() || 'QR kód dotazníku'

  return (
    <button
      type="button"
      onClick={() => openQrPreviewWindow(wrapRef.current, caption)}
      className="inline-flex rounded-md bg-white p-1.5 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
      aria-label={`Zobrazit QR kód dotazníku${label.trim() ? ` pro ${label}` : ''}`}
      title="Otevřít QR kód v novém okně"
    >
      <span ref={wrapRef} className="inline-flex">
        <QRCodeSVG value={url} size={56} bgColor="#ffffff" fgColor="#111827" level="M" />
      </span>
    </button>
  )
}

function openQrPreviewWindow(source: HTMLElement | null, caption: string) {
  const svg = source?.querySelector('svg')
  if (!svg) return

  const clone = svg.cloneNode(true) as SVGElement
  clone.setAttribute('width', '640')
  clone.setAttribute('height', '640')
  clone.style.width = '640px'
  clone.style.height = '640px'

  const html = `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(caption)}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #111827; color: #e5e7eb; font-family: sans-serif; }
    .wrap { display: flex; flex-direction: column; align-items: center; padding: 40px; }
    .card { background: #fff; padding: 28px; border-radius: 16px; }
    p { margin: 32px 0 0; text-align: center; color: #f3f4f6; font-size: 42px; font-weight: 700;
      line-height: 1.25; max-width: 680px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">${clone.outerHTML}</div>
    <p>${escapeHtml(caption)}</p>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank', 'noopener,noreferrer,width=820,height=980')
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
