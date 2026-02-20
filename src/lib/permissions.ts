// Systém uživatelských práv a rolí

export enum Permission {
  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_STATS = 'dashboard:stats',
  
  // Projekty
  PROJECTS_VIEW = 'projects:view',
  PROJECTS_CREATE = 'projects:create',
  PROJECTS_EDIT = 'projects:edit',
  PROJECTS_DELETE = 'projects:delete',
  PROJECTS_EXPORT = 'projects:export',
  
  // Uživatelé
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE_ROLES = 'users:manage_roles',
  
  // Grafy a reporty
  CHARTS_VIEW = 'charts:view',
  CHARTS_CREATE = 'charts:create',
  CHARTS_EDIT = 'charts:edit',
  REPORTS_GENERATE = 'reports:generate',
  REPORTS_EXPORT = 'reports:export',
  
  // Mapa poboček
  MAP_VIEW = 'map:view',
  MAP_EDIT = 'map:edit',
  MAP_MANAGE = 'map:manage',
  
  // Kalendář
  CALENDAR_VIEW = 'calendar:view',
  CALENDAR_CREATE = 'calendar:create',
  CALENDAR_EDIT = 'calendar:edit',
  CALENDAR_DELETE = 'calendar:delete',
  CALENDAR_ERP_EDIT = 'calendar:erp_edit',    // Editace ERP událostí
  CALENDAR_ERP_DELETE = 'calendar:erp_delete',  // Mazání ERP událostí
  CALENDAR_ERP_SYNC = 'calendar:erp_sync',     // Synchronizace ERP
  
  // Nastavení
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  SETTINGS_SYSTEM = 'settings:system',
  
  // API
  API_ACCESS = 'api:access',
  API_ADMIN = 'api:admin',
  
  // HW/SW Konfigurace
  HWSW_VIEW = 'hwsw:view',
  HWSW_CREATE = 'hwsw:create',
  HWSW_EDIT = 'hwsw:edit',
  HWSW_DELETE = 'hwsw:delete',
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
  IT = 'IT'
}

// Mapování rolí na oprávnění
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.DASHBOARD_VIEW,
    Permission.PROJECTS_VIEW,
    Permission.CHARTS_VIEW,
    Permission.MAP_VIEW,
    Permission.CALENDAR_VIEW,
    Permission.CALENDAR_ERP_SYNC, // Dočasně povoleno pro testování
    Permission.SETTINGS_VIEW,
  ],
  
  [Role.VIEWER]: [
    Permission.DASHBOARD_VIEW,
    Permission.PROJECTS_VIEW,
    Permission.CHARTS_VIEW,
    Permission.MAP_VIEW,
    Permission.CALENDAR_VIEW,
  ],
  
  [Role.MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_STATS,
    Permission.PROJECTS_VIEW,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_EDIT,
    Permission.PROJECTS_EXPORT,
    Permission.CHARTS_VIEW,
    Permission.CHARTS_CREATE,
    Permission.CHARTS_EDIT,
    Permission.REPORTS_GENERATE,
    Permission.REPORTS_EXPORT,
    Permission.MAP_VIEW,
    Permission.MAP_EDIT,
    Permission.CALENDAR_VIEW,
    Permission.CALENDAR_CREATE,
    Permission.CALENDAR_EDIT,
    Permission.CALENDAR_ERP_EDIT, // Omezený přístup k ERP
    Permission.USERS_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],
  
  [Role.ADMIN]: Object.values(Permission), // Admin má všechna oprávnění
  
  [Role.IT]: [
    Permission.DASHBOARD_VIEW,
    Permission.PROJECTS_VIEW,
    Permission.CHARTS_VIEW,
    Permission.MAP_VIEW,
    Permission.CALENDAR_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.HWSW_VIEW,
    Permission.HWSW_CREATE,
    Permission.HWSW_EDIT,
    Permission.HWSW_DELETE,
    Permission.CALENDAR_ERP_EDIT,
    Permission.CALENDAR_ERP_DELETE,
    Permission.CALENDAR_ERP_SYNC,
  ],
}

// Helper funkce pro kontrolu oprávnění
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(permission)
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Middleware helper
export function requirePermission(permission: Permission) {
  return (userRole: Role) => hasPermission(userRole, permission)
}

export function requireAnyPermission(permissions: Permission[]) {
  return (userRole: Role) => hasAnyPermission(userRole, permissions)
}

// Typy pro TypeScript
export interface UserWithPermissions {
  id: string
  email: string
  name: string
  role: Role
  permissions: Permission[]
}

export function getUserPermissions(userRole: Role): Permission[] {
  return ROLE_PERMISSIONS[userRole] || []
}

// Funkce pro kontrolu přístupu k tabulkám a akcím
export interface TablePermission {
  canRead: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
}

export function getTablePermissions(userRole: Role, table: 'projects' | 'users' | 'charts' | 'calendar' | 'map'): TablePermission {
  const permissions = getUserPermissions(userRole)
  
  const basePermissions = {
    canRead: permissions.includes(`${table}:view` as Permission),
    canCreate: permissions.includes(`${table}:create` as Permission),
    canEdit: permissions.includes(`${table}:edit` as Permission),
    canDelete: permissions.includes(`${table}:delete` as Permission),
    canExport: permissions.includes(`${table}:export` as Permission),
  }
  
  return basePermissions
}
