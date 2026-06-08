from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import get_db, SavedReport, SavedDay, SavedActivity
from models import DayReport

router = APIRouter()


class SaveReportRequest(BaseModel):
    name: str
    repo_path: str = ""
    author: str = ""
    year: int
    month: int
    days: list[DayReport]


@router.get("/saved-reports")
def list_saved_reports(db: Session = Depends(get_db)):
    reports = db.query(SavedReport).order_by(SavedReport.updated_at.desc()).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "repo_path": r.repo_path,
            "author": r.author,
            "year": r.year,
            "month": r.month,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in reports
    ]


@router.get("/saved-reports/{report_id}")
def get_saved_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(SavedReport).filter(SavedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return {
        "id": report.id,
        "name": report.name,
        "repo_path": report.repo_path,
        "author": report.author,
        "year": report.year,
        "month": report.month,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "days": [
            {
                "date": d.date,
                "weekday": d.weekday,
                "day_type": d.day_type,
                "total_hours": d.total_hours,
                "activities": [
                    {
                        "ticket": a.ticket,
                        "activity": a.activity,
                        "module": a.module,
                        "status": a.status,
                        "hours": a.hours,
                        "comments": a.comments,
                        "author": a.author,
                    }
                    for a in d.activities
                ],
            }
            for d in report.days
        ],
    }


@router.post("/saved-reports")
def create_saved_report(req: SaveReportRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    report = SavedReport(
        name=req.name,
        repo_path=req.repo_path,
        author=req.author,
        year=req.year,
        month=req.month,
        created_at=now,
        updated_at=now,
    )
    db.add(report)
    db.flush()
    _persist_days(db, report.id, req.days)
    db.commit()
    db.refresh(report)
    return {"id": report.id, "name": report.name, "created_at": report.created_at.isoformat()}


@router.put("/saved-reports/{report_id}")
def update_saved_report(report_id: int, req: SaveReportRequest, db: Session = Depends(get_db)):
    report = db.query(SavedReport).filter(SavedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    report.name = req.name
    report.updated_at = datetime.utcnow()
    for day in list(report.days):
        db.delete(day)
    db.flush()
    _persist_days(db, report.id, req.days)
    db.commit()
    return {"id": report.id, "updated_at": report.updated_at.isoformat()}


@router.delete("/saved-reports/{report_id}")
def delete_saved_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(SavedReport).filter(SavedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    db.delete(report)
    db.commit()
    return {"ok": True}


def _persist_days(db: Session, report_id: int, days: list[DayReport]):
    for d in days:
        day = SavedDay(
            report_id=report_id,
            date=d.date,
            weekday=d.weekday,
            day_type=d.day_type,
            total_hours=d.total_hours,
        )
        db.add(day)
        db.flush()
        for a in d.activities:
            db.add(SavedActivity(
                day_id=day.id,
                ticket=a.ticket,
                activity=a.activity,
                module=a.module,
                status=a.status,
                hours=a.hours,
                comments=a.comments,
                author=a.author,
            ))
