'use client'

import React, { useState } from 'react'

interface User {
  id: string
  email: string
  name?: string
  externalId?: string
  authProvider: 'LOCAL' | 'AZURE_AD'
  image?: string
  role: 'ADMIN' | 'USER' | 'IT'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function RoleBadge({ role }: { role: 'ADMIN' | 'USER' | 'IT' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        role === 'ADMIN'
          ? 'bg-purple-900/50 text-purple-200 border border-purple-800'
          : role === 'IT'
          ? 'bg-orange-900/50 text-orange-200 border border-orange-800'
          : 'bg-gray-900/50 text-gray-200 border border-gray-800'
      }`}
    >
      {role === 'ADMIN' ? '👑 Admin' : role === 'IT' ? '🔧 IT' : '👤 User'}
    </span>
  )
}

function AuthProviderBadge({ provider }: { provider: 'LOCAL' | 'AZURE_AD' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        provider === 'AZURE_AD'
          ? 'bg-blue-900/50 text-green-200 border border-green-800'
          : 'bg-green-900/50 text-green-200 border border-green-800'
      }`}
    >
      {provider === 'AZURE_AD' ? '🔵 MS Entra' : '🔘 Lokální'}
    </span>
  )
}

function StatusToggle({ 
  userId, 
  currentStatus, 
  onToggle 
}: { 
  userId: string
  currentStatus: boolean
  onToggle: (userId: string, updates: Partial<User>) => void 
}) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    setIsLoading(true)
    const newStatus = !currentStatus
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })
      
      if (response.ok) {
        onToggle(userId, { isActive: newStatus })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update status')
      }
    } catch (error) {
      alert('Failed to update status')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        currentStatus ? 'bg-green-600' : 'bg-red-600'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          currentStatus ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <span className="sr-only">
        {currentStatus ? 'Aktivní' : 'Deaktivovaný'}
      </span>
    </button>
  )
}

