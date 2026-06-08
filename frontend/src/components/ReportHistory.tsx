import { useEffect, useState } from "react"
import type { SavedReportSummary } from "../types"
import { fetchSavedReports, deleteSavedReport } from "../api/client"

const MONTHS_ES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface Props {
  onLoad: (id: number) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function ReportHistory({ onLoad }: Props) {
  const [reports, setReports] = useState<SavedReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      setReports(await fetchSavedReports())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: number, name: string) {
    if (!confirm(`¿Eliminar el reporte "${name}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(id)
    try {
      await deleteSavedReport(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Cargando historial...
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No hay reportes guardados aún.</p>
        <p className="text-xs">Genera un reporte y usa "Guardar reporte" para almacenarlo aquí.</p>
      </div>
    )
  }

  return (
    <div className="p-4 grid grid-cols-1 gap-3 auto-rows-min">
      {reports.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex items-start justify-between gap-4 hover:border-blue-300 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-sm truncate">{r.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {MONTHS_ES[r.month]} {r.year}
              {r.author && <span className="ml-2 text-slate-400">· {r.author}</span>}
            </p>
            {r.repo_path && (
              <p className="text-xs text-slate-400 truncate mt-0.5" title={r.repo_path}>
                {r.repo_path.split("/").slice(-2).join("/")}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Actualizado: {formatDate(r.updated_at)}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => onLoad(r.id)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors"
            >
              Cargar
            </button>
            <button
              onClick={() => handleDelete(r.id, r.name)}
              disabled={deletingId === r.id}
              className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-500 border border-red-200 hover:border-red-400 text-xs font-semibold rounded transition-colors disabled:opacity-50"
            >
              {deletingId === r.id ? "..." : "Eliminar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
