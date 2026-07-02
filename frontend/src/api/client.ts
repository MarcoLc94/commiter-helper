import type { DayReport, Repo, SavedReportSummary, SavedReportDetail } from "../types"

const BASE = "http://localhost:8000/api"

export async function fetchRepos(): Promise<Repo[]> {
  const res = await fetch(`${BASE}/repos`)
  if (!res.ok) throw new Error("Error al cargar repositorios")
  return res.json()
}

export async function fetchBranches(repoPath: string): Promise<string[]> {
  const params = new URLSearchParams({ repo_path: repoPath })
  const res = await fetch(`${BASE}/branches?${params}`)
  if (!res.ok) throw new Error("Error al cargar ramas")
  return res.json()
}

export async function fetchCommits(
  repoPath: string,
  year: number,
  month: number,
  author: string,
  branch: string = ""
): Promise<DayReport[]> {
  const params = new URLSearchParams({
    repo_path: repoPath,
    year: String(year),
    month: String(month),
    author,
    branch,
  })
  const res = await fetch(`${BASE}/commits?${params}`)
  if (!res.ok) throw new Error("Error al leer commits")
  return res.json()
}

export async function exportReport(
  days: DayReport[],
  sheetName: string
): Promise<Blob> {
  const res = await fetch(`${BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days, sheet_name: sheetName }),
  })
  if (!res.ok) throw new Error("Error al exportar")
  return res.blob()
}

export async function exportReportV2(
  days: DayReport[],
  sheetName: string
): Promise<Blob> {
  const res = await fetch(`${BASE}/export-v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days, sheet_name: sheetName }),
  })
  if (!res.ok) throw new Error("Error al exportar v2")
  return res.blob()
}

export async function fetchSavedReports(): Promise<SavedReportSummary[]> {
  const res = await fetch(`${BASE}/saved-reports`)
  if (!res.ok) throw new Error("Error al cargar historial")
  return res.json()
}

export async function fetchSavedReport(id: number): Promise<SavedReportDetail> {
  const res = await fetch(`${BASE}/saved-reports/${id}`)
  if (!res.ok) throw new Error("Error al cargar reporte")
  return res.json()
}

export async function createSavedReport(payload: {
  name: string
  repo_path: string
  author: string
  year: number
  month: number
  days: DayReport[]
}): Promise<{ id: number; name: string; created_at: string }> {
  const res = await fetch(`${BASE}/saved-reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Error al guardar reporte")
  return res.json()
}

export async function updateSavedReport(
  id: number,
  payload: {
    name: string
    repo_path: string
    author: string
    year: number
    month: number
    days: DayReport[]
  }
): Promise<{ id: number; updated_at: string }> {
  const res = await fetch(`${BASE}/saved-reports/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Error al actualizar reporte")
  return res.json()
}

export async function deleteSavedReport(id: number): Promise<void> {
  const res = await fetch(`${BASE}/saved-reports/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar reporte")
}
