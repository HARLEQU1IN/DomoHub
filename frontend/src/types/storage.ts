export interface StorageVolume {
  id: string
  name: string
  path: string
  type: string
  icon: string
  total_bytes: number
  used_bytes: number
  free_bytes: number
  usage_percent: number
}

export interface FileItem {
  name: string
  path: string
  is_dir: boolean
  size: number
  mime_type: string | null
  modified_at: string | null
  extension: string | null
}

export interface BrowseResponse {
  volume_id: string
  current_path: string
  parent_path: string | null
  items: FileItem[]
  total_items: number
}

export interface StorageStats {
  volumes_count: number
  total_bytes: number
  used_bytes: number
  free_bytes: number
  files_count: number
  folders_count: number
}
