'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AddPCModal from './AddPCModal'
import PCDetailModal from './PCDetailModal'

interface PC {
  id: number
  sn: string
  pin: string
  descr?: string
  garant: string
  block: boolean
  documentPath: string
  createdAt: string
}

interface SortConfig {
  field: string
  order: 'asc' | 'desc'
}

export default function PCList() {
  const [pcs, setPcs] = useState<PC[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedPC, setSelectedPC] = useState<PC | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', order: 'desc' })
  const router = useRouter()

  const fetchPCs = async () => {
    try {
      const params = new URLSearchParams({
        search,
        sortBy: sort.field,
        sortOrder: sort.order,
        status,
      })
      const response = await fetch(`/api/pc?${params}`)
      const data = await response.json()
      setPcs(data.error ? [] : data)
    } catch (error) {
      setPcs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPCs()
  }, [search, sort.field, sort.order, status])

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }))
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    if (window.confirm('Are you sure you want to delete this PC?')) {
      try {
        const response = await fetch(`/api/pc?id=${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          fetchPCs()
        } else {
          const data = await response.json()
          alert(data.error || 'Error deleting PC')
        }
      } catch (error) {
        alert('Error deleting PC')
      }
    }
  }

  const handleEdit = (pc: PC, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    setSelectedPC(pc)
    setIsDetailModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">ePassport Management</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Добавить
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Поиск по серийному номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {pcs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new PC.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sn')}
                >
                  Серийный номер
                  {sort.field === 'sn' && (
                    <span className="ml-1">{sort.order === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Описание
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('garant')}
                >
                  Гарантия до
                  {sort.field === 'garant' && (
                    <span className="ml-1">{sort.order === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('block')}
                >
                  Статус
                  {sort.field === 'block' && (
                    <span className="ml-1">{sort.order === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  Дата добавления
                  {sort.field === 'createdAt' && (
                    <span className="ml-1">{sort.order === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pcs.map((pc) => (
                <tr 
                  key={pc.id} 
                  onClick={() => {
                    setSelectedPC(pc)
                    setIsDetailModalOpen(true)
                  }}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{pc.sn}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{pc.descr || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(pc.garant).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      pc.block
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {pc.block ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => handleEdit(pc, e)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDelete(pc.id, e)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddPCModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          fetchPCs() // Refresh list after adding
        }}
      />

      <PCDetailModal
        pc={selectedPC}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedPC(null)
          fetchPCs() // Refresh list after editing
        }}
      />
    </div>
  )
}
