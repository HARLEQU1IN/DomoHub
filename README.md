# DomoHub

<p align="center">
  <img src="frontend/public/favicon.svg" width="64" height="64" alt="DomoHub">
</p>

<p align="center">
  <strong>Универсальный self-hosted хаб умного дома</strong><br>
  Управляйте устройствами разных производителей из одного красивого интерфейса
</p>

<p align="center">
  <a href="#быстрый-старт">Быстрый старт</a> •
  <a href="docs/ARCHITECTURE.md">Архитектура</a> •
  <a href="docs/DEPLOYMENT.md">Деплой</a> •
  <a href="docs/STORAGE.md">Хранилище</a> •
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

## Зачем DomoHub?

Умный дом сегодня — это хаос: Tuya, Xiaomi, Philips Hue, Shelly, Zigbee... Каждый производитель со своим приложением и облаком. А если у вас **два WiFi роутера** — устройства на одной сети, вы на другой — управлять ещё сложнее.

**DomoHub** решает это:

- **Один интерфейс** для всех устройств
- **Плагинная архитектура** — легко добавлять новых производителей
- **Self-hosted** — всё на вашем сервере, без облака
- **n8n / LLM** — управление голосом и текстом через AI
- **Сетевое хранилище** — файловый менеджер для NAS и локальных дисков
- **Красивый UI** — простой и понятный, без перегруза

## Стек технологий

| Слой | Технология | Почему |
|------|-----------|--------|
| Backend | **Python + FastAPI** | Быстрый async API, богатая экосистема IoT библиотек |
| Frontend | **React + Vite + Tailwind** | Современный UI, быстрая сборка |
| БД | **SQLite** (→ PostgreSQL) | Простой старт, легко мигрировать |
| Realtime | **WebSocket** | Мгновенное обновление состояния |
| IoT | **MQTT** | Универсальный протокол (Zigbee2MQTT, Tasmota, ESPHome) |
| Деплой | **Docker Compose** | Один `docker compose up` на сервере |
| AI | **n8n webhooks** | Гибкая интеграция с любой LLM |

### Вдохновение из open-source

Проект заимствует лучшие идеи из:

- [Home Assistant](https://github.com/home-assistant/core) — эталон интеграций
- [LogicaHome](https://github.com/Rovemark/logicahome) — MCP + адаптеры
- [Smart-House-MCP](https://github.com/MaheshBhushan/Smart-House-MCP) — единый API для разных брендов
- [Domoticz](https://github.com/domoticz/domoticz) — плагинная модель

## Быстрый старт

### Docker (рекомендуется)

```bash
git clone https://github.com/HARLEQU1IN/DomoHub.git
cd DomoHub
docker compose up -d
```

Откройте **http://localhost:8080**

### Локальная разработка

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (в другом терминале)
cd frontend
npm install
npm run dev
```

Откройте **http://localhost:5173**

## Решение проблемы двух WiFi роутеров

```
┌─────────────┐     WiFi 1      ┌──────────────┐
│  Ваш ПК/    │◄───────────────►│  Роутер 1    │
│  Телефон    │                 └──────────────┘
└──────┬──────┘
       │ VPN / Интернет
       ▼
┌─────────────┐                 ┌──────────────┐
│  VPS/Сервер │◄───────────────►│  Роутер 2    │
│  DomoHub    │     WiFi 2      │  (IoT сеть)  │
└─────────────┘                 └──────┬───────┘
                                       │
                              ┌────────┴────────┐
                              │ Умные устройства │
                              └─────────────────┘
```

**Варианты:**

1. **VPS/сервер** — разверните DomoHub на машине с доступом к сети IoT-устройств
2. **Tailscale / ZeroTier** — VPN-меш между вашим ПК и сервером в IoT-сети
3. **Облачные API** — Tuya Cloud, Xiaomi Cloud (плагины)
4. **MQTT брокер** — на роутере 2, DomoHub подключается удалённо

Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Плагины

| Плагин | Статус | Устройства |
|--------|--------|-----------|
| HTTP/REST | ✅ Готов | Shelly, ESP32, custom REST API |
| MQTT | ✅ Готов | Zigbee2MQTT, Tasmota, ESPHome |
| Tuya | 🔶 Beta | Smart Life, Gosund (LAN) |
| Hue | 📋 План | Philips Hue |
| Xiaomi | 📋 План | Aqara, Mi Home |
| Home Assistant | 📋 План | Мост к существующему HA |

## n8n / LLM управление

```bash
# Включить свет
curl -X POST http://localhost:8000/api/v1/n8n/command \
  -H "Content-Type: application/json" \
  -d '{"device_name": "Люстра гостиная", "action": "turn_on"}'

# Список устройств для LLM
curl http://localhost:8000/api/v1/n8n/devices
```

Подробнее: [docs/N8N_INTEGRATION.md](docs/N8N_INTEGRATION.md)

## API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/v1/devices` | GET | Список устройств |
| `/api/v1/devices/{id}/state` | PATCH | Изменить состояние |
| `/api/v1/rooms` | GET | Комнаты |
| `/api/v1/plugins` | GET | Доступные плагины |
| `/api/v1/n8n/command` | POST | Команда от n8n/LLM |
| `/ws` | WebSocket | Realtime обновления |

Swagger UI: **http://localhost:8000/docs**

## Лицензия

MIT — см. [LICENSE](LICENSE)
