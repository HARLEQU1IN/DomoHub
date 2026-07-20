import random
import uuid
from typing import Any

from app.plugins.base import DevicePlugin


class DemoPlugin(DevicePlugin):
    """Демо-плагин с виртуальными устройствами для тестирования UI."""

    name = "demo"
    display_name = "Demo Devices"
    description = "Виртуальные устройства для демонстрации и разработки"
    supported_manufacturers = ["DomoHub"]

    _devices: dict[str, dict[str, Any]] = {
        "demo-light-living": {
            "name": "Люстра гостиная",
            "manufacturer": "DomoHub",
            "device_type": "light",
            "room_id": "living",
            "icon": "lightbulb",
            "state": {"on": True, "brightness": 80, "color": "#fbbf24"},
        },
        "demo-light-bedroom": {
            "name": "Свет спальня",
            "manufacturer": "DomoHub",
            "device_type": "light",
            "room_id": "bedroom",
            "icon": "lightbulb",
            "state": {"on": False, "brightness": 50, "color": "#a78bfa"},
        },
        "demo-switch-kitchen": {
            "name": "Розетка кухня",
            "manufacturer": "DomoHub",
            "device_type": "switch",
            "room_id": "kitchen",
            "icon": "plug",
            "state": {"on": True},
        },
        "demo-sensor-bathroom": {
            "name": "Датчик влажности",
            "manufacturer": "DomoHub",
            "device_type": "sensor",
            "room_id": "bathroom",
            "icon": "droplets",
            "state": {"temperature": 23.5, "humidity": 65, "motion": False},
        },
        "demo-climate-living": {
            "name": "Кондиционер",
            "manufacturer": "DomoHub",
            "device_type": "climate",
            "room_id": "living",
            "icon": "thermometer",
            "state": {"on": True, "temperature": 22, "target": 24, "mode": "cool"},
        },
        "demo-cover-bedroom": {
            "name": "Шторы спальня",
            "manufacturer": "DomoHub",
            "device_type": "cover",
            "room_id": "bedroom",
            "icon": "blinds",
            "state": {"position": 75, "open": False},
        },
    }

    async def discover(self) -> list[dict[str, Any]]:
        result = []
        for device_id, info in self._devices.items():
            result.append(
                {
                    "id": device_id,
                    "plugin": self.name,
                    "capabilities": self.get_capabilities(info["device_type"]),
                    **info,
                }
            )
        return result

    async def get_state(self, device_id: str, config: dict[str, Any]) -> dict[str, Any]:
        device = self._devices.get(device_id)
        if not device:
            return {}
        state = dict(device["state"])
        if device["device_type"] == "sensor":
            state["temperature"] = round(22 + random.uniform(-1, 2), 1)
            state["humidity"] = round(60 + random.uniform(-5, 5), 0)
        return state

    async def set_state(self, device_id: str, config: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
        device = self._devices.get(device_id)
        if not device:
            raise ValueError(f"Device {device_id} not found")
        device["state"].update(state)
        return device["state"]
