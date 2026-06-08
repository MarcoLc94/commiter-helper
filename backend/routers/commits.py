import calendar
import os
from datetime import date
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from services.git_service import build_report_days
from services.excel_service import generate_excel, generate_excel_v2
from models import ReportRequest

router = APIRouter()


REPOS_ROOT = "/home/bitfarm/Documentos"


@router.get("/repos")
def find_repos():
    repos = []
    seen: set[str] = set()

    for dirpath, dirnames, _ in os.walk(REPOS_ROOT):
        # Limita la búsqueda a 3 niveles de profundidad
        depth = dirpath.replace(REPOS_ROOT, "").count(os.sep)
        if depth >= 3:
            dirnames.clear()
            continue

        if ".git" in dirnames and dirpath not in seen:
            rel = os.path.relpath(dirpath, REPOS_ROOT)
            repos.append({"name": rel, "path": dirpath})
            seen.add(dirpath)
            dirnames.clear()  # no seguir dentro de un repo

    return sorted(repos, key=lambda r: r["name"].lower())


@router.get("/commits")
def get_commits(
    repo_path: str = Query(...),
    year: int = Query(...),
    month: int = Query(...),
    author: str = Query(default=""),
):
    _, last_day = calendar.monthrange(year, month)
    start = date(year, month, 1)
    end = date(year, month, last_day)
    return build_report_days(repo_path, start, end, author)


@router.post("/export")
def export_report(request: ReportRequest):
    buf = generate_excel(request)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="reporte.xlsx"'},
    )


@router.post("/export-v2")
def export_report_v2(request: ReportRequest):
    buf = generate_excel_v2(request)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="reporte_tags.xlsx"'},
    )
