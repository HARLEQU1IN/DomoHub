# Развёртывание MarsFlow

## Docker Compose (рекомендуется)

### Минимальный деплой

```bash
git clone https://github.com/HARLEQU1IN/MarsFlow.git
cd MarsFlow
docker compose up -d
```

- UI: http://your-server:8080
- API: http://your-server:8000
- Swagger: http://your-server:8000/docs

### С MQTT брокером

```bash
# В .env
MQTT_ENABLED=true
MQTT_HOST=mosquitto

docker compose --profile mqtt up -d
```

### Переменные окружения

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `SECRET_KEY` | change-me | Секретный ключ (смените!) |
| `MQTT_ENABLED` | false | Включить MQTT |
| `MQTT_HOST` | localhost | Адрес MQTT брокера |
| `MQTT_PORT` | 1883 | Порт MQTT |
| `DEBUG` | false | Режим отладки |

## VPS / облако

### Требования

- 1 CPU, 512 MB RAM (минимум)
- 1 GB RAM (с MQTT + несколько плагинов)
- Ubuntu 22.04+ / Debian 12+
- Docker + Docker Compose

### Caddy (HTTPS)

```
your-domain.com {
    reverse_proxy localhost:8080
}
```

### Systemd (без Docker)

```bash
# Backend
cd /opt/MarsFlow/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# systemd unit: /etc/systemd/system/marsflow.service
[Unit]
Description=MarsFlow Backend
After=network.target

[Service]
User=marsflow
WorkingDirectory=/opt/MarsFlow/backend
ExecStart=/opt/MarsFlow/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## Raspberry Pi

```bash
# На Raspberry Pi OS
sudo apt install docker.io docker-compose-plugin
git clone https://github.com/HARLEQU1IN/MarsFlow.git
cd MarsFlow
docker compose up -d
```

Подключите Pi к роутеру с IoT-устройствами. Доступ к UI через Tailscale.

## Tailscale (доступ из другой сети)

```bash
# На сервере с MarsFlow
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# На вашем ПК/телефоне — установите Tailscale
# Откройте http://<tailscale-ip>:8080
```

## Обновление

```bash
cd MarsFlow
git pull
docker compose build
docker compose up -d
```

Данные сохраняются в Docker volume `marsflow-data`.
