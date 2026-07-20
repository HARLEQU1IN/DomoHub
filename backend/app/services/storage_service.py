import mimetypes
import os
import shutil
from datetime import datetime
from pathlib import Path

from app.core.config import get_settings
from app.schemas.storage import BrowseResponse, FileItem, StorageStats, StorageVolume

settings = get_settings()

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"}
VIDEO_EXT = {".mp4", ".mkv", ".avi", ".mov", ".webm"}
AUDIO_EXT = {".mp3", ".flac", ".wav", ".ogg", ".aac"}
DOC_EXT = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md"}
ARCHIVE_EXT = {".zip", ".rar", ".7z", ".tar", ".gz"}


class StorageService:
    def __init__(self) -> None:
        self.storage_root = settings.data_dir / "storage"
        self.volumes_config = settings.storage_volumes
        self.storage_root.mkdir(parents=True, exist_ok=True)
    def _get_volumes(self) -> list[dict]:
        volumes = list(self.volumes_config)
        if not volumes:
            volumes = [{"id": "local", "name": "Локальное хранилище", "path": str(self.storage_root), "type": "local", "icon": "hard-drive"}]
        return volumes

    def _resolve_volume(self, volume_id: str) -> dict:
        for vol in self._get_volumes():
            if vol["id"] == volume_id:
                return vol
        raise ValueError(f"Volume {volume_id} not found")

    def _safe_path(self, volume_id: str, relative_path: str) -> Path:
        vol = self._resolve_volume(volume_id)
        root = Path(vol["path"]).resolve()
        target = (root / relative_path.lstrip("/")).resolve()
        if not str(target).startswith(str(root)):
            raise ValueError("Path traversal detected")
        return target

    def _disk_usage(self, path: Path) -> tuple[int, int, int]:
        usage = shutil.disk_usage(path)
        return usage.total, usage.used, usage.free

    def _count_files(self, path: Path) -> tuple[int, int]:
        files, folders = 0, 0
        if not path.exists():
            return 0, 0
        for item in path.rglob("*"):
            if item.is_file():
                files += 1
            elif item.is_dir():
                folders += 1
        return files, folders

    def _file_item(self, path: Path, root: Path) -> FileItem:
        rel = str(path.relative_to(root))
        ext = path.suffix.lower() if path.suffix else None
        mime, _ = mimetypes.guess_type(str(path))
        stat = path.stat()
        return FileItem(
            name=path.name,
            path=rel,
            is_dir=path.is_dir(),
            size=stat.st_size if path.is_file() else 0,
            mime_type=mime,
            modified_at=datetime.fromtimestamp(stat.st_mtime),
            extension=ext,
        )

    async def list_volumes(self) -> list[StorageVolume]:
        result = []
        for vol in self._get_volumes():
            path = Path(vol["path"])
            path.mkdir(parents=True, exist_ok=True)
            total, used, free = self._disk_usage(path)
            usage = (used / total * 100) if total > 0 else 0
            result.append(
                StorageVolume(
                    id=vol["id"],
                    name=vol["name"],
                    path=str(path),
                    type=vol.get("type", "local"),
                    icon=vol.get("icon", "hard-drive"),
                    total_bytes=total,
                    used_bytes=used,
                    free_bytes=free,
                    usage_percent=round(usage, 1),
                )
            )
        return result

    async def get_stats(self) -> StorageStats:
        volumes = await self.list_volumes()
        files, folders = 0, 0
        for vol in self._get_volumes():
            f, d = self._count_files(Path(vol["path"]))
            files += f
            folders += d
        return StorageStats(
            volumes_count=len(volumes),
            total_bytes=sum(v.total_bytes for v in volumes),
            used_bytes=sum(v.used_bytes for v in volumes),
            free_bytes=sum(v.free_bytes for v in volumes),
            files_count=files,
            folders_count=folders,
        )

    async def browse(self, volume_id: str, path: str = "") -> BrowseResponse:
        vol = self._resolve_volume(volume_id)
        root = Path(vol["path"]).resolve()
        current = self._safe_path(volume_id, path)

        if not current.exists():
            raise ValueError("Path not found")
        if not current.is_dir():
            raise ValueError("Not a directory")

        items: list[FileItem] = []
        try:
            for entry in sorted(current.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
                if entry.name.startswith("."):
                    continue
                items.append(self._file_item(entry, root))
        except PermissionError:
            raise ValueError("Permission denied") from None

        parent = None
        if current != root:
            parent_rel = str(current.parent.relative_to(root))
            parent = "" if parent_rel == "." else parent_rel

        current_rel = "" if current == root else str(current.relative_to(root))

        return BrowseResponse(
            volume_id=volume_id,
            current_path=current_rel,
            parent_path=parent,
            items=items,
            total_items=len(items),
        )

    async def mkdir(self, volume_id: str, path: str, name: str) -> FileItem:
        parent = self._safe_path(volume_id, path)
        if not parent.is_dir():
            raise ValueError("Parent is not a directory")
        new_dir = parent / name
        if new_dir.exists():
            raise ValueError("Already exists")
        new_dir.mkdir(parents=False)
        root = Path(self._resolve_volume(volume_id)["path"]).resolve()
        return self._file_item(new_dir, root)

    async def delete(self, volume_id: str, path: str) -> bool:
        target = self._safe_path(volume_id, path)
        if not target.exists():
            raise ValueError("Not found")
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
        return True

    async def search(self, query: str, volume_id: str | None = None, limit: int = 50) -> list[FileItem]:
        results: list[FileItem] = []
        query_lower = query.lower()
        volumes = [self._resolve_volume(volume_id)] if volume_id else self._get_volumes()

        for vol in volumes:
            root = Path(vol["path"]).resolve()
            if not root.exists():
                continue
            for entry in root.rglob("*"):
                if entry.name.startswith("."):
                    continue
                if query_lower in entry.name.lower():
                    results.append(self._file_item(entry, root))
                    if len(results) >= limit:
                        return results
        return results

    def get_download_path(self, volume_id: str, path: str) -> Path:
        target = self._safe_path(volume_id, path)
        if not target.exists() or target.is_dir():
            raise ValueError("File not found")
        return target

    def get_upload_dir(self, volume_id: str, path: str) -> Path:
        target = self._safe_path(volume_id, path)
        if not target.is_dir():
            raise ValueError("Target is not a directory")
        return target

    def get_volume_root(self, volume_id: str) -> Path:
        return Path(self._resolve_volume(volume_id)["path"]).resolve()
