export interface Device {
  id: string
  name: string
  manufacturer: string
  device_type: string
  plugin: string
  room_id: string | null
  is_online: boolean
  state: Record<string, unknown>
  capabilities: string[]
  icon: string
}

export interface Room {
  id: string
  name: string
  icon: string
  color: string
}

export interface SystemStatus {
  version: string
  plugins: { name: string; display_name: string; description: string }[]
  devices_count: number
  rooms_count: number
  mqtt_enabled: boolean
}

const API_BASE = '/api/v1'

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  getStatus: () => fetchApi<SystemStatus>('/status'),
  getRooms: () => fetchApi<Room[]>('/rooms'),
  getDevices: (roomId?: string) =>
    fetchApi<Device[]>(roomId ? `/devices?room_id=${roomId}` : '/devices'),
  updateDeviceState: (id: string, state: Record<string, unknown>) =>
    fetchApi<Device>(`/devices/${id}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ state }),
    }),
  getPlugins: () => fetchApi<{ name: string; display_name: string; description: string }[]>('/plugins'),
}
