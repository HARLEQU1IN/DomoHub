import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Archive,
  ChevronRight,
  Download,
  File,
  FileImage,
  FileText,
  Film,
  Folder,
  FolderPlus,
  Grid3x3,
  HardDrive,
  List,
  Music,
  Search,
  Server,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { api } from '../api'
import type { BrowseResponse, FileItem, StorageStats, StorageVolume } from '../types/storage'
import { Modal } from './Modal'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function FileIcon({ item }: { item: FileItem }) {
  if (item.is_dir) return <Folder size={20} className="text-amber-400" />
  const ext = item.extension || ''
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext))
    return <FileImage size={20} className="text-pink-400" />
  if (['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext))
    return <Film size={20} className="text-purple-400" />
  if (['.mp3', '.flac', '.wav', '.ogg'].includes(ext))
    return <Music size={20} className="text-cyan-400" />
  if (['.pdf', '.doc', '.docx', '.txt', '.md'].includes(ext))
    return <FileText size={20} className="text-blue-400" />
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext))
    return <Archive size={20} className="text-orange-400" />
  return <File size={20} className="text-gray-400" />
}

function VolumeIcon({ type }: { type: string }) {
  if (type === 'smb' || type === 'nfs') return <Server size={20} />
  return <HardDrive size={20} />
}

