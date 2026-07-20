import {
  Bath,
  Bed,
  HardDrive,
  Home,
  LayoutDashboard,
  Plug,
  Plus,
  Settings,
  Sofa,
  Sparkles,
  Trash2,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import type { Room } from '../api'
import { AddRoomModal } from './AddRoomModal'
import { Modal } from './Modal'

const roomIcons: Record<string, LucideIcon> = {
  sofa: Sofa,
  bed: Bed,
  utensils: Utensils,
  bath: Bath,
  home: Home,
}

interface SidebarProps {
  rooms: Room[]
  selectedRoom: string | null
  onSelectRoom: (id: string | null) => void
  activeTab: string
  onTabChange: (tab: string) => void
  onAddRoom: (data: { name: string; icon: string; color: string }) => Promise<void>
  onDeleteRoom: (id: string) => Promise<void>
}

export function Sidebar({ rooms, selectedRoom, onSelectRoom, activeTab, onTabChange, onAddRoom, onDeleteRoom }: SidebarProps) {
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
  const [deleting, setDeleting] = useState(false)
  const navItems = [
    { id: 'dashboard', label: 'Панель', icon: LayoutDashboard },
    { id: 'storage', label: 'Хранилище', icon: HardDrive },
    { id: 'plugins', label: 'Плагины', icon: Plug },
    { id: 'ai', label: 'AI / n8n', icon: Sparkles },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ]

  return (
    <aside className="w-64 min-h-screen bg-surface-raised border-r border-surface-border flex flex-col">
      <div className="p-6 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">DomoHub</h1>
            <p className="text-xs text-gray-500">Умный дом</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-accent/15 text-accent-hover'
                : 'text-gray-400 hover:text-gray-200 hover:bg-surface-overlay'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2 px-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Комнаты</p>
          <button
            type="button"
            onClick={() => setRoomModalOpen(true)}
            className="p-1 rounded-lg text-gray-500 hover:text-accent-hover hover:bg-accent/10 transition-colors"
            title="Добавить комнату"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onSelectRoom(null)}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all ${
              selectedRoom === null ? 'bg-surface-overlay text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Home size={16} />
            Все комнаты
          </button>
          {rooms.map((room) => {
            const Icon = roomIcons[room.icon] || Home
            return (
              <div
                key={room.id}
                className={`group flex items-center rounded-xl transition-all ${
                  selectedRoom === room.id ? 'bg-surface-overlay' : 'hover:bg-surface-overlay/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectRoom(room.id)}
                  className={`flex-1 flex items-center gap-3 px-4 py-2 text-sm transition-all ${
                    selectedRoom === room.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: room.color }} />
                  <Icon size={16} />
                  <span className="truncate">{room.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomToDelete(room)}
                  className="p-2 mr-1 rounded-lg text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Удалить комнату"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <AddRoomModal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        onSubmit={onAddRoom}
      />

      <Modal open={!!roomToDelete} title="Удалить комнату?" onClose={() => setRoomToDelete(null)}>
        {roomToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Комната «{roomToDelete.name}» будет удалена. Устройства в ней останутся без привязки к комнате.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRoomToDelete(null)} className="btn-ghost flex-1">
                Отмена
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await onDeleteRoom(roomToDelete.id)
                    if (selectedRoom === roomToDelete.id) onSelectRoom(null)
                    setRoomToDelete(null)
                  } finally {
                    setDeleting(false)
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="mt-auto p-4 border-t border-surface-border">
        <div className="glass-card p-3 text-xs text-gray-500">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-medium">Онлайн</span>
          </div>
          DomoHub v0.1.0
        </div>
      </div>
    </aside>
  )
}
