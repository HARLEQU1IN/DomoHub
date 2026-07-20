import type { BrowseResponse, FileItem, StorageStats, StorageVolume } from './types/storage'

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
  createRoom: (data: { name: string; icon?: string; color?: string }) =>
    fetchApi<Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  deleteRoom: (id: string) => fetchApi<{ ok: boolean }>(`/rooms/${id}`, { method: 'DELETE' }),
  getDevices: (roomId?: string) =>
    fetchApi<Device[]>(roomId ? `/devices?room_id=${roomId}` : '/devices'),
  updateDeviceState: (id: string, state: Record<string, unknown>) =>
    fetchApi<Device>(`/devices/${id}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ state }),
    }),
  getPlugins: () => fetchApi<{ name: string; display_name: string; description: string }[]>('/plugins'),

  // Storage
  getStorageVolumes: () => fetchApi<StorageVolume[]>('/storage/volumes'),
  getStorageStats: () => fetchApi<StorageStats>('/storage/stats'),
  browseStorage: (volumeId: string, path: string = '') =>
    fetchApi<BrowseResponse>(`/storage/browse?volume_id=${volumeId}&path=${encodeURIComponent(path)}`),
  searchStorage: (query: string, volumeId?: string) =>
    fetchApi<FileItem[]>(`/storage/search?query=${encodeURIComponent(query)}${volumeId ? `&volume_id=${volumeId}` : ''}`),
  createFolder: (volumeId: string, path: string, name: string) =>
    fetchApi<FileItem>('/storage/mkdir', { method: 'POST', body: JSON.stringify({ volume_id: volumeId, path, name }) }),
  deleteFile: (volumeId: string, path: string) =>
    fetchApi<{ ok: boolean }>('/storage/files', {
      method: 'DELETE',
      body: JSON.stringify({ volume_id: volumeId, path }),
    }),
  uploadFile: async (volumeId: string, path: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`/api/v1/storage/upload?volume_id=${volumeId}&path=${encodeURIComponent(path)}`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    return res.json()
  },
}
