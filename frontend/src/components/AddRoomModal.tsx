import { useState } from 'react'
import { Bath, Bed, Home, Sofa, Utensils, type LucideIcon } from 'lucide-react'
import { Modal } from './Modal'

const ICON_OPTIONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Дом', Icon: Home },
  { id: 'sofa', label: 'Гостиная', Icon: Sofa },
  { id: 'bed', label: 'Спальня', Icon: Bed },
  { id: 'utensils', label: 'Кухня', Icon: Utensils },
  { id: 'bath', label: 'Ванная', Icon: Bath },
]

const COLOR_OPTIONS = ['#6366f1', '#8b5cf6', '#f59e0b', '#06b6d4', '#10b981', '#ef4444', '#ec4899']

interface AddRoomModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; icon: string; color: string }) => Promise<void>
}

export function AddRoomModal({ open, onClose, onSubmit }: AddRoomModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('home')
  const [color, setColor] = useState('#6366f1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Введите название комнаты')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({ name: name.trim(), icon, color })
      setName('')
      setIcon('home')
      setColor('#6366f1')
      onClose()
    } catch {
      setError('Не удалось создать комнату')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title="Новая комната" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Название</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Кабинет"
            className="w-full bg-surface-overlay border border-surface-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent/50"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Иконка</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setIcon(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                  icon === id ? 'bg-accent/20 text-accent-hover ring-1 ring-accent/40' : 'bg-surface-overlay text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Цвет</label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Отмена
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
