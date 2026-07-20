from app.plugins.base import DevicePlugin
from app.plugins.demo import DemoPlugin
from app.plugins.http_plugin import HttpPlugin
from app.plugins.mqtt_plugin import MqttPlugin
from app.plugins.tuya_plugin import TuyaPlugin

PLUGINS: dict[str, DevicePlugin] = {
    "demo": DemoPlugin(),
    "http": HttpPlugin(),
    "mqtt": MqttPlugin(),
    "tuya": TuyaPlugin(),
}


def get_plugin(name: str) -> DevicePlugin | None:
    return PLUGINS.get(name)


def list_plugins() -> list[dict]:
    return [
        {
            "name": p.name,
            "display_name": p.display_name,
            "description": p.description,
            "supported_manufacturers": p.supported_manufacturers,
        }
        for p in PLUGINS.values()
    ]
