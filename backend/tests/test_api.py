from datetime import datetime
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def build_client(tmp_path: Path) -> TestClient:
    app = create_app(data_dir=str(tmp_path))
    return TestClient(app)


def test_register_day_and_persist_status(tmp_path):
    client = build_client(tmp_path)
    payload = {"status": "taken"}
    response = client.put("/records/2026-05-18", json=payload)
    assert response.status_code == 200

    month = client.get("/records", params={"month": "2026-05"})
    assert month.status_code == 200
    assert month.json()["records"]["2026-05-18"] == "taken"


def test_update_to_neutral_removes_day(tmp_path):
    client = build_client(tmp_path)
    client.put("/records/2026-05-18", json={"status": "missed"})
    response = client.put("/records/2026-05-18", json={"status": "neutral"})
    assert response.status_code == 200

    month = client.get("/records", params={"month": "2026-05"})
    assert month.json()["records"].get("2026-05-18") is None


def test_notification_time_is_persistent(tmp_path):
    client = build_client(tmp_path)
    response = client.put("/settings", json={"notification_time": "21:45"})
    assert response.status_code == 200
    assert response.json()["notification_time"] == "21:45"

    # New app instance reading the same path must keep value.
    client2 = build_client(tmp_path)
    get_response = client2.get("/settings")
    assert get_response.status_code == 200
    assert get_response.json()["notification_time"] == "21:45"


def test_backup_file_created_after_record_update(tmp_path):
    client = build_client(tmp_path)
    client.put("/records/2026-05-18", json={"status": "taken"})
    backup_name = f"backup-{datetime.now().strftime('%Y-%m-%d')}.json"
    backup_file = tmp_path / "backups" / backup_name
    assert backup_file.exists()

