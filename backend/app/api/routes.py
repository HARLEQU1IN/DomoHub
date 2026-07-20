from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.plugins import list_plugins
from app.schemas import (
    DeviceCreate,
    DeviceResponse,
    DeviceStateUpdate,
    N8nCommand,
    N8nResponse,
    PluginInfo,
    RoomCreate,
    RoomResponse,
    SystemStatus,
)
from app.services.device_service import DeviceService, RoomService

router = APIRouter()
settings = get_settings()


@router.get("/status", response_model=SystemStatus)
async def get_status(db: AsyncSession = Depends(get_db)):
    device_service = DeviceService(db)
    room_service = RoomService(db)
    devices = await device_service.list_devices()
    rooms = await room_service.list_rooms()
    return SystemStatus(
        version=settings.app_version,
        plugins=[PluginInfo(**p) for p in list_plugins()],
        devices_count=len(devices),
        rooms_count=len(rooms),
        mqtt_enabled=settings.mqtt_enabled,
    )


@router.get("/plugins", response_model=list[PluginInfo])
async def get_plugins():
    return [PluginInfo(**p) for p in list_plugins()]


@router.get("/rooms", response_model=list[RoomResponse])
async def get_rooms(db: AsyncSession = Depends(get_db)):
    service = RoomService(db)
    return await service.list_rooms()


@router.post("/rooms", response_model=RoomResponse)
async def create_room(data: RoomCreate, db: AsyncSession = Depends(get_db)):
    service = RoomService(db)
    return await service.create_room(data.model_dump())


@router.get("/devices", response_model=list[DeviceResponse])
async def get_devices(room_id: str | None = None, db: AsyncSession = Depends(get_db)):
    service = DeviceService(db)
    return await service.list_devices(room_id)


@router.get("/devices/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str, db: AsyncSession = Depends(get_db)):
    service = DeviceService(db)
    device = await service.get_device(device_id)
    if not device:
        raise HTTPException(404, "Device not found")
    return device


@router.post("/devices", response_model=DeviceResponse)
async def create_device(data: DeviceCreate, db: AsyncSession = Depends(get_db)):
    service = DeviceService(db)
    return await service.add_device(data.model_dump())


@router.delete("/devices/{device_id}")
async def delete_device(device_id: str, db: AsyncSession = Depends(get_db)):
    service = DeviceService(db)
    if not await service.delete_device(device_id):
        raise HTTPException(404, "Device not found")
    return {"ok": True}


@router.patch("/devices/{device_id}/state", response_model=DeviceResponse)
async def update_device_state(
    device_id: str, data: DeviceStateUpdate, db: AsyncSession = Depends(get_db)
):
    service = DeviceService(db)
    try:
        return await service.update_device_state(device_id, data.state)
    except ValueError as e:
        raise HTTPException(404, str(e)) from e


@router.post("/devices/{device_id}/refresh", response_model=DeviceResponse)
async def refresh_device(device_id: str, db: AsyncSession = Depends(get_db)):
    service = DeviceService(db)
    try:
        return await service.refresh_device_state(device_id)
    except ValueError as e:
        raise HTTPException(404, str(e)) from e


@router.post("/plugins/{plugin_name}/discover", response_model=list[DeviceResponse])
async def discover_plugin_devices(plugin_name: str, db: AsyncSession = Depends(get_db)):
    service = DeviceService(db)
    try:
        return await service.discover_devices(plugin_name)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.post("/n8n/command", response_model=N8nResponse)
async def n8n_command(data: N8nCommand, db: AsyncSession = Depends(get_db)):
    """Webhook для n8n / LLM — управление устройствами голосом или текстом."""
    service = DeviceService(db)
    devices = await service.list_devices()

    targets = devices
    if data.device_id:
        targets = [d for d in devices if d.id == data.device_id]
    elif data.device_name:
        name_lower = data.device_name.lower()
        targets = [d for d in devices if name_lower in d.name.lower()]
    elif data.room:
        room_lower = data.room.lower()
        targets = [d for d in devices if d.room_id and room_lower in d.room_id.lower()]

    if not targets:
        return N8nResponse(success=False, message="Устройства не найдены")

    affected: list[str] = []
    for device in targets:
        state_update: dict = {}
        if data.action in ("turn_on", "on", "enable"):
            state_update = {"on": True}
        elif data.action in ("turn_off", "off", "disable"):
            state_update = {"on": False}
        elif data.action == "toggle":
            state_update = {"on": not device.state.get("on", False)}
        elif data.action == "set":
            state_update = data.params
        elif data.action == "set_brightness":
            state_update = {"brightness": data.params.get("brightness", 50), "on": True}
        elif data.action == "set_temperature":
            state_update = {"target": data.params.get("temperature", 22)}
        elif data.action == "open_cover":
            state_update = {"position": 100, "open": True}
        elif data.action == "close_cover":
            state_update = {"position": 0, "open": False}
        else:
            return N8nResponse(success=False, message=f"Неизвестное действие: {data.action}")

        try:
            await service.update_device_state(device.id, state_update)
            affected.append(device.id)
        except ValueError:
            continue

    return N8nResponse(
        success=len(affected) > 0,
        message=f"Обработано устройств: {len(affected)}",
        devices_affected=affected,
    )


@router.get("/n8n/devices")
async def n8n_list_devices(db: AsyncSession = Depends(get_db)):
    """Список устройств для n8n (упрощённый формат для LLM)."""
    service = DeviceService(db)
    devices = await service.list_devices()
    return [
        {
            "id": d.id,
            "name": d.name,
            "type": d.device_type,
            "room": d.room_id,
            "state": d.state,
            "online": d.is_online,
        }
        for d in devices
    ]
