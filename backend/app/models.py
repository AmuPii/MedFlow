from dataclasses import dataclass


VALID_STATUS = {"taken", "missed", "neutral"}


@dataclass(frozen=True)
class Record:
    date: str
    status: str

