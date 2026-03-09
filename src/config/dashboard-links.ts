/**
 * Konfigurace odkazů pro dashboard.
 * Externí URL lze přesunout do env (NEXT_PUBLIC_*), zatím placeholder kde není finální URL.
 */

export const DASHBOARD_LINKS = {
  /** Odkazy na aplikace/systémy – hodnoty lze nahradit env proměnnými */
  aplikace: {
    servisniPortal: '/dashboard',
    projekty: '/evidence-projektu',
    karat: process.env.NEXT_PUBLIC_KARAT_URL ?? '', // placeholder – doplnit env
    sharepoint: process.env.NEXT_PUBLIC_SHAREPOINT_URL ?? '', // placeholder
    sharepointDokumenty: process.env.NEXT_PUBLIC_SHAREPOINT_DOCS_URL ?? '', // placeholder
    firemniWeb: process.env.NEXT_PUBLIC_FIRMNI_WEB_URL ?? '', // placeholder
    helpdesk: process.env.NEXT_PUBLIC_HELPDESK_URL ?? '', // placeholder
    znalostniBaze: process.env.NEXT_PUBLIC_ZNALOSTNI_BAZE_URL ?? '', // placeholder
    kontakty: '/osoby-itman',
  },
  /** Interní routy portálu pro Moje práce */
  mojePrace: {
    planPatchovani: '/plan_patchovani',
    kalendar: '/calendar',
    evidenceProjektu: '/evidence-projektu',
    mapa: '/dashboard/mapa',
    databaze: '/databases',
    uzivatele: '/users',
  },
} as const
