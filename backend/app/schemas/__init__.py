from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DeviceStateUpdate(BaseModel):
    state: dict[str, Any]


class DeviceCreate(BaseModel):
    name: str
    plugin: str
    manufacturer: str = "unknown"
    device_type: str = "other"
    room_id: str | None = None
    config: dict[str, Any] = Field(default_factory=dict)
    state: dict[str, Any] = Field(default_factory=dict)
    icon: str = "device"


class DeviceResponse(BaseModel):
    id: str
    name: str
    manufacturer: str
    device_type: str
    plugin: str
    room_id: str | None
    is_online: bool
    state: dict[str, Any]
    capabilities: list[str]
    icon: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class RoomCreate(BaseModel):
    name: str
    icon: str = "home"
    color: str = "#6366f1"


class RoomResponse(BaseModel):
    id: str
    name: str
    icon: str
    color: str

    model_config = {"from_attributes": True}


class PluginInfo(BaseModel):
    name: str
    display_name: str
    description: str
    supported_manufacturers: list[str]


class N8nCommand(BaseModel):
    """Команда от n8n / LLM для управления устройством."""

    device_id: str | None = None
    device_name: str | None = None
    room: str | None = None
    action: str
    params: dict[str, Any] = Field(default_factory=dict)


class N8nResponse(BaseModel):
    success: bool
    message: str
    devices_affected: list[str] = Field(default_factory=list)


class SystemStatus(BaseModel):
    version: str
    plugins: list[PluginInfo]
    devices_count: int
    rooms_count: int
    mqtt_enabled: bool
