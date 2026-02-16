'use client'

import React, { useState } from 'react'

interface HardwareItem {
  id: string
  name: string
  type: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  warrantyExpiry?: string
  location?: string
  assignedTo?: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired'
  ipAddress?: string
  macAddress?: string
  osVersion?: string
  specifications?: Record<string, any>
  projectId?: string
  projectName?: string
  notes?: string
}

interface SoftwareItem {
  id: string
  name: string
  version: string
  vendor?: string
  licenseKey?: string
  licenseExpiry?: string
  installationDate?: string
  installedOn?: string[]
  category?: string
  type?: string
  status: 'active' | 'expired' | 'trial' | 'deactivated'
  seats?: number
  usedSeats?: number
  projectId?: string
  projectName?: string
  notes?: string
}

export default function HardwareSoftwareConfig() {
  const [activeTab, setActiveTab] = useState<'hardware' | 'software'>('hardware')
  const [hardware, setHardware] = useState<HardwareItem[]>([])
  const [software, setSoftware] = useState<SoftwareItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<HardwareItem | SoftwareItem | null>(null)

  // Načítání dat z ERP
  React.useEffect(() => {
    const loadHardwareData = async () => {
      try {
        const response = await fetch('/api/hwsw/hardware')
        if (response.ok) {
          const data = await response.json()
          setHardware(data.hardware || [])
        }
      } catch (error) {
        // console.error('Error loading hardware:', error)
        setHardware([])
      }
    }

    const loadSoftwareData = async () => {
      try {
        const response = await fetch('/api/hwsw/software')
        if (response.ok) {
          const data = await response.json()
          setSoftware(data.software || [])
        }
      } catch (error) {
        // console.error('Error loading software:', error)
        setSoftware([])
      }
    }

    loadHardwareData()
    loadSoftwareData()
  }, [])

  const filteredHardware = hardware.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSoftware = software.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.installedOn && item.installedOn.some(inst => inst.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      trial: 'bg-blue-100 text-green-800',
      deactivated: 'bg-purple-100 text-purple-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      active: 'Aktivní',
      inactive: 'Neaktivní',
      maintenance: 'V údržbě',
      retired: 'Vyřazený',
      expired: 'Vypršel',
      trial: 'Zkušební',
      deactivated: 'Deaktivován'
    }
    return texts[status] || status
  }

  return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">HW/SW Konfigurace</h1>
          <p className="text-gray-600">Správa hardwaru a softwaru ve společnosti</p>
        </div>

        {/* Vyhledávání */}
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Hledat hardware nebo software..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                + Přidat položku
              </button>
          </div>
        </div>

        {/* Tab switching */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('hardware')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hardware'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Hardware ({filteredHardware.length})
            </button>
            <button
              onClick={() => setActiveTab('software')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'software'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Software ({filteredSoftware.length})
            </button>
          </nav>
        </div>

        {/* Hardware tab */}
        {activeTab === 'hardware' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHardware.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div><strong>Typ:</strong> {item.type}</div>
                  <div><strong>Výrobce:</strong> {item.manufacturer}</div>
                  <div><strong>Model:</strong> {item.model}</div>
                  <div><strong>Sériové číslo:</strong> {item.serialNumber}</div>
                  <div><strong>Umístění:</strong> {item.location}</div>
                  <div><strong>Přiděleno:</strong> {item.assignedTo}</div>
                  <div><strong>Záruka do:</strong> {item.warrantyExpiry}</div>
                </div>

                {item.specifications && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Specifikace</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(item.specifications).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                    <strong>Poznámky:</strong> {item.notes}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Upravit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Smazat
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Software tab */}
        {activeTab === 'software' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSoftware.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div><strong>Verze:</strong> {item.version}</div>
                  <div><strong>Kategorie:</strong> {item.category}</div>
                  <div><strong>Dodavatel:</strong> {item.vendor}</div>
                  <div><strong>Instalováno:</strong> {
                    Array.isArray(item.installedOn) 
                      ? item.installedOn.join(', ') 
                      : item.installedOn || 'Není instalováno'
                  }</div>
                  <div><strong>Datum instalace:</strong> {item.installationDate}</div>
                  <div><strong>Licence do:</strong> {item.licenseExpiry}</div>
                </div>

                {item.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                    <strong>Poznámky:</strong> {item.notes}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Upravit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Smazat
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Upravit položku' : 'Přidat novou položku'}
              </h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Název
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingItem && 'name' in editingItem ? editingItem.name : ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Typ
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingItem(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {editingItem ? 'Uložit změny' : 'Přidat'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  )
}
