import uuid
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Device, Room
from app.plugins import get_plugin
from app.services.websocket import ws_manager


DEFAULT_ROOM_IDS = ("living", "bedroom", "kitchen", "bathroom")


class DeviceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_defaults(self) -> None:
        await self.db.execute(delete(Device).where(Device.plugin == "demo"))
        await self.db.execute(delete(Room).where(Room.id.in_(DEFAULT_ROOM_IDS)))
        await self.db.commit()

    async def list_devices(self, room_id: str | None = None) -> list[Device]:
        query = select(Device)
        if room_id:
            query = query.where(Device.room_id == room_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_device(self, device_id: str) -> Device | None:
        result = await self.db.execute(select(Device).where(Device.id == device_id))
        return result.scalar_one_or_none()

    async def update_device_state(self, device_id: str, state: dict[str, Any]) -> Device:
        device = await self.get_device(device_id)
        if not device:
            raise ValueError(f"Device {device_id} not found")

        plugin = get_plugin(device.plugin)
        if not plugin:
            raise ValueError(f"Plugin {device.plugin} not found")

        new_state = await plugin.set_state(device_id, device.config, state)
        device.state = {**device.state, **new_state}
        device.is_online = True
        await self.db.commit()
        await self.db.refresh(device)

        await ws_manager.broadcast(
            {"type": "device_state_changed", "device_id": device_id, "state": device.state}
        )
        return device

    async def refresh_device_state(self, device_id: str) -> Device:
        device = await self.get_device(device_id)
        if not device:
            raise ValueError(f"Device {device_id} not found")

        plugin = get_plugin(device.plugin)
        if plugin:
            try:
                state = await plugin.get_state(device_id, device.config)
                device.state = state
                device.is_online = True
            except Exception:
                device.is_online = False
        await self.db.commit()
        await self.db.refresh(device)
        return device

    async def discover_devices(self, plugin_name: str) -> list[Device]:
        plugin = get_plugin(plugin_name)
        if not plugin:
            raise ValueError(f"Plugin {plugin_name} not found")

        discovered = await plugin.discover()
        created: list[Device] = []
        for item in discovered:
            existing = await self.get_device(item["id"])
            if existing:
                continue
            device = Device(
                id=item["id"],
                name=item["name"],
                manufacturer=item.get("manufacturer", "unknown"),
                device_type=item.get("device_type", "other"),
                plugin=plugin_name,
                room_id=item.get("room_id"),
                is_online=True,
                state=item.get("state", {}),
                config=item.get("config", {}),
                capabilities=item.get("capabilities", plugin.get_capabilities(item.get("device_type", "other"))),
                icon=item.get("icon", "device"),
            )
            self.db.add(device)
            created.append(device)
        await self.db.commit()
        return created

    async def add_device(self, data: dict[str, Any]) -> Device:
        device_id = data.get("id") or str(uuid.uuid4())
        device = Device(
            id=device_id,
            name=data["name"],
            manufacturer=data.get("manufacturer", "unknown"),
            device_type=data.get("device_type", "other"),
            plugin=data["plugin"],
            room_id=data.get("room_id"),
            is_online=True,
            state=data.get("state", {}),
            config=data.get("config", {}),
            capabilities=data.get("capabilities", []),
            icon=data.get("icon", "device"),
        )
        self.db.add(device)
        await self.db.commit()
        await self.db.refresh(device)
        return device

    async def delete_device(self, device_id: str) -> bool:
        device = await self.get_device(device_id)
        if not device:
            return False
        await self.db.delete(device)
        await self.db.commit()
        return True


class RoomService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_rooms(self) -> list[Room]:
        result = await self.db.execute(select(Room))
        return list(result.scalars().all())

    async def get_room(self, room_id: str) -> Room | None:
        result = await self.db.execute(select(Room).where(Room.id == room_id))
        return result.scalar_one_or_none()

    async def create_room(self, data: dict[str, Any]) -> Room:
        room_id = data.get("id") or str(uuid.uuid4())
        room = Room(
            id=room_id,
            name=data["name"],
            icon=data.get("icon", "home"),
            color=data.get("color", "#6366f1"),
        )
        self.db.add(room)
        await self.db.commit()
        await self.db.refresh(room)
        return room

    async def delete_room(self, room_id: str) -> bool:
        room = await self.get_room(room_id)
        if not room:
            return False
        devices = await self.db.execute(select(Device).where(Device.room_id == room_id))
        for device in devices.scalars().all():
            device.room_id = None
        await self.db.delete(room)
        await self.db.commit()
        return True
