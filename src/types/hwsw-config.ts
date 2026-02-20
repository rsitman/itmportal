export interface FirewallAccess {
  ip_adresa: string
  id_firmy: string
  popis: string
}

export interface DomainUser {
  login: string
  domena: string
  username: string
  heslo: string
  poznamka: string
}

export interface EmailSettings {
  id_firmy: string
  ip_adresa: string
  port: number
  login: string
  heslo: string
  poznamka: string
}

export interface ExternalService {
  nazev: string
  popis: string
  poznamka: string
}

export interface ServerService {
  poradi: number
  kod: string
  typ: string
  nazev: string
  popis: string
  poznamka: string
  verze: string
  typ_uctu: string
  login: string
  heslo: string
  sql_instance: string
}

export interface Server {
  server_id: number
  id_firmy: string
  server_typ: string
  nazev: string
  popis: string
  ip_adresa: string
  maska: string
  brana: string
  dns: string
  os_app: string
  os_lic: string
  poznamka: string
  sluzby: ServerService[]
}

export interface HwswConfig {
  fw_pristupy: FirewallAccess[]
  dom_users: DomainUser[]
  set_send_mail: EmailSettings[]
  ext_sluzby: ExternalService[]
  servery: Server[]
}
