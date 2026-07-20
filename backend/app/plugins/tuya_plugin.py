from typing import Any

from app.plugins.base import DevicePlugin


class TuyaPlugin(DevicePlugin):
    """Плагин для устройств Tuya / Smart Life (локальный LAN)."""

    name = "tuya"
    display_name = "Tuya / Smart Life"
    description = "Лампы, розетки, выключатели Tuya (локальное управление через LAN)"
    supported_manufacturers = ["Tuya", "Smart Life", "Gosund", "Teckin"]

    async def discover(self) -> list[dict[str, Any]]:
        # Для полной интеграции установите tinytuya: pip install tinytuya
        # и настройте devices.json через Tuya IoT Platform
        return []

    async def get_state(self, device_id: str, config: dict[str, Any]) -> dict[str, Any]:
        try:
            import tinytuya  # type: ignore
        except ImportError:
            return {"on": False, "error": "tinytuya not installed"}

        device = tinytuya.Device(
            dev_id=config.get("device_id", device_id),
            address=config.get("ip"),
            local_key=config.get("local_key"),
            version=config.get("version", "3.3"),
        )
        status = device.status()
        dps = status.get("dps", {})
        return self._dps_to_state(dps, config.get("device_type", "switch"))

    async def set_state(self, device_id: str, config: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
        try:
            import tinytuya  # type: ignore
        except ImportError:
            raise RuntimeError("Install tinytuya: pip install tinytuya")

        device = tinytuya.Device(
            dev_id=config.get("device_id", device_id),
            address=config.get("ip"),
            local_key=config.get("local_key"),
            version=config.get("version", "3.3"),
        )
        dps = self._state_to_dps(state, config.get("device_type", "switch"))
        device.set_multiple_values(dps)
        return await self.get_state(device_id, config)

    def _dps_to_state(self, dps: dict, device_type: str) -> dict[str, Any]:
        if device_type == "light":
            return {
                "on": dps.get("1", dps.get("20", False)),
                "brightness": dps.get("3", dps.get("22", 100)),
            }
        return {"on": dps.get("1", False)}

    def _state_to_dps(self, state: dict[str, Any], device_type: str) -> dict[str, Any]:
        dps: dict[str, Any] = {}
        if "on" in state:
            dps["1"] = state["on"]
        if device_type == "light" and "brightness" in state:
            dps["3"] = state["brightness"]
        return dps
