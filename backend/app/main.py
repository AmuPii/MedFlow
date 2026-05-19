from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .database import Storage
from .schemas import RecordUpdate, SettingsResponse, SettingsUpdate
from .services import calculate_stats


def create_app(data_dir: str | None = None) -> FastAPI:
    app = FastAPI(title="MedFlow API", version="1.0.0")
    storage = Storage(data_dir=data_dir)
    app.state.storage = storage

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/records")
    def get_records(month: str = Query(..., pattern=r"^\d{4}-\d{2}$")):
        return {"month": month, "records": storage.get_records_by_month(month)}

    @app.put("/records/{date_str}")
    def update_record(date_str: str, payload: RecordUpdate):
        try:
            datetime.fromisoformat(date_str)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Data inválida, use YYYY-MM-DD") from exc

        storage.set_record(date_str, payload.status)
        month = date_str[:7]
        return {"ok": True, "records": storage.get_records_by_month(month)}

    @app.get("/settings", response_model=SettingsResponse)
    def get_settings():
        return SettingsResponse(notification_time=storage.get_notification_time())

    @app.put("/settings", response_model=SettingsResponse)
    def update_settings(payload: SettingsUpdate):
        storage.set_notification_time(payload.notification_time)
        return SettingsResponse(notification_time=storage.get_notification_time())

    @app.get("/stats")
    def get_stats():
        records = storage.get_all_records()
        return calculate_stats(records)

    return app
