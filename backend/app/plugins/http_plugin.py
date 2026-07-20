from typing import Any

import httpx

from app.plugins.base import DevicePlugin


class HttpPlugin(DevicePlugin):
    """Универсальный HTTP-плагин для REST API устройств."""

    name = "http"
    display_name = "HTTP / REST"
    description = "Устройства с REST API (ESP32, Shelly, custom)"
    supported_manufacturers = ["Shelly", "ESP", "Custom"]

    async def discover(self) -> list[dict[str, Any]]:
        return []

    async def get_state(self, device_id: str, config: dict[str, Any]) -> dict[str, Any]:
        url = config.get("state_url")
        if not url:
            return {}
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers=config.get("headers", {}))
            response.raise_for_status()
            return response.json()

    async def set_state(self, device_id: str, config: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
        url = config.get("command_url")
        if not url:
            raise ValueError("command_url not configured")
        method = config.get("method", "POST").upper()
        async with httpx.AsyncClient(timeout=10) as client:
            if method == "PUT":
                response = await client.put(url, json=state, headers=config.get("headers", {}))
            else:
                response = await client.post(url, json=state, headers=config.get("headers", {}))
            response.raise_for_status()
            return response.json() if response.content else state
