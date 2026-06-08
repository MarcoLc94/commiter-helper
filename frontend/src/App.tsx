import { useState } from "react"
import { Sidebar } from "./components/Sidebar"
import { ReportTable } from "./components/ReportTable"
import { ReportHistory } from "./components/ReportHistory"
import { SaveModal } from "./components/SaveModal"
import { fetchCommits, exportReport, fetchSavedReport, createSavedReport, updateSavedReport } from "./api/client"
import type { DayReport } from "./types"

const MONTHS_ES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

type View = "generator" | "history"

interface LoadedReport {
  id: number
  name: string
}

export default function App() {
  const now = new Date()
  const [view, setView] = useState<View>("generator")
  const [config, setConfig] = useState({
    repoPath: "",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    author: "marco",
  })
  const [days, setDays] = useState<DayReport[]>([])
  const [loadedReport, setLoadedReport] = useState<LoadedReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showSaveModal, setShowSaveModal] = useState(false)

  function handleChange(field: string, value: string | number) {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  function handleViewChange(v: View) {
    setView(v)
    setError("")
  }

  async function handleGenerate() {
    if (!config.repoPath) return
    setLoading(true)
    setError("")
    setLoadedReport(null)
    try {
      const data = await fetchCommits(config.repoPath, config.year, config.month, config.author)
      setDays(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadSaved(id: number) {
    setLoading(true)
    setError("")
    try {
      const detail = await fetchSavedReport(id)
      setDays(detail.days)
      setConfig((prev) => ({
        ...prev,
        repoPath: detail.repo_path || prev.repoPath,
        author: detail.author || prev.author,
        year: detail.year,
        month: detail.month,
      }))
      setLoadedReport({ id: detail.id, name: detail.name })
      setView("generator")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar reporte")
    } finally {
      setLoading(false)
    }
  }

  function defaultReportName() {
    return `Reporte ${MONTHS_ES[config.month]} ${config.year}`
  }

  async function handleSaveConfirm(name: string) {
    setShowSaveModal(false)
    setSaving(true)
    setError("")
    try {
      if (loadedReport) {
        await updateSavedReport(loadedReport.id, {
          name,
          repo_path: config.repoPath,
          author: config.author,
          year: config.year,
          month: config.month,
          days,
        })
        setLoadedReport({ ...loadedReport, name })
      } else {
        const result = await createSavedReport({
          name,
          repo_path: config.repoPath,
          author: config.author,
          year: config.year,
          month: config.month,
          days,
        })
        setLoadedReport({ id: result.id, name: result.name })
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExport() {
    if (days.length === 0) return
    setExporting(true)
    try {
      const sheetName = `Reporte ${MONTHS_ES[config.month]} ${config.year}`
      const blob = await exportReport(days, sheetName)
      await downloadBlob(blob, `reporte_${config.year}_${String(config.month).padStart(2, "0")}.xlsx`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al exportar")
    } finally {
      setExporting(false)
    }
  }

  async function handleExportDay(day: DayReport) {
    try {
      const [y, m, d] = day.date.split("-")
      const sheetName = `${day.weekday} ${d}-${m}-${y}`
      const blob = await exportReport([day], sheetName)
      await downloadBlob(blob, `reporte_${day.date}.xlsx`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al exportar día")
    }
  }

  const totalHours = days.reduce((s, d) => s + d.total_hours, 0)
  const workDays = days.filter(
    (d) => d.day_type === "workday" && d.activities.length > 0
  ).length

  const headerTitle = loadedReport
    ? loadedReport.name
    : days.length > 0
      ? `Reporte ${MONTHS_ES[config.month]} ${config.year}`
      : "Sin reporte generado"

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        view={view}
        repoPath={config.repoPath}
        year={config.year}
        month={config.month}
        author={config.author}
        loading={loading}
        onViewChange={handleViewChange}
        onChange={handleChange}
        onGenerate={handleGenerate}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-700 text-base">
              {view === "history" ? "Historial de reportes" : headerTitle}
            </h2>
            {view === "generator" && days.length > 0 && (
              <p className="text-xs text-slate-400">
                {workDays} días trabajados · {totalHours.toFixed(1)} horas totales
                {loadedReport && (
                  <span className="ml-2 text-blue-500">· guardado en DB</span>
                )}
              </p>
            )}
          </div>

          {view === "generator" && days.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? "Guardando..." : loadedReport ? "Actualizar reporte" : "Guardar reporte"}
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {exporting ? "Exportando..." : "Exportar Excel"}
              </button>
            </div>
          )}
        </header>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <main className="flex-1 overflow-auto p-4">
          {view === "history" ? (
            <ReportHistory onLoad={handleLoadSaved} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ReportTable days={days} onChange={setDays} onExportDay={handleExportDay} />
            </div>
          )}
        </main>
      </div>

      {showSaveModal && (
        <SaveModal
          defaultName={loadedReport ? loadedReport.name : defaultReportName()}
          onConfirm={handleSaveConfirm}
          onCancel={() => setShowSaveModal(false)}
        />
      )}
    </div>
  )
}
