'use client'

import React, { useState, useEffect } from 'react'
import { Permission, Role, ROLE_PERMISSIONS } from '@/lib/permissions'
import PermissionGuard from '@/components/ui/PermissionGuard'

interface RolePermission {
  id: string
  role: Role
  permission: Permission
  createdAt: string
  updatedAt: string
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(Object.values(Role))
  const [selectedRole, setSelectedRole] = useState<Role>(Role.USER)
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadRolePermissions()
  }, [selectedRole])

  const loadRolePermissions = async () => {
    try {
      const response = await fetch(`/api/roles/${selectedRole}/permissions`)
      if (response.ok) {
        const data = await response.json()
        setRolePermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Error loading role permissions:', error)
    }
  }

  const handlePermissionToggle = async (permission: Permission, isChecked: boolean) => {
    setIsLoading(true)
    try {
      const method = isChecked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/roles/${selectedRole}/permissions`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission })
      })

      if (response.ok) {
        if (isChecked) {
          setRolePermissions(prev => prev.filter(p => p !== permission))
        } else {
          setRolePermissions(prev => [...prev, permission])
        }
        setMessage('Oprávnění úspěšně aktualizováno')
      } else {
        setMessage('Chyba při aktualizaci oprávnění')
      }
    } catch (error) {
      console.error('Error updating permission:', error)
      setMessage('Chyba při aktualizaci oprávnění')
    } finally {
      setIsLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const getPermissionName = (permission: Permission): string => {
    const names: Record<Permission, string> = {
      [Permission.DASHBOARD_VIEW]: 'Dashboard - Zobrazení',
      [Permission.DASHBOARD_STATS]: 'Dashboard - Statistiky',
      [Permission.PROJECTS_VIEW]: 'Projekty - Zobrazení',
      [Permission.PROJECTS_CREATE]: 'Projekty - Vytvoření',
      [Permission.PROJECTS_EDIT]: 'Projekty - Editace',
      [Permission.PROJECTS_DELETE]: 'Projekty - Smazání',
      [Permission.PROJECTS_EXPORT]: 'Projekty - Export',
      [Permission.USERS_VIEW]: 'Uživatelé - Zobrazení',
      [Permission.USERS_CREATE]: 'Uživatelé - Vytvoření',
      [Permission.USERS_EDIT]: 'Uživatelé - Editace',
      [Permission.USERS_DELETE]: 'Uživatelé - Smazání',
      [Permission.USERS_MANAGE_ROLES]: 'Uživatelé - Správa rolí',
      [Permission.CHARTS_VIEW]: 'Grafy - Zobrazení',
      [Permission.CHARTS_CREATE]: 'Grafy - Vytvoření',
      [Permission.CHARTS_EDIT]: 'Grafy - Editace',
      [Permission.REPORTS_GENERATE]: 'Reporty - Generování',
      [Permission.REPORTS_EXPORT]: 'Reporty - Export',
      [Permission.MAP_VIEW]: 'Mapa - Zobrazení',
      [Permission.MAP_EDIT]: 'Mapa - Editace',
      [Permission.MAP_MANAGE]: 'Mapa - Správa',
      [Permission.CALENDAR_VIEW]: 'Kalendář - Zobrazení',
      [Permission.CALENDAR_CREATE]: 'Kalendář - Vytvoření',
      [Permission.CALENDAR_EDIT]: 'Kalendář - Editace',
      [Permission.CALENDAR_DELETE]: 'Kalendář - Smazání',
      [Permission.SETTINGS_VIEW]: 'Nastavení - Zobrazení',
      [Permission.SETTINGS_EDIT]: 'Nastavení - Editace',
      [Permission.SETTINGS_SYSTEM]: 'Nastavení - Systémové',
      [Permission.API_ACCESS]: 'API - Přístup',
      [Permission.API_ADMIN]: 'API - Administrace',
      [Permission.HWSW_VIEW]: 'HW/SW - Zobrazení',
      [Permission.HWSW_CREATE]: 'HW/SW - Vytvoření',
      [Permission.HWSW_EDIT]: 'HW/SW - Editace',
      [Permission.HWSW_DELETE]: 'HW/SW - Smazání',
    }
    return names[permission] || permission
  }

  const getRoleName = (role: Role): string => {
    const names: Record<Role, string> = {
      [Role.USER]: 'Uživatel',
      [Role.ADMIN]: 'Administrátor',
      [Role.MANAGER]: 'Manažer',
      [Role.VIEWER]: 'Divák',
      [Role.IT]: 'IT',
    }
    return names[role] || role
  }

  const getRoleColor = (role: Role): string => {
    const colors: Record<Role, string> = {
      [Role.USER]: 'bg-gray-100 text-gray-800',
      [Role.ADMIN]: 'bg-purple-100 text-purple-800',
      [Role.MANAGER]: 'bg-blue-100 text-blue-800',
      [Role.VIEWER]: 'bg-green-100 text-green-800',
      [Role.IT]: 'bg-orange-100 text-orange-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <PermissionGuard roles={[Role.ADMIN]} fallback={<div className="p-8 text-center">Přístup odepřen</div>}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Správa rolí a oprávnění</h1>
          <p className="text-gray-600">Definujte oprávnění pro jednotlivé role v systému</p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-md bg-green-50 text-green-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Výběr role */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Výběr role</h2>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedRole === role
                      ? `${getRoleColor(role)} border-2 border-blue-500`
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{getRoleName(role)}</div>
                  <div className="text-sm opacity-75">{role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Oprávnění role */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">
              Oprávnění pro: {getRoleName(selectedRole)}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(Permission).map((permission) => {
                const isChecked = rolePermissions.includes(permission)
                const isDefaultPermission = ROLE_PERMISSIONS[selectedRole]?.includes(permission)
                
                return (
                  <div
                    key={permission}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={permission}
                      checked={isChecked}
                      onChange={(e) => handlePermissionToggle(permission, e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={permission}
                      className="flex-1 text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      <div className="font-semibold">{getPermissionName(permission)}</div>
                      <div className="text-xs text-gray-500">{permission}</div>
                      {isDefaultPermission && !isChecked && (
                        <div className="text-xs text-orange-600">Výchozí oprávnění</div>
                      )}
                    </label>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Souhrn oprávnění</h3>
              <div className="text-sm text-blue-800">
                <p><strong>Celkem oprávnění:</strong> {rolePermissions.length}</p>
                <p><strong>Výchozí oprávnění:</strong> {ROLE_PERMISSIONS[selectedRole]?.length || 0}</p>
                <p><strong>Vlastní oprávnění:</strong> {rolePermissions.length - (ROLE_PERMISSIONS[selectedRole]?.length || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
