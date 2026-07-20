from abc import ABC, abstractmethod
from typing import Any


class DevicePlugin(ABC):
    """Базовый класс плагина для интеграции устройств разных производителей."""

    name: str = "base"
    display_name: str = "Base Plugin"
    description: str = ""
    supported_manufacturers: list[str] = []

    @abstractmethod
    async def discover(self) -> list[dict[str, Any]]:
        """Обнаружение устройств в сети."""

    @abstractmethod
    async def get_state(self, device_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """Получить текущее состояние устройства."""

    @abstractmethod
    async def set_state(self, device_id: str, config: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
        """Изменить состояние устройства."""

    async def connect(self) -> None:
        """Подключение к сервису/сети (опционально)."""

    async def disconnect(self) -> None:
        """Отключение (опционально)."""

    def get_capabilities(self, device_type: str) -> list[str]:
        caps_map = {
            "light": ["on_off", "brightness", "color"],
            "switch": ["on_off"],
            "sensor": ["temperature", "humidity", "motion"],
            "climate": ["temperature", "mode", "fan"],
            "cover": ["open", "close", "position"],
        }
        return caps_map.get(device_type, ["on_off"])
