import json
import os
import shutil
import sqlite3
import threading
from datetime import datetime
from pathlib import Path

from .models import VALID_STATUS

DEFAULT_NOTIFICATION_TIME = "09:00"


class Storage:
    def __init__(self, data_dir: str | None = None):
        if os.name == "nt":
            fallback_dir = Path.home() / "AppData" / "Local" / "MedFlow" / "data"
        else:
            fallback_dir = Path.home() / ".local" / "share" / "medflow"
        base_dir = Path(data_dir or os.getenv("MEDFLOW_DATA_DIR") or fallback_dir)
        self.data_dir = base_dir
        self.backup_dir = self.data_dir / "backups"
        self.db_path = self.data_dir / "medflow.db"
        self.lock = threading.Lock()
        self._ensure_dirs()
        self._init_db()

    def _ensure_dirs(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS records (
                    date TEXT PRIMARY KEY,
                    status TEXT NOT NULL CHECK(status IN ('taken', 'missed'))
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                INSERT OR IGNORE INTO settings (key, value)
                VALUES ('notification_time', ?)
                """,
                (DEFAULT_NOTIFICATION_TIME,),
            )
            conn.commit()

    def get_records_by_month(self, month: str) -> dict[str, str]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT date, status
                FROM records
                WHERE substr(date, 1, 7) = ?
                ORDER BY date
                """,
                (month,),
            ).fetchall()
        return {row["date"]: row["status"] for row in rows}

    def get_all_records(self) -> dict[str, str]:
        with self._connect() as conn:
            rows = conn.execute("SELECT date, status FROM records ORDER BY date").fetchall()
        return {row["date"]: row["status"] for row in rows}

    def set_record(self, date_str: str, status: str):
        if status not in VALID_STATUS:
            raise ValueError("status inválido")

        with self.lock:
            with self._connect() as conn:
                if status == "neutral":
                    conn.execute("DELETE FROM records WHERE date = ?", (date_str,))
                else:
                    conn.execute(
                        """
                        INSERT INTO records (date, status)
                        VALUES (?, ?)
                        ON CONFLICT(date) DO UPDATE SET status = excluded.status
                        """,
                        (date_str, status),
                    )
                conn.commit()
            self._maybe_backup()

    def get_notification_time(self) -> str:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT value FROM settings WHERE key = 'notification_time'"
            ).fetchone()
        return row["value"] if row else DEFAULT_NOTIFICATION_TIME

    def set_notification_time(self, notification_time: str):
        with self.lock, self._connect() as conn:
            conn.execute(
                """
                INSERT INTO settings (key, value)
                VALUES ('notification_time', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (notification_time,),
            )
            conn.commit()

    def _get_last_backup_date(self) -> str | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT value FROM metadata WHERE key = 'last_backup_date'"
            ).fetchone()
        return row["value"] if row else None

    def _set_last_backup_date(self, day: str):
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO metadata (key, value)
                VALUES ('last_backup_date', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (day,),
            )
            conn.commit()

    def _maybe_backup(self):
        today = datetime.now().strftime("%Y-%m-%d")
        if self._get_last_backup_date() == today:
            return

        backup_file = self.backup_dir / f"backup-{today}.json"
        payload = {
            "backup_date": today,
            "notification_time": self.get_notification_time(),
            "records": self.get_all_records(),
        }
        with backup_file.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        # keep only last 30 backups to reduce disk usage
        backups = sorted(self.backup_dir.glob("backup-*.json"))
        if len(backups) > 30:
            for old_file in backups[:-30]:
                old_file.unlink(missing_ok=True)

        sqlite_backup = self.backup_dir / f"medflow-{today}.db"
        shutil.copy2(self.db_path, sqlite_backup)
        self._set_last_backup_date(today)