function CreateUserModal({ 
  isOpen, 
  onClose, 
  onUserCreated 
}: { 
  isOpen: boolean
  onClose: () => void
  onUserCreated: (user: User) => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER' | 'IT',
    authProvider: 'LOCAL' as 'LOCAL' | 'AZURE_AD'
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newUser = await response.json()
        onUserCreated(newUser)
        onClose()
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          authProvider: 'LOCAL'
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create user')
      }
    } catch (error) {
      alert('Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Nový uživatel</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jméno
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ účtu
            </label>
            <select
              value={formData.authProvider}
              onChange={(e) => setFormData({ ...formData, authProvider: e.target.value as 'LOCAL' | 'AZURE_AD' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOCAL">Lokální</option>
              <option value="AZURE_AD">Microsoft Entra ID</option>
            </select>
          </div>
          
          {formData.authProvider === 'LOCAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heslo
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' | 'IT' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USER">User</option>
              <option value="IT">IT</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Vytvářím...' : 'Vytvořit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UserDetailModal({ 
  user, 
  isOpen, 
  onClose, 
  onUpdate 
}: { 
  user: User | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (userId: string, updates: Partial<User>) => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'USER' as 'ADMIN' | 'USER' | 'IT',
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        role: user.role,
        isActive: user.isActive
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onUpdate(user.id, formData)
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update user')
      }
    } catch (error) {
      alert('Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Detail uživatele</h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center mb-2">
            {user.image ? (
              <img
                className="h-12 w-12 rounded-full mr-3"
                src={user.image}
                alt={user.name || user.email}
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                <span className="text-lg font-medium text-gray-700">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium">{user.name || '—'}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <div>Typ: <AuthProviderBadge provider={user.authProvider} /></div>
            <div>Vytvořen: {new Date(user.createdAt).toLocaleDateString('cs-CZ')}</div>
            <div>Aktualizován: {new Date(user.updatedAt).toLocaleDateString('cs-CZ')}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jméno
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' | 'IT' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USER">User</option>
              <option value="IT">IT</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Aktivní účet
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName 
}: { 
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName: string 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Potvrdit smazání</h2>
        <p className="text-gray-600 mb-6">
          Opravdu chcete smazat uživatele <strong>{userName}</strong>? Tato akce je nevratná.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Zrušit
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Smazat
          </button>
        </div>
      </div>
    </div>
  )
}

function UsersTable({ users, onUserUpdate, onUserDelete, onUserClick }: { 
  users: User[]
  onUserUpdate: (userId: string, updates: Partial<User>) => void 
  onUserDelete: (userId: string) => void 
  onUserClick: (user: User) => void 
}) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse divide-y divide-gray-200">
        <thead className="bg-gray-800/50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wide border-b border-gray-600">
              Uživatel
            </th>
            <th scope="col" className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wide border-b border-gray-600">
              Role
            </th>
            <th scope="col" className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wide border-b border-gray-600">
              Zdroj
            </th>
            <th scope="col" className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wide border-b border-gray-600">
              Stav
            </th>
            <th scope="col" className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wide border-b border-gray-600">
              Akce
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900/30">
          {users.map((user) => (
            <tr 
              key={user.id} 
              className={`hover:bg-gray-700/50 border-b border-gray-200 cursor-pointer ${
                user.authProvider === 'AZURE_AD' ? 'bg-blue-900/20' : ''
              }`}
              onClick={() => onUserClick(user)}
            >
              <td className="px-6 py-4 border-r border-gray-100">
                <div className="flex items-center">
                  {user.image ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.image}
                      alt={user.name || user.email}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-100">
                      {user.name || '—'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="w-24 px-6 py-4 border-r border-gray-100">
                <RoleBadge role={user.role} />
              </td>
              <td className="w-32 px-6 py-4 border-r border-gray-100">
                <AuthProviderBadge provider={user.authProvider} />
              </td>
              <td className="w-32 px-6 py-4 text-center border-r border-gray-100">
                <div className="flex flex-col items-center space-y-2">
                  <StatusToggle
                    userId={user.id}
                    currentStatus={user.isActive}
                    onToggle={onUserUpdate}
                  />
                  <span className="text-xs text-gray-400">
                    {user.isActive ? 'Aktivní' : 'Deaktivovaný'}
                  </span>
                </div>
              </td>
              <td className="w-32 px-6 py-4 text-center">
                <button
                  onClick={() => onUserDelete(user.id)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Smazat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function UsersClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean
    userId: string | null
    userName: string
  }>({ isOpen: false, userId: null, userName: '' })
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean
    user: User | null
  }>({ isOpen: false, user: null })

  const handleUserUpdate = (userId: string, updates: Partial<User>) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, ...updates } : user
      )
    )
  }

  const handleUserDelete = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setDeleteModalState({
        isOpen: true,
        userId,
        userName: user.name || user.email
      })
    }
  }

  const handleUserClick = (user: User) => {
    setDetailModalState({
      isOpen: true,
      user
    })
  }

  const confirmDelete = async () => {
    if (!deleteModalState.userId) return

    try {
      const response = await fetch(`/api/users/${deleteModalState.userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== deleteModalState.userId))
        setDeleteModalState({ isOpen: false, userId: null, userName: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete user')
      }
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  return (
    <div className="py-4 px-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-100">
          Seznam uživatelů ({users.length})
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Nový uživatel
        </button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-100">
              Žádní uživatelé
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              V systému nebyli nalezeni žádní uživatelé.
            </p>
          </div>
        </div>
      ) : (
        <UsersTable 
          users={users} 
          onUserUpdate={handleUserUpdate}
          onUserDelete={handleUserDelete}
          onUserClick={handleUserClick}
        />
      )}

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={(newUser) => setUsers(prev => [...prev, newUser])}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, userId: null, userName: '' })}
        onConfirm={confirmDelete}
        userName={deleteModalState.userName}
      />

      <UserDetailModal
        user={detailModalState.user}
        isOpen={detailModalState.isOpen}
        onClose={() => setDetailModalState({ isOpen: false, user: null })}
        onUpdate={handleUserUpdate}
      />
    </div>
  )
}
