import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNotification } from '@/components/Notification'
import { getFileUrl }  from '@/lib/file-utils';

interface Document {
  id: number
  name: string
  filePath: string
  createdAt: string
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching documents:', error)
      showNotification({
        type: 'error',
        message: 'Не удалось загрузить список документов'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !file) {
      showNotification({
        type: 'warning',
        message: 'Заполните все поля'
      })
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('file', file)

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Ошибка при загрузке')

      showNotification({
        type: 'success',
        message: 'Документ успешно добавлен'
      })
      setName('')
      setFile(null)
      fetchDocuments()
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Ошибка при добавлении документа'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) return

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Ошибка при удалении')

      showNotification({
        type: 'success',
        message: 'Документ успешно удален',
        
      })
      fetchDocuments()
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Ошибка при удалении документа',
        
      })
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="name">Название документа</Label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите название документа"
          />
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="file">Файл</Label>
          <Input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Добавление...' : 'Добавить документ'}
        </Button>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Список документов</h3>
        {documents.length === 0 ? (
          <p>Документов пока нет.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{doc.name}</h4>
                  <a
                    href={getFileUrl(doc.filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Открыть файл
                  </a>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                >
                  Удалить
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
