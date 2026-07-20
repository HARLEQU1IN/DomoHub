import {
  Bath,
  Bed,
  Blinds,
  Droplets,
  Home,
  Lightbulb,
  Plug,
  Sofa,
  Thermometer,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { Device } from '../api'

const iconMap: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  plug: Plug,
  droplets: Droplets,
  thermometer: Thermometer,
  blinds: Blinds,
  sofa: Sofa,
  bed: Bed,
  utensils: Utensils,
  bath: Bath,
  home: Home,
}

interface DeviceCardProps {
  device: Device
  onToggle: (id: string, state: Record<string, unknown>) => void
  onBrightnessChange?: (id: string, brightness: number) => void
}

export function DeviceCard({ device, onToggle, onBrightnessChange }: DeviceCardProps) {
  const Icon = iconMap[device.icon] || Home
  const isOn = Boolean(device.state.on)
  const brightness = Number(device.state.brightness ?? 100)

  const handleToggle = () => {
    onToggle(device.id, { on: !isOn })
  }

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 hover:border-accent/30 animate-slide-up ${
        isOn && device.device_type === 'light' ? 'ring-1 ring-accent/20' : ''
      }`}
      style={{
        boxShadow: isOn && device.device_type === 'light'
          ? `0 0 30px ${String(device.state.color || '#6366f1')}22`
          : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl transition-colors ${
            isOn ? 'bg-accent/20 text-accent-hover' : 'bg-surface-overlay text-gray-400'
          }`}
        >
          <Icon size={22} />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              device.is_online ? 'bg-emerald-400 animate-pulse-soft' : 'bg-gray-600'
            }`}
          />
          <span className="text-xs text-gray-500">{device.manufacturer}</span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-100 mb-1">{device.name}</h3>
      <p className="text-xs text-gray-500 mb-4 capitalize">{device.device_type}</p>

      {device.device_type === 'sensor' && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-surface-overlay rounded-lg p-2 text-center">
            <div className="text-gray-500 text-xs">Темп.</div>
            <div className="font-semibold">{String(device.state.temperature)}°C</div>
          </div>
          <div className="bg-surface-overlay rounded-lg p-2 text-center">
            <div className="text-gray-500 text-xs">Влажн.</div>
            <div className="font-semibold">{String(device.state.humidity)}%</div>
          </div>
        </div>
      )}

      {device.device_type === 'climate' && (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{String(device.state.target)}°</div>
            <div className="text-xs text-gray-500 capitalize">{String(device.state.mode)}</div>
          </div>
          <button onClick={handleToggle} className={`w-12 h-12 rounded-full transition-all ${isOn ? 'bg-accent' : 'bg-surface-overlay'}`}>
            <Thermometer size={20} className="mx-auto" />
          </button>
        </div>
      )}

      {device.device_type === 'cover' && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Позиция</span>
            <span className="font-medium">{String(device.state.position)}%</span>
          </div>
          <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${device.state.position}%` }}
            />
          </div>
        </div>
      )}

      {(device.device_type === 'light' || device.device_type === 'switch') && (
        <div className="space-y-3">
          {device.device_type === 'light' && isOn && onBrightnessChange && (
            <input
              type="range"
              min={1}
              max={100}
              value={brightness}
              onChange={(e) => onBrightnessChange(device.id, Number(e.target.value))}
              className="w-full accent-accent"
            />
          )}
          <button
            onClick={handleToggle}
            className={`w-full py-2.5 rounded-xl font-medium transition-all duration-200 ${
              isOn
                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                : 'bg-surface-overlay text-gray-400 hover:text-gray-200'
            }`}
          >
            {isOn ? 'Включено' : 'Выключено'}
          </button>
        </div>
      )}
    </div>
  )
}
