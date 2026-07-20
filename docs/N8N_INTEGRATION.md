# Интеграция с n8n и LLM

DomoHub предоставляет webhook API для управления устройствами из n8n, Telegram-ботов, голосовых ассистентов и любых LLM.

## API Endpoints

### POST `/api/v1/n8n/command`

Выполнить команду на устройстве.

**Тело запроса:**

```json
{
  "device_id": "demo-light-living",
  "action": "turn_on"
}
```

Или поиск по имени:

```json
{
  "device_name": "Люстра",
  "action": "turn_on"
}
```

Или по комнате:

```json
{
  "room": "bedroom",
  "action": "turn_off"
}
```

### Доступные действия

| action | params | Описание |
|--------|--------|----------|
| `turn_on` / `on` | — | Включить |
| `turn_off` / `off` | — | Выключить |
| `toggle` | — | Переключить |
| `set` | `{...}` | Произвольное состояние |
| `set_brightness` | `{"brightness": 50}` | Яркость 1-100 |
| `set_temperature` | `{"temperature": 22}` | Целевая температура |
| `open_cover` | — | Открыть шторы |
| `close_cover` | — | Закрыть шторы |

### GET `/api/v1/n8n/devices`

Список устройств в упрощённом формате для LLM.

```json
[
  {
    "id": "demo-light-living",
    "name": "Люстра гостиная",
    "type": "light",
    "room": "living",
    "state": {"on": true, "brightness": 80},
    "online": true
  }
]
```

## Пример n8n workflow

```
[Webhook Trigger] → [HTTP Request: GET /n8n/devices] → [OpenAI Chat] → [HTTP Request: POST /n8n/command]
```

### Шаг 1: Webhook Trigger

Принимает текст от пользователя: "Включи свет в гостиной"

### Шаг 2: Получить устройства

```
GET http://domohub:8000/api/v1/n8n/devices
```

### Шаг 3: LLM (OpenAI / Ollama)

System prompt:

```
Ты — ассистент умного дома. У тебя есть список устройств.
Определи действие и верни JSON:
{"device_name": "...", "action": "turn_on|turn_off|toggle|set_brightness", "params": {}}
```

### Шаг 4: Выполнить команду

```
POST http://domohub:8000/api/v1/n8n/command
Body: {{ $json }}
```

## Telegram бот (n8n)

```
[Telegram Trigger] → [Switch: команда] → [HTTP Request: POST /n8n/command] → [Telegram: ответ]
```

Команды:
- `/on Люстра` → `{"device_name": "Люстра", "action": "turn_on"}`
- `/off all bedroom` → `{"room": "bedroom", "action": "turn_off"}`

## Ollama (локальная LLM)

```bash
# n8n HTTP Request к Ollama
POST http://ollama:11434/api/generate
{
  "model": "llama3",
  "prompt": "User said: 'включи свет в спальне'. Devices: [...]. Return JSON command.",
  "stream": false
}
```

## Будущее: MCP сервер

В v0.3 планируется нативный MCP (Model Context Protocol) сервер —
прямая интеграция с Claude, Cursor и другими AI-ассистентами без n8n.

Вдохновение: [LogicaHome](https://github.com/Rovemark/logicahome), [Smart-House-MCP](https://github.com/MaheshBhushan/Smart-House-MCP)
