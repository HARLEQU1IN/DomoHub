from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "DomoHub"
    app_version: str = "0.1.0"
    debug: bool = True
    api_prefix: str = "/api/v1"

    database_url: str = "sqlite+aiosqlite:///./data/domohub.db"

    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    access_token_expire_minutes: int = 60 * 24 * 7

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"]

    mqtt_enabled: bool = False
    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    mqtt_username: str | None = None
    mqtt_password: str | None = None
    mqtt_topic_prefix: str = "domohub"

    n8n_webhook_secret: str | None = None

    data_dir: Path = Path("./data")

    # Сетевые хранилища: [{"id":"nas","name":"NAS","path":"/mnt/nas","type":"smb","icon":"server"}]
    storage_volumes: list[dict] = []


@lru_cache
def get_settings() -> Settings:
    return Settings()
