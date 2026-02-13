export interface Database {
  projekt: string
  id_firmy: string
  databaze: string
  velikost: number
  velikost_volne: number
  velikost_max: number
  velikost_max_volne: number
  velikost_max_volne_proc: number
  volne_zbyva_dni: number
  velikost_log: number
  velikost_log_volne: number
  velikost_log_max: number
  compatibility_level: number
  recovery_model: string
  collation_name: string
  delayed_durability: string
  firma_nazev: string
  verze: string
  projekt_nazev: string
  backup_full: string
  backup_inc: string
  denni_narust_mb: number
}
