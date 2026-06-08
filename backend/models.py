from pydantic import BaseModel
from typing import Optional


class Activity(BaseModel):
    ticket: Optional[str] = None
    activity: str
    module: str = "General"
    status: str = "Completado"
    hours: float = 1.0
    comments: str = ""
    author: str = ""
    fd_ticket: Optional[str] = None
    tag: Optional[str] = None


class DayReport(BaseModel):
    date: str  # YYYY-MM-DD
    weekday: str
    day_type: str  # workday | weekend | holiday
    activities: list[Activity] = []
    total_hours: float = 0.0


class ReportRequest(BaseModel):
    days: list[DayReport]
    sheet_name: str = "Reporte Mensual"
