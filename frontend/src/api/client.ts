import type { DayReport, Repo } from "../types"

const BASE = "http://localhost:8000/api"

export async function fetchRepos(): Promise<Repo[]> {
  const res = await fetch(`${BASE}/repos`)
  if (!res.ok) throw new Error("Error al cargar repositorios")
  return res.json()
}

export async function fetchCommits(
  repoPath: string,
  year: number,
  month: number,
  author: string
): Promise<DayReport[]> {
  const params = new URLSearchParams({
    repo_path: repoPath,
    year: String(year),
    month: String(month),
    author,
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
