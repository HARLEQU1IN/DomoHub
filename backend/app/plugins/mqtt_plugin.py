import json
from typing import Any

from app.core.config import get_settings
from app.plugins.base import DevicePlugin

settings = get_settings()


class MqttPlugin(DevicePlugin):
    """MQTT-плагин для устройств, подключённых через брокер."""

    name = "mqtt"
    display_name = "MQTT"
    description = "Универсальный протокол для IoT (Zigbee2MQTT, Tasmota, ESPHome)"
    supported_manufacturers = ["Zigbee", "Tasmota", "ESPHome", "Tuya via MQTT"]

    _states: dict[str, dict[str, Any]] = {}

    async def discover(self) -> list[dict[str, Any]]:
        return []

    async def get_state(self, device_id: str, config: dict[str, Any]) -> dict[str, Any]:
        return self._states.get(device_id, config.get("default_state", {}))

    async def set_state(self, device_id: str, config: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
        if not settings.mqtt_enabled:
            self._states[device_id] = {**self._states.get(device_id, {}), **state}
            return self._states[device_id]

        try:
            import aiomqtt
        except ImportError:
            self._states[device_id] = state
            return state

        topic = config.get("command_topic", f"{settings.mqtt_topic_prefix}/{device_id}/set")
        payload = json.dumps(state)
        async with aiomqtt.Client(
            hostname=settings.mqtt_host,
            port=settings.mqtt_port,
            username=settings.mqtt_username,
            password=settings.mqtt_password,
        ) as client:
            await client.publish(topic, payload)
        self._states[device_id] = state
        return state

    def update_state_from_mqtt(self, device_id: str, payload: dict[str, Any]) -> None:
        current = self._states.get(device_id, {})
        current.update(payload)
        self._states[device_id] = current