export function StorageView() {
  const [volumes, setVolumes] = useState<StorageVolume[]>([])
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [browse, setBrowse] = useState<BrowseResponse | null>(null)
  const [selectedVolume, setSelectedVolume] = useState('local')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FileItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FileItem | null>(null)
  const [mkdirOpen, setMkdirOpen] = useState(false)
  const [mkdirName, setMkdirName] = useState('')
  const [mkdirError, setMkdirError] = useState('')
  const [mkdirSaving, setMkdirSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadVolumes = useCallback(async () => {
    const [vols, st] = await Promise.all([api.getStorageVolumes(), api.getStorageStats()])
    setVolumes(vols)
    setStats(st)
    if (vols.length > 0 && !vols.find((v) => v.id === selectedVolume)) {
      setSelectedVolume(vols[0].id)
    }
  }, [selectedVolume])

  const loadBrowse = useCallback(async (volumeId: string, path: string = '') => {
    const data = await api.browseStorage(volumeId, path)
    setBrowse(data)
    setSearchResults(null)
    setSelected(null)
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await loadVolumes()
        await loadBrowse(selectedVolume)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!loading) loadBrowse(selectedVolume, browse?.current_path ?? '')
  }, [selectedVolume])

  const handleOpen = (item: FileItem) => {
    if (item.is_dir) {
      loadBrowse(selectedVolume, item.path)
    } else {
      setSelected(item)
    }
  }

  const handleBreadcrumb = (path: string) => loadBrowse(selectedVolume, path)

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setSearchResults(null)
      return
    }
    const results = await api.searchStorage(searchQuery, selectedVolume)
    setSearchResults(results)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !browse) return
    for (const file of Array.from(files)) {
      await api.uploadFile(selectedVolume, browse.current_path, file)
    }
    await loadBrowse(selectedVolume, browse.current_path)
    await loadVolumes()
  }

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Удалить «${item.name}»?`)) return
    await api.deleteFile(selectedVolume, item.path)
    if (browse) await loadBrowse(selectedVolume, browse.current_path)
    await loadVolumes()
    setSelected(null)
  }

  const handleMkdir = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = mkdirName.trim()
    if (!name) {
      setMkdirError('Введите имя папки')
      return
    }
    const currentPath = browse?.current_path ?? ''
    setMkdirSaving(true)
    setMkdirError('')
    try {
      await api.createFolder(selectedVolume, currentPath, name)
      await loadBrowse(selectedVolume, currentPath)
      setMkdirName('')
      setMkdirOpen(false)
    } catch {
      setMkdirError('Не удалось создать папку')
    } finally {
      setMkdirSaving(false)
    }
  }

  const items = searchResults ?? browse?.items ?? []

  const breadcrumbs = browse
    ? [
        { label: 'Корень', path: '' },
        ...browse.current_path
          .split('/')
          .filter(Boolean)
          .map((part, i, arr) => ({
            label: part,
            path: arr.slice(0, i + 1).join('/'),
          })),
      ]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-1">Сетевое хранилище</h2>
        <p className="text-gray-500">Файлы, медиа и резервные копии — всё в одном месте</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-1">Всего</div>
            <div className="text-xl font-bold">{formatBytes(stats.total_bytes)}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-1">Занято</div>
            <div className="text-xl font-bold text-amber-400">{formatBytes(stats.used_bytes)}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-1">Файлов</div>
            <div className="text-xl font-bold">{stats.files_count}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-1">Папок</div>
            <div className="text-xl font-bold">{stats.folders_count}</div>
          </div>
        </div>
      )}

      {/* Volumes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {volumes.map((vol) => (
          <button
            key={vol.id}
            onClick={() => {
              setSelectedVolume(vol.id)
              loadBrowse(vol.id, '')
            }}
            className={`glass-card p-5 text-left transition-all hover:border-accent/30 ${
              selectedVolume === vol.id ? 'ring-1 ring-accent/40 border-accent/30' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-accent/15 rounded-lg text-accent-hover">
                <VolumeIcon type={vol.type} />
              </div>
              <div>
                <div className="font-semibold">{vol.name}</div>
                <div className="text-xs text-gray-500 capitalize">{vol.type}</div>
              </div>
            </div>
            <div className="h-2 bg-surface-overlay rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${
                  vol.usage_percent > 85 ? 'bg-red-500' : vol.usage_percent > 70 ? 'bg-amber-500' : 'bg-accent'
                }`}
                style={{ width: `${vol.usage_percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatBytes(vol.used_bytes)} / {formatBytes(vol.total_bytes)}</span>
              <span>{vol.usage_percent}%</span>
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-card p-3 sm:p-4 mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto pb-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ChevronRight size={14} className="text-gray-600" />}
                <button
                  onClick={() => handleBreadcrumb(crumb.path)}
                  className="text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap lg:justify-end">
          <div className="flex items-center gap-2 bg-surface-overlay rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Поиск файлов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-transparent text-sm outline-none w-full sm:w-40"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults(null) }}>
                <X size={14} className="text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-accent/20 text-accent-hover' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-accent/20 text-accent-hover' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setMkdirError(''); setMkdirOpen(true) }}
            className="btn-ghost flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <FolderPlus size={16} /> Папка
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            <Upload size={16} /> Загрузить
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          </div>
        </div>
      </div>

      {/* File list */}
      {searchResults && (
        <p className="text-sm text-gray-500 mb-3">
          Найдено: {searchResults.length} {searchQuery && `по запросу «${searchQuery}»`}
        </p>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => handleOpen(item)}
              onDoubleClick={() => item.is_dir && handleOpen(item)}
              className={`glass-card p-4 text-center transition-all hover:border-accent/30 hover:scale-[1.02] ${
                selected?.path === item.path ? 'ring-1 ring-accent/40' : ''
              }`}
            >
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-surface-overlay rounded-xl">
                  <FileIcon item={item} />
                </div>
              </div>
              <div className="text-sm font-medium truncate" title={item.name}>{item.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {item.is_dir ? 'Папка' : formatBytes(item.size)}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-surface-border text-gray-500 text-left">
                <th className="p-3 font-medium">Имя</th>
                <th className="p-3 font-medium hidden md:table-cell">Размер</th>
                <th className="p-3 font-medium hidden lg:table-cell">Изменён</th>
                <th className="p-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.path}
                  onClick={() => handleOpen(item)}
                  className={`border-b border-surface-border/50 hover:bg-surface-overlay/50 cursor-pointer transition-colors ${
                    selected?.path === item.path ? 'bg-accent/5' : ''
                  }`}
                >
                  <td className="p-3 flex items-center gap-3">
                    <FileIcon item={item} />
                    <span className="truncate">{item.name}</span>
                  </td>
                  <td className="p-3 text-gray-500 hidden md:table-cell">
                    {item.is_dir ? '—' : formatBytes(item.size)}
                  </td>
                  <td className="p-3 text-gray-500 hidden lg:table-cell">{formatDate(item.modified_at)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 justify-end">
                      {!item.is_dir && (
                        <a
                          href={`/api/v1/storage/download?volume_id=${selectedVolume}&path=${encodeURIComponent(item.path)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-surface-overlay text-gray-500 hover:text-accent-hover"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <div className="glass-card p-12 text-center text-gray-500">
          Папка пуста. Загрузите файлы или создайте папку.
        </div>
      )}

      {/* Selected file panel */}
      {selected && !selected.is_dir && (
        <div className="fixed inset-x-4 bottom-4 z-30 glass-card p-4 sm:p-5 sm:w-80 sm:left-auto sm:right-6 sm:inset-x-auto animate-slide-up shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileIcon item={selected} />
              <div>
                <div className="font-semibold text-sm truncate max-w-[180px]">{selected.name}</div>
                <div className="text-xs text-gray-500">{formatBytes(selected.size)}</div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="text-xs text-gray-500 mb-4">{formatDate(selected.modified_at)}</div>
          <div className="flex gap-2">
            <a
              href={`/api/v1/storage/download?volume_id=${selectedVolume}&path=${encodeURIComponent(selected.path)}`}
              className="btn-primary flex-1 text-center text-sm py-2"
            >
              Скачать
            </a>
            <button onClick={() => handleDelete(selected)} className="btn-ghost text-red-400 text-sm py-2 px-3">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      <Modal open={mkdirOpen} title="Новая папка" onClose={() => setMkdirOpen(false)}>
        <form onSubmit={handleMkdir} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Имя папки</label>
            <input
              type="text"
              value={mkdirName}
              onChange={(e) => setMkdirName(e.target.value)}
              placeholder="Например: Документы"
              className="w-full bg-surface-overlay border border-surface-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent/50"
              autoFocus
            />
          </div>
          {mkdirError && <p className="text-sm text-red-400">{mkdirError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setMkdirOpen(false)} className="btn-ghost flex-1">
              Отмена
            </button>
            <button type="submit" disabled={mkdirSaving} className="btn-primary flex-1 disabled:opacity-50">
              {mkdirSaving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
