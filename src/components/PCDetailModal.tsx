'use client'

import { Fragment, useState, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Image from 'next/image'

interface PC {
  id: number
  sn: string
  pin: string
  descr?: string
  garant: string
  block: boolean
  documentPath: string
}

interface PCDetailModalProps {
  pc: PC | null
  isOpen: boolean
  onClose: () => void
}

const PCDetailModal: React.FC<PCDetailModalProps> = ({ pc, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<PC>>({})
  const [image, setImage] = useState<File | null>(null)
  const [deleteImage, setDeleteImage] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = useCallback(() => {
    if (pc) {
      setFormData({
        sn: pc.sn,
        pin: pc.pin,
        descr: pc.descr || '',
        garant: new Date(pc.garant).toISOString().split('T')[0],
        block: pc.block,
      })
      setDeleteImage(false)
      setImage(null)
    }
  }, [pc])

  useEffect(() => {
    if (isOpen && pc) {
      resetForm()
    }
  }, [isOpen, pc, resetForm])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'image/jpeg') {
        setError('Please select a JPG image')
        return
      }
      setImage(file)
      setDeleteImage(false)
      setError('')
    }
  }

  const handleDeleteImage = () => {
    setDeleteImage(true)
    setImage(null)
  }

  const handleKeepImage = () => {
    setDeleteImage(false)
    setImage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pc) return

    setLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('id', pc.id.toString())
      formDataToSend.append('sn', formData.sn!)
      formDataToSend.append('pin', formData.pin!)
      formDataToSend.append('descr', formData.descr || '')
      formDataToSend.append('garant', formData.garant!)
      formDataToSend.append('block', formData.block!.toString())
      formDataToSend.append('deleteImage', deleteImage.toString())
      if (image) {
        formDataToSend.append('image', image)
      }

      const response = await fetch('/api/pc', {
        method: 'PUT',
        body: formDataToSend,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update PC')
      }

      setIsEditing(false)
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    setError('')
    setImage(null)
    setDeleteImage(false)
    onClose()
  }

  if (!pc) return null

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={handleClose}>
        <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <div className="mt-3 sm:mt-5">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Паспорт
                  </Dialog.Title>

                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-4">
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  )}

                  <div className="mt-4">
                    {isEditing ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Серийный номер</label>
                          <input
                            type="text"
                            name="sn"
                            value={formData.sn || ''}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Пин</label>
                          <input
                            type="text"
                            name="pin"
                            value={formData.pin || ''}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Описание</label>
                          <textarea
                            name="descr"
                            value={formData.descr || ''}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Дата окончания гарантии</label>
                          <input
                            type="date"
                            name="garant"
                            value={formData.garant || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="block"
                            checked={formData.block || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">Blocked</label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Текущий скан</label>
                          {!deleteImage && !image && (
                            <div className="mt-2 relative">
                              <Image
                                src={pc.documentPath}
                                alt={`PC ${pc.sn}`}
                                width={400}
                                height={300}
                                className="rounded-lg object-cover"
                              />
                              <button
                                type="button"
                                onClick={handleDeleteImage}
                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}

                          {deleteImage && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">Image will be deleted</p>
                              <button
                                type="button"
                                onClick={handleKeepImage}
                                className="mt-1 text-sm text-indigo-600 hover:text-indigo-500"
                              >
                                Keep current image
                              </button>
                            </div>
                          )}

                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {image ? 'New image selected' : 'Upload new image'} (JPG only)
                            </label>
                            <input
                              type="file"
                              accept=".jpg,image/jpeg"
                              onChange={handleImageChange}
                              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                          >
                            {loading ? 'Сохраняю...' : 'Сохранить'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                          >
                            Отмена
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
                          <Image
                            src={pc.documentPath}
                            alt={`PC ${pc.sn}`}
                            width={800}
                            height={600}
                            className="object-cover"
                          />
                        </div>

                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                            <dd className="mt-1 text-sm text-gray-900">{pc.sn}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">PIN</dt>
                            <dd className="mt-1 text-sm text-gray-900">{pc.pin}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900">{pc.descr || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Warranty Date</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(pc.garant).toLocaleDateString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                pc.block
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {pc.block ? 'Blocked' : 'Active'}
                              </span>
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-5 sm:mt-6">
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                          >
                            Изменить
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default PCDetailModal
