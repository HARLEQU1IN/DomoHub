import mimetypes
import shutil
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel, Field


class StorageVolume(BaseModel):
    id: str
    name: str
    path: str
    type: str = "local"
    icon: str = "hard-drive"
    total_bytes: int
    used_bytes: int
    free_bytes: int
    usage_percent: float


class FileItem(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: int
    mime_type: str | None = None
    modified_at: datetime | None = None
    extension: str | None = None


class BrowseResponse(BaseModel):
    volume_id: str
    current_path: str
    parent_path: str | None
    items: list[FileItem]
    total_items: int


class StorageStats(BaseModel):
    volumes_count: int
    total_bytes: int
    used_bytes: int
    free_bytes: int
    files_count: int
    folders_count: int


class MkdirRequest(BaseModel):
    volume_id: str
    path: str
    name: str


class DeleteRequest(BaseModel):
    volume_id: str
    path: str


class SearchRequest(BaseModel):
    query: str
    volume_id: str | None = None
    limit: int = Field(default=50, le=200)
