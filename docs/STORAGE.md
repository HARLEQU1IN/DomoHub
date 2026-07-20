# Сетевое хранилище MarsFlowHomeAssistant

Модуль файлового менеджера, вдохновлённый [NextExplorer](https://github.com/nxzai/NextExplorer), [FileRise](https://github.com/error311/FileRise), [PlainNAS](https://github.com/ismartcoding/plainnas) и [Filebrowser Quantum](https://github.com/gtsteffee/filebrowser).

## Возможности

- **Несколько томов** — локальные диски, NAS (SMB/NFS), смонтированные папки
- **Файловый браузер** — grid/list режимы, breadcrumbs, поиск
- **Операции** — загрузка, скачивание, удаление, создание папок
- **Статистика** — занятое место, количество файлов и папок

## API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/v1/storage/volumes` | GET | Список томов с usage |
| `/api/v1/storage/stats` | GET | Общая статистика |
| `/api/v1/storage/browse` | GET | Содержимое папки |
| `/api/v1/storage/search` | GET | Поиск файлов |
| `/api/v1/storage/upload` | POST | Загрузка файла |
| `/api/v1/storage/download` | GET | Скачивание |
| `/api/v1/storage/mkdir` | POST | Создать папку |
| `/api/v1/storage/files` | DELETE | Удалить файл/папку |

## Подключение NAS

### Docker

```yaml
services:
  backend:
    volumes:
      - /mnt/nas:/mnt/nas:ro  # или :rw для записи
    environment:
      - STORAGE_VOLUMES=[{"id":"nas","name":"NAS","path":"/mnt/nas","type":"smb","icon":"server"}]
```

### Несколько томов

```env
STORAGE_VOLUMES=[
  {"id":"local","name":"Локальное","path":"./data/storage","type":"local","icon":"hard-drive"},
  {"id":"nas","name":"Synology NAS","path":"/mnt/nas","type":"smb","icon":"server"},
  {"id":"backup","name":"Резерв","path":"/mnt/backup","type":"nfs","icon":"archive"}
]
```

## Планируется

- [ ] WebDAV доступ (как FileRise)
- [ ] Превью изображений и видео
- [ ] Шаринг по ссылкам (как NextExplorer)
- [ ] SMB/NFS монтирование из UI
- [ ] Интеграция с n8n для автобэкапов
