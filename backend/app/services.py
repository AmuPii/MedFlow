from datetime import date, datetime, timedelta


def calculate_stats(records: dict[str, str]) -> dict[str, float | int]:
    if not records:
        return {
            "total_registrados": 0,
            "tomados": 0,
            "nao_tomados": 0,
            "aderencia_percentual": 0.0,
            "streak_atual": 0,
            "melhor_streak": 0,
        }

    total = len(records)
    taken = sum(1 for status in records.values() if status == "taken")
    missed = total - taken
    adherence = round((taken / total) * 100, 2) if total else 0.0
    streak_current, streak_best = calculate_streak(records)

    return {
        "total_registrados": total,
        "tomados": taken,
        "nao_tomados": missed,
        "aderencia_percentual": adherence,
        "streak_atual": streak_current,
        "melhor_streak": streak_best,
    }


def calculate_streak(records: dict[str, str]) -> tuple[int, int]:
    taken_days = sorted(
        date.fromisoformat(day)
        for day, status in records.items()
        if status == "taken"
    )
    if not taken_days:
        return 0, 0

    best = 1
    current_chain = 1
    for idx in range(1, len(taken_days)):
        if taken_days[idx] - taken_days[idx - 1] == timedelta(days=1):
            current_chain += 1
            best = max(best, current_chain)
        else:
            current_chain = 1

    today = date.today()
    yesterday = today - timedelta(days=1)
    last = taken_days[-1]
    if last not in (today, yesterday):
        return 0, best

    current = 1
    i = len(taken_days) - 1
    while i > 0 and taken_days[i] - taken_days[i - 1] == timedelta(days=1):
        current += 1
        i -= 1
    return current, best


def month_from_date(date_str: str) -> str:
    return datetime.fromisoformat(date_str).strftime("%Y-%m")

