import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { api, type Device, type Room, type SystemStatus } from './api'
import { DeviceCard } from './components/DeviceCard'
import { Sidebar } from './components/Sidebar'
import { StorageView } from './components/StorageView'

function DashboardView({
  devices,
  status,
  onToggle,
  onBrightnessChange,
}: {
  devices: Device[]
  status: SystemStatus | null
  onToggle: (id: string, state: Record<string, unknown>) => void
  onBrightnessChange: (id: string, brightness: number) => void
}) {
  const onlineCount = devices.filter((d) => d.is_online).length
  const activeCount = devices.filter((d) => d.state.on).length

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Добро пожаловать</h2>
        <p className="text-gray-500">Управляйте всеми устройствами из одного места</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="text-gray-500 text-sm mb-1">Устройств</div>
          <div className="text-3xl font-bold">{status?.devices_count ?? devices.length}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-gray-500 text-sm mb-1">Онлайн</div>
          <div className="text-3xl font-bold text-emerald-400">{onlineCount}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-gray-500 text-sm mb-1">Активных</div>
          <div className="text-3xl font-bold text-accent-hover">{activeCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onToggle={onToggle}
            onBrightnessChange={onBrightnessChange}
          />
        ))}
      </div>

      {devices.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-500">Устройства не найдены. Добавьте плагин или подключите устройства.</p>
        </div>
      )}
    </div>
  )
}

function PluginsView({ status }: { status: SystemStatus | null }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Плагины интеграций</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {status?.plugins.map((plugin) => (
          <div key={plugin.name} className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{plugin.display_name}</h3>
              <span className="text-xs bg-accent/20 text-accent-hover px-2 py-1 rounded-lg">
                {plugin.name}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{plugin.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AiView() {
  return (
    <div className="animate-fade-in max-w-2xl">
      <h2 className="text-2xl font-bold mb-2">AI / n8n интеграция</h2>
      <p className="text-gray-500 mb-8">
        Подключите n8n или LLM для голосового и текстового управления умным домом
      </p>

      <div className="space-y-4">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-3">Webhook для n8n</h3>
          <code className="block bg-surface p-3 rounded-lg text-sm text-accent-hover break-all">
            POST /api/v1/n8n/command
          </code>
          <pre className="mt-3 bg-surface p-3 rounded-lg text-xs text-gray-400 overflow-x-auto">
{`{
  "device_name": "Люстра гостиная",
  "action": "turn_on"
}

// или
{
  "room": "bedroom",
  "action": "turn_off"
}

// яркость
{
  "device_name": "Свет спальня",
  "action": "set_brightness",
  "params": { "brightness": 30 }
}`}
          </pre>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-3">Список устройств для LLM</h3>
          <code className="block bg-surface p-3 rounded-lg text-sm text-accent-hover">
            GET /api/v1/n8n/devices
          </code>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-3">Поддерживаемые действия</h3>
          <div className="flex flex-wrap gap-2">
            {['turn_on', 'turn_off', 'toggle', 'set', 'set_brightness', 'set_temperature', 'open_cover', 'close_cover'].map(
              (action) => (
                <span key={action} className="text-xs bg-surface-overlay px-3 py-1.5 rounded-lg text-gray-300">
                  {action}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="animate-fade-in max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Настройки</h2>
      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="text-sm text-gray-500">MQTT брокер</label>
          <p className="text-gray-400 text-sm mt-1">
            Настройте MQTT_ENABLED, MQTT_HOST в .env для подключения Zigbee2MQTT, Tasmota, ESPHome
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Два WiFi роутера</label>
          <p className="text-gray-400 text-sm mt-1">
            Разверните MarsFlowHomeAssistant на сервере/VPS с доступом к сети умных устройств. Используйте Tailscale или
            ZeroTier для доступа с вашего устройства.
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Tuya устройства</label>
          <p className="text-gray-400 text-sm mt-1">
            Установите tinytuya и настройте local_key для локального управления без облака
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [devices, setDevices] = useState<Device[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const loadData = async () => {
    try {
      const [devicesData, roomsData, statusData] = await Promise.all([
        api.getDevices(selectedRoom ?? undefined),
        api.getRooms(),
        api.getStatus(),
      ])
      setDevices(devicesData)
      setRooms(roomsData)
      setStatus(statusData)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedRoom])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'device_state_changed') {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === data.device_id ? { ...d, state: data.state } : d
          )
        )
      }
    }
    return () => ws.close()
  }, [])

  const handleToggle = async (id: string, state: Record<string, unknown>) => {
    try {
      const updated = await api.updateDeviceState(id, state)
      setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)))
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const handleBrightnessChange = async (id: string, brightness: number) => {
    try {
      const updated = await api.updateDeviceState(id, { brightness, on: true })
      setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)))
    } catch (err) {
      console.error('Brightness change failed:', err)
    }
  }

  const handleAddRoom = async (data: { name: string; icon: string; color: string }) => {
    const room = await api.createRoom(data)
    setRooms((prev) => [...prev, room])
  }

  const handleDeleteRoom = async (id: string) => {
    await api.deleteRoom(id)
    setRooms((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddRoom={handleAddRoom}
        onDeleteRoom={handleDeleteRoom}
        isMobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-surface-border bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-surface-raised text-gray-200 hover:bg-surface-overlay"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0 text-center">
            <div className="truncate text-sm font-semibold">MarsFlow</div>
            <div className="truncate text-xs text-gray-500">Home Assistant</div>
          </div>
          <div className="w-10" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                devices={devices}
                status={status}
                onToggle={handleToggle}
                onBrightnessChange={handleBrightnessChange}
              />
            )}
            {activeTab === 'storage' && <StorageView />}
            {activeTab === 'plugins' && <PluginsView status={status} />}
            {activeTab === 'ai' && <AiView />}
            {activeTab === 'settings' && <SettingsView />}
          </>
        )}
        </div>
      </main>
    </div>
  )
}
