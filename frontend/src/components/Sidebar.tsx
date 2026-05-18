import { useEffect, useState } from "react"
import type { Repo } from "../types"
import { fetchRepos } from "../api/client"

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface Props {
  repoPath: string
  year: number
  month: number
  author: string
  loading: boolean
  onChange: (field: string, value: string | number) => void
  onGenerate: () => void
}

export function Sidebar({ repoPath, year, month, author, loading, onChange, onGenerate }: Props) {
  const [repos, setRepos] = useState<Repo[]>([])
  const [customPath, setCustomPath] = useState("")

  useEffect(() => {
    fetchRepos().then(setRepos).catch(() => {})
  }, [])

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <aside className="w-72 min-h-screen bg-slate-800 text-slate-100 flex flex-col p-5 gap-5 shadow-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Commiter</h1>
        <p className="text-xs text-slate-400 mt-1">Reportes desde git commits</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Repositorio
          </label>
          {repos.length > 0 && (
            <select
              className="w-full bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={repoPath}
              onChange={(e) => onChange("repoPath", e.target.value)}
            >
              <option value="">— Seleccionar —</option>
              {repos.map((r) => (
                <option key={r.path} value={r.path}>{r.name}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="O escribe la ruta completa..."
            className="w-full bg-slate-700 text-slate-100 placeholder-slate-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={customPath}
            onChange={(e) => {
              setCustomPath(e.target.value)
              onChange("repoPath", e.target.value)
            }}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Periodo
          </label>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-slate-700 text-slate-100 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={month}
              onChange={(e) => onChange("month", parseInt(e.target.value))}
            >
              {MONTHS_ES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              className="w-24 bg-slate-700 text-slate-100 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={year}
              onChange={(e) => onChange("year", parseInt(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Filtrar por autor
          </label>
          <input
            type="text"
            placeholder="Nombre o email (opcional)"
            className="w-full bg-slate-700 text-slate-100 placeholder-slate-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={author}
            onChange={(e) => onChange("author", e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={!repoPath || loading}
        className="mt-auto w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
      >
        {loading ? "Generando..." : "Generar reporte"}
      </button>
    </aside>
  )
}
