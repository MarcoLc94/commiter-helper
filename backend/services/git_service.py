import subprocess
import re
from datetime import date, timedelta
from collections import defaultdict
from models import Activity, DayReport

WEEKDAYS_ES = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]
WORKDAY_HOURS = 8.0


def distribute_hours(n: int) -> list[float]:
    """Distribuye 8 horas entre n commits. Redondea a 0.5 y ajusta el último para llegar exacto a 8h."""
    if n == 0:
        return []
    base = round((WORKDAY_HOURS / n) * 2) / 2  # redondea al 0.5 más cercano
    hours = [base] * n
    diff = round(WORKDAY_HOURS - sum(hours), 1)
    hours[-1] = round(hours[-1] + diff, 1)
    return hours


def parse_commit(message: str, author: str) -> Activity:
    ticket = None
    module = "General"
    description = message.strip()

    ticket_match = re.search(r"(#\d+|[A-Z]+-\d+)", message)
    if ticket_match:
        ticket = ticket_match.group(1)

    conv = re.match(r"^(\w+)(?:\(([^)]+)\))?\s*:\s*(.+)", message, re.DOTALL)
    if conv:
        _, scope, desc = conv.groups()
        if scope:
            module = scope.replace("-", " ").title()
        description = desc.strip()

    return Activity(
        ticket=ticket,
        activity=description,
        module=module,
        status="Completado",
        hours=0.0,  # se asigna después con distribute_hours
        comments="",
        author=author,
    )


def get_commits_by_date(repo_path: str, start: date, end: date, author_filter: str) -> dict:
    cmd = [
        "git", "-C", repo_path, "log",
        f"--after={start.isoformat()} 00:00:00",
        f"--before={end.isoformat()} 23:59:59",
        "--format=%an|%ad|%s",
        "--date=format:%Y-%m-%d",
        "--no-merges",
    ]
    if author_filter:
        cmd += [f"--author={author_filter}"]

    result = subprocess.run(cmd, capture_output=True, text=True)
    by_date: dict[str, list[Activity]] = defaultdict(list)

    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        parts = line.split("|", 2)
        if len(parts) < 3:
            continue
        author_name, commit_date, message = parts
        by_date[commit_date].append(parse_commit(message, author_name))

    return by_date


def build_report_days(repo_path: str, start: date, end: date, author_filter: str) -> list[dict]:
    commits_by_date = get_commits_by_date(repo_path, start, end, author_filter)

    days = []
    current = start
    while current <= end:
        weekday_idx = current.weekday()
        weekday_name = WEEKDAYS_ES[weekday_idx]
        is_weekend = weekday_idx >= 5

        if is_weekend:
            day_type = "weekend"
            activities = []
        else:
            day_type = "workday"
            raw = commits_by_date.get(current.isoformat(), [])
            hours_list = distribute_hours(len(raw))
            activities = []
            for activity, hours in zip(raw, hours_list):
                d = activity.model_dump()
                d["hours"] = hours
                activities.append(d)

        total = sum(a["hours"] for a in activities)

        days.append({
            "date": current.isoformat(),
            "weekday": weekday_name,
            "day_type": day_type,
            "activities": activities,
            "total_hours": total,
        })
        current += timedelta(days=1)

    return days
