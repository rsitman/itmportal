/**
 * Project Management System Types
 * 
 * This defines the data model for comprehensive project management
 * including people, components, hardware tracking, and configurations.
 */

// Service project from IS KARAT /web/projects endpoint
export interface ServiceProject {
  doklad_proj: string
  nazev: string
  jira_klic: string
  nazev_par: string
  gps: string
  logo?: string // Base64 encoded logo data from ERP
}

// Patch module from IS KARAT /web/patchovani/{projekt}/firma/{id_firmy}/moduly endpoint
export interface PatchModule {
  id_modulu: string
  nazev: string
  verze: string
  posl_patch_40: string
  posl_patch_36: string
  max_patch_40: string
  max_patch_36: string
  stat: string
}

// Core project entity
export interface Project {
  id: string
  projectId: string // KARAT project ID
  projectName: string
  companyId: string // KARAT company ID
  companyName: string
  
  // Project metadata
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SUSPENDED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  startDate: Date
  endDate?: Date
  
  // Technical details
  version: string
  country: string
  accountManager?: string
  jiraKey?: string
  
  // Patch management (synced with KARAT)
  hasPayrollModule: boolean
  hasServicePatch: boolean
  hasNewPatch: boolean
  hasNewLegalPatch: boolean
  lastInstalledPatchDate?: Date
  nextPlannedPatchDate?: Date
  
  // System timestamps
  createdAt: Date
  updatedAt: Date
  lastSyncAt?: Date // Last sync with KARAT
}

// Project team members
export interface ProjectMember {
  id: string
  projectId: string
  userId: string // Reference to User table
  role: 'PROJECT_MANAGER' | 'DEVELOPER' | 'CONSULTANT' | 'SUPPORT' | 'ADMIN'
  isPrimary: boolean
  startDate: Date
  endDate?: Date
  hourlyRate?: number
  notes?: string
  
  // Relations
  user?: User
  project?: Project
}

// Project components/modules
export interface ProjectComponent {
  id: string
  projectId: string
  name: string
  type: 'MODULE' | 'ADDON' | 'INTEGRATION' | 'CUSTOMIZATION'
  version: string
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED' | 'PLANNED'
  description?: string
  installationDate?: Date
  lastUpdateDate?: Date
  
  // Technical details
  dependencies?: string[] // Component IDs
  configuration?: Record<string, any>
  
  // Relations
  project?: Project
}

// Hardware resources tracking
export interface HardwareResource {
  id: string
  projectId: string
  name: string
  type: 'SERVER' | 'DATABASE' | 'WORKSTATION' | 'NETWORK' | 'STORAGE' | 'BACKUP'
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED'
  
  // Hardware specifications
  manufacturer?: string
  model?: string
  serialNumber?: string
  ipAddress?: string
  operatingSystem?: string
  cpu?: string
  ram?: string
  storage?: string
  
  // Location and ownership
  location?: string
  owner?: string
  purchaseDate?: Date
  warrantyExpiry?: Date
  
  // Relations
  project?: Project
}

// Hardware configurations
export interface HardwareConfiguration {
  id: string
  hardwareId: string
  name: string
  type: 'NETWORK' | 'SOFTWARE' | 'SECURITY' | 'PERFORMANCE' | 'BACKUP'
  configuration: Record<string, any> // JSON configuration data
  isActive: boolean
  version: string
  appliedDate?: Date
  notes?: string
  
  // Relations
  hardware?: HardwareResource
}

// Project milestones and tasks
export interface ProjectMilestone {
  id: string
  projectId: string
  title: string
  description?: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  plannedDate?: Date
  completedDate?: Date
  assignedTo?: string // User ID
  
  // Relations
  project?: Project
  assignee?: User
}

// Project documents and files
export interface ProjectDocument {
  id: string
  projectId: string
  name: string
  type: 'CONTRACT' | 'TECHNICAL' | 'USER_MANUAL' | 'INVOICE' | 'OTHER'
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedBy: string // User ID
  uploadedAt: Date
  
  // Relations
  project?: Project
  uploader?: User
}

// Define User interface locally since it's used in multiple contexts
export interface User {
  id: string
  email: string
  name?: string
  externalId?: string
  authProvider: 'LOCAL' | 'AZURE_AD'
  image?: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// External component from ERP /web/projects/{doklad_projektu}/extcomps endpoint
export interface ExternalComponent {
  kod: string               // Kód komponenty
  nazev: string             // Název komponenty
  popis: string             // Popis komponenty
  forma_kom: string         // Forma komponenty
  dodavatel: string         // Dodavatel
  jmeno: string             // Jméno kontaktní osoby
  prijmeni: string         // Příjmení kontaktní osoby
  telefon?: string           // Telefon
  email?: string             // Email
}

// Project person from ERP /web/projects/{doklad_projektu}/pers endpoint
export interface ProjectPerson {
  kod_role: string           // Kód role (ZAK_INV, ITMAN, atd.)
  nazev_role: string         // Název role (Objednatel, IT manažer, atd.)
  typ_osoby: number         // Typ osoby (0=vlastní, 10=externí, 20=zákazník)
  jmeno: string             // Jméno osoby
  prijmeni: string         // Příjmení osoby
  telefon?: string           // Telefon
  email?: string             // Email
}

// Project role types
export enum ProjectRole {
  ZAK_INV = 'ZAK_INV',      // Objednatel - sponzor projektu
  ITMAN = 'ITMAN',          // IT manažer
  DEV = 'DEV',               // Vývojář
  KON = 'KON',               // Konzultant
  TEST = 'TEST',             // Tester
  SUP = 'SUP'                // Support
}

// Person types
export enum PersonType {
  INTERNAL = 0,    // Vlastní osoba (ITMAN)
  EXTERNAL = 10,    // Externí osoba dodavatele
  CUSTOMER = 20,    // Osoba zákazníka
}
