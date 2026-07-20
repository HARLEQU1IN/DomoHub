from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.schemas.storage import (
    BrowseResponse,
    DeleteRequest,
    FileItem,
    MkdirRequest,
    StorageStats,
    StorageVolume,
)
from app.services.storage_service import StorageService

router = APIRouter(prefix="/storage", tags=["storage"])
storage = StorageService()


@router.get("/volumes", response_model=list[StorageVolume])
async def list_volumes():
    return await storage.list_volumes()


@router.get("/stats", response_model=StorageStats)
async def get_storage_stats():
    return await storage.get_stats()


@router.get("/browse", response_model=BrowseResponse)
async def browse_files(volume_id: str = "local", path: str = ""):
    try:
        return await storage.browse(volume_id, path)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.get("/search", response_model=list[FileItem])
async def search_files(query: str, volume_id: str | None = None, limit: int = 50):
    if len(query) < 2:
        raise HTTPException(400, "Query too short")
    return await storage.search(query, volume_id, limit)


@router.post("/mkdir", response_model=FileItem)
async def create_directory(data: MkdirRequest):
    try:
        return await storage.mkdir(data.volume_id, data.path, data.name)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.delete("/files")
async def delete_file(data: DeleteRequest):
    try:
        await storage.delete(data.volume_id, data.path)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.post("/upload")
async def upload_file(volume_id: str = "local", path: str = "", file: UploadFile = File(...)):
    try:
        parent = storage.get_upload_dir(volume_id, path)
        dest = parent / (file.filename or "upload")
        content = await file.read()
        dest.write_bytes(content)
        root = storage.get_volume_root(volume_id)
        return storage._file_item(dest, root)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.get("/download")
async def download_file(volume_id: str, path: str):
    try:
        file_path = storage.get_download_path(volume_id, path)
        return FileResponse(file_path, filename=file_path.name)
    except ValueError as e:
        raise HTTPException(404, str(e)) from e
