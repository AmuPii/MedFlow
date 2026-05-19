from pydantic import BaseModel, Field, field_validator

from .models import VALID_STATUS


class RecordUpdate(BaseModel):
    status: str = Field(..., description="taken|missed|neutral")

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str):
        if value not in VALID_STATUS:
            raise ValueError("status inválido")
        return value


class SettingsUpdate(BaseModel):
    notification_time: str

    @field_validator("notification_time")
    @classmethod
    def validate_time(cls, value: str):
        if len(value) != 5 or value[2] != ":":
            raise ValueError("Use formato HH:MM")
        hh, mm = value.split(":")
        if not (hh.isdigit() and mm.isdigit()):
            raise ValueError("Use formato HH:MM")
        hhi = int(hh)
        mmi = int(mm)
        if hhi < 0 or hhi > 23 or mmi < 0 or mmi > 59:
            raise ValueError("Horário inválido")
        return value


class SettingsResponse(BaseModel):
    notification_time: str

