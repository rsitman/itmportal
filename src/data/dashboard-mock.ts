/**
 * Mock data pro intranetový dashboard.
 * Později nahradit voláním API.
 */

import { DASHBOARD_LINKS } from '@/config/dashboard-links'
import type {
  StatusZprava,
  PolozkaAplikace,
  PolozkaMojePrace,
  PolozkaProvozniInformace,
  PolozkaDokumentyANavody,
} from '@/types/dashboard'

const { aplikace, mojePrace } = DASHBOARD_LINKS

export const mockStatusZpravy: StatusZprava[] = [
  {
    id: '1',
    text: 'Portál běží v normálním režimu.',
    typ: 'success',
    datum: new Date().toISOString().slice(0, 10),
  },
  {
    id: '2',
    text: 'Plánovaná údržba KARAT: neděle 02:00–06:00.',
    typ: 'info',
    datum: new Date().toISOString().slice(0, 10),
  },
]

export const mockAplikace: PolozkaAplikace[] = [
  { id: '1', nazev: 'Servisní portál', popis: 'Hlavní stránka a přehled portálu', href: aplikace.servisniPortal, ikona: 'LayoutDashboard' },
  { id: '2', nazev: 'Projekty', popis: 'Evidence projektů a patchování', href: aplikace.projekty, ikona: 'FolderTree' },
  { id: '3', nazev: 'KARAT', popis: 'ERP systém – objednávky a evidence', href: aplikace.karat || '#', external: true, badge: 'externi', ikona: 'Package' },
  { id: '4', nazev: 'SharePoint', popis: 'Týmové weby a spolupráce', href: aplikace.sharepoint || '#', external: true, badge: 'nove_okno', ikona: 'Share2' },
  { id: '5', nazev: 'Dokumentový SharePoint', popis: 'Dokumenty a úložiště', href: aplikace.sharepointDokumenty || '#', external: true, badge: 'nove_okno', ikona: 'FileText' },
  { id: '6', nazev: 'Firemní web', popis: 'Veřejné stránky společnosti', href: aplikace.firemniWeb || '#', external: true, badge: 'externi', ikona: 'Globe' },
  { id: '7', nazev: 'Helpdesk', popis: 'Požadavky a sledování ticketů', href: aplikace.helpdesk || '#', external: true, badge: 'externi', ikona: 'Headphones' },
  { id: '8', nazev: 'Znalostní báze', popis: 'Návody a časté dotazy', href: aplikace.znalostniBaze || '#', external: true, ikona: 'BookOpen' },
  { id: '9', nazev: 'Kontakty', popis: 'Osoby ITMAN a kontakty', href: aplikace.kontakty, ikona: 'Users' },
]

export const mockMojePrace: PolozkaMojePrace[] = [
  { id: '1', nazev: 'Moje otevřené úkoly', href: mojePrace.planPatchovani, popis: 'Úkoly z přehledu patchování', pocet: 0 },
  { id: '2', nazev: 'Čeká na schválení', href: mojePrace.evidenceProjektu, popis: 'Položky čekající na vaše schválení', pocet: 0 },
  { id: '3', nazev: 'Dnešní termíny', href: mojePrace.kalendar, popis: 'Kalendář událostí', pocet: 0 },
  { id: '4', nazev: 'Nedávná aktivita', href: mojePrace.evidenceProjektu, popis: 'Poslední změny v projektech' },
]

export const mockProvozniInformace: PolozkaProvozniInformace[] = [
  { id: '1', typ: 'odstavky', nadpis: 'Žádné plánované odstávky', text: 'V nejbližších dnech nejsou plánované odstávky.', datum: new Date().toISOString().slice(0, 10) },
  { id: '2', typ: 'oznameni', nadpis: 'Nový intranetový dashboard', text: 'Úvodní stránka portálu byla aktualizována.', href: '/dashboard', datum: new Date().toISOString().slice(0, 10) },
  { id: '3', typ: 'novinky', nadpis: 'Novinky v portálu', text: 'Sekce Aplikace a systémy slouží jako rozcestník.', datum: new Date().toISOString().slice(0, 10) },
  { id: '4', typ: 'zmeny_procesu', nadpis: 'Změny procesů', text: 'Aktuální procesy jsou popsány v dokumentaci.', href: '#' },
]

export const mockDokumentyANavody: PolozkaDokumentyANavody[] = [
  { id: '1', nazev: 'Poslední dokumenty', href: '#', kategorie: 'dokument', datum: new Date().toISOString().slice(0, 10) },
  { id: '2', nazev: 'Nejčastější návody', href: '#', kategorie: 'navod' },
  { id: '3', nazev: 'Šablony', href: '#', kategorie: 'sablona' },
]
