export type FieldType = 'string' | 'number' | 'date' | 'enum' | 'boolean' | 'group' | 'actions'

export interface MetaField {
  id: string
  label: string
  type: FieldType
  optional?: boolean
  enumValues?: string[]
  fields?: MetaField[] // For group type
}

export interface MetaResource {
  id: string
  label: string
  fields: MetaField[]
}
