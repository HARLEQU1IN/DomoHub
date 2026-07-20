import {
  Bath,
  Bed,
  Home,
  LayoutDashboard,
  Plug,
  Settings,
  Sofa,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { Room } from '../api'

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
}

export function Sidebar({ rooms, selectedRoom, onSelectRoom, activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Панель', icon: LayoutDashboard },
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
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">Комнаты</p>
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
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all ${
                  selectedRoom === room.id ? 'bg-surface-overlay text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: room.color }} />
                <Icon size={16} />
                {room.name}
              </button>
            )
          })}
        </div>
      </div>

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
