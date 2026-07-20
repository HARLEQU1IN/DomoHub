import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.routes import router
from app.api.storage_routes import router as storage_router
from app.core.config import get_settings
from app.core.database import init_db
from app.services.device_service import DeviceService
from app.services.websocket import ws_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    from app.core.database import async_session

    async with async_session() as db:
        service = DeviceService(db)
        await service.ensure_defaults()

    logger.info("MarsFlow %s started", settings.app_version)
    yield
    logger.info("MarsFlow shutdown")


app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description="Универсальный хаб умного дома с поддержкой разных производителей",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"] if settings.debug else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix)
app.include_router(storage_router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    return {"status": "ok", "version": __version__}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "pong", "received": data})
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
