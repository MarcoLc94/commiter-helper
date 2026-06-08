import type { Activity, DayReport } from "../types"

const FD_EMAIL = "support@bitfarmsoporterol.freshdesk.com"

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildMailto(act: Activity, day: DayReport): string {
  void day
  const desc = capitalize(act.activity)
  const subject = `Fix: ${desc}`
  const body = act.comments ? `${desc}\n\n${act.comments}` : desc
  return `mailto:${FD_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}


const STATUSES = ["Completado", "En progreso", "Pendiente", "Cancelado"]

interface Props {
  days: DayReport[]
  onChange: (days: DayReport[]) => void
  onExportDay: (day: DayReport) => void
  pendingUpdates?: Map<string, DayReport>
  onAcceptUpdate?: (date: string) => void
  onDeclineUpdate?: (date: string) => void
  onAcceptAllUpdates?: () => void
  onDeclineAllUpdates?: () => void
}

function updateActivity(
  days: DayReport[],
  dayIdx: number,
  actIdx: number,
  field: keyof Activity,
  value: string | number
): DayReport[] {
  return days.map((day, di) => {
    if (di !== dayIdx) return day
    const activities = day.activities.map((act, ai) => {
      if (ai !== actIdx) return act
      return { ...act, [field]: value }
    })
    const total_hours = activities.reduce((s, a) => s + a.hours, 0)
    return { ...day, activities, total_hours }
  })
}

function addActivity(days: DayReport[], dayIdx: number, defaultAuthor: string): DayReport[] {
  return days.map((day, di) => {
    if (di !== dayIdx) return day
    const blank: Activity = {
      ticket: null,
      activity: "Nueva actividad",
      module: "General",
      status: "Completado",
      hours: 1,
      comments: "",
      author: defaultAuthor,
    }
    const activities = [...day.activities, blank]
    return { ...day, activities, total_hours: day.total_hours + 1 }
  })
}

function removeActivity(days: DayReport[], dayIdx: number, actIdx: number): DayReport[] {
  return days.map((day, di) => {
    if (di !== dayIdx) return day
    const activities = day.activities.filter((_, ai) => ai !== actIdx)
    const total_hours = activities.reduce((s, a) => s + a.hours, 0)
    return { ...day, activities, total_hours }
  })
}

function toggleHoliday(days: DayReport[], dayIdx: number): DayReport[] {
  return days.map((day, di) => {
    if (di !== dayIdx) return day
    if (day.day_type === "holiday") return { ...day, day_type: "workday" }
    return { ...day, day_type: "holiday", activities: [], total_hours: 0 }
  })
}

function getDefaultAuthor(days: DayReport[]): string {
  for (const day of days) {
    for (const act of day.activities) {
      if (act.author) return act.author
    }
  }
  return ""
}

interface CellProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}
function EditCell({ className = "", ...props }: CellProps) {
  return (
    <input
      className={`w-full text-xs border-0 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 ${className}`}
      {...props}
    />
  )
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

export function ReportTable({
  days, onChange, onExportDay,
  pendingUpdates, onAcceptUpdate, onDeclineUpdate, onAcceptAllUpdates, onDeclineAllUpdates,
}: Props) {
  const defaultAuthor = getDefaultAuthor(days)

  if (days.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-12">
        Configura el repositorio y genera un reporte para comenzar.
      </div>
    )
  }

  const pendingCount = pendingUpdates?.size ?? 0

  return (
    <div>
      {pendingCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-300">
          <span className="text-amber-800 text-xs font-semibold">
            {pendingCount} día{pendingCount > 1 ? "s" : ""} con commits nuevos en git — revisa y decide fila por fila
          </span>
          <div className="flex gap-2">
            <button
              onClick={onAcceptAllUpdates}
              className="text-xs px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded font-semibold"
            >
              Actualizar todos
            </button>
            <button
              onClick={onDeclineAllUpdates}
              className="text-xs px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold"
            >
              Declinar todos
            </button>
          </div>
        </div>
      )}
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm min-w-[900px]">
        <thead>
          <tr>
            {["Fecha", "Ticket / Actividad", "Módulo", "Status", "Horas", "Comentarios", "Autor", "Tag", "Nº Ticket", ""].map((h) => (
              <th
                key={h}
                className="bg-[#1F497D] text-white font-semibold px-3 py-2 text-left text-xs sticky top-0 z-10"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, di) => {
            if (day.day_type === "weekend") {
              return (
                <tr key={day.date} className="h-7">
                  <td className="bg-[#C00000] text-white font-bold px-3 py-1 text-xs whitespace-nowrap">
                    {formatDate(day.date, day.weekday)}
                  </td>
                  <td colSpan={7} className="bg-[#C00000] text-white font-bold px-3 text-xs">
                    FIN DE SEMANA
                  </td>
                </tr>
              )
            }

            if (day.day_type === "holiday") {
              return (
                <tr key={day.date} className="h-7">
                  <td className="bg-[#E26B0A] text-white font-bold px-3 py-1 text-xs whitespace-nowrap">
                    {formatDate(day.date, day.weekday)}
                  </td>
                  <td colSpan={6} className="bg-[#E26B0A] text-white font-bold px-3 text-xs">
                    DÍA FESTIVO
                  </td>
                  <td className="bg-[#E26B0A] text-right px-2">
                    <button
                      onClick={() => onChange(toggleHoliday(days, di))}
                      className="text-white text-xs hover:underline"
                      title="Quitar feriado"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            }

            // Workday
            const hasActivities = day.activities.length > 0
            const isPending = pendingUpdates?.has(day.date) ?? false
            return (
              <>
                {!hasActivities ? (
                  <tr key={`${day.date}-empty`} className="h-8 border-b border-slate-100">
                    <td className={`${isPending ? "bg-amber-200" : "bg-[#BDD7EE]"} font-bold px-3 py-1 text-xs whitespace-nowrap align-middle`}>
                      <div className="flex flex-col gap-0.5 items-start">
                        <span>{formatDate(day.date, day.weekday)}</span>
                        {isPending && (
                          <div className="flex gap-1 mt-0.5">
                            <button onClick={() => onAcceptUpdate?.(day.date)} title="Actualizar con git" className="text-[10px] text-green-700 hover:text-green-900 font-bold">↻ Actualizar</button>
                            <button onClick={() => onDeclineUpdate?.(day.date)} title="Mantener edición" className="text-[10px] text-slate-500 hover:text-red-600 font-bold">✕</button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td colSpan={6} className="px-3 text-slate-400 text-xs italic">
                      Sin commits
                    </td>
                    <td className="px-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => onChange(addActivity(days, di, defaultAuthor))}
                          className="text-blue-600 text-xs hover:underline"
                          title="Agregar actividad"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onChange(toggleHoliday(days, di))}
                          className="text-orange-500 text-xs hover:underline"
                          title="Marcar como feriado"
                        >
                          🗓
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  day.activities.map((act, ai) => (
                    <tr key={`${day.date}-${ai}`} className="border-b border-slate-100 hover:bg-slate-50 align-top">
                      {ai === 0 ? (
                        <td
                          className={`${isPending ? "bg-amber-200" : "bg-[#BDD7EE]"} font-bold px-3 py-2 text-xs whitespace-nowrap align-middle`}
                          rowSpan={day.activities.length}
                        >
                          <div className="flex flex-col gap-1 items-start">
                            <span>{formatDate(day.date, day.weekday)}</span>
                            {isPending && (
                              <div className="flex gap-1">
                                <button onClick={() => onAcceptUpdate?.(day.date)} title="Actualizar con git" className="text-[10px] text-green-700 hover:text-green-900 font-bold">↻ Actualizar</button>
                                <button onClick={() => onDeclineUpdate?.(day.date)} title="Mantener edición" className="text-[10px] text-slate-500 hover:text-red-600 font-bold">✕</button>
                              </div>
                            )}
                            <button
                              onClick={() => onExportDay(day)}
                              className="flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 font-normal"
                              title="Exportar solo este día"
                            >
                              <DownloadIcon />
                              Exportar día
                            </button>
                          </div>
                        </td>
                      ) : null}
                      <td className="px-2 py-1">
                        <EditCell
                          value={act.ticket ? `${act.ticket} - ${act.activity}` : act.activity}
                          onChange={(e) => {
                            const val = e.target.value
                            const m = val.match(/^(#\d+|[A-Z]+-\d+)\s*-?\s*(.*)$/)
                            if (m) {
                              const updated = updateActivity(days, di, ai, "ticket", m[1])
                              onChange(updateActivity(updated, di, ai, "activity", m[2]))
                            } else {
                              const updated = updateActivity(days, di, ai, "ticket", "")
                              onChange(updateActivity(updated, di, ai, "activity", val))
                            }
                          }}
                        />
                      </td>
                      <td className="px-2 py-1 w-36">
                        <EditCell
                          value={act.module}
                          onChange={(e) => onChange(updateActivity(days, di, ai, "module", e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-1 w-28">
                        <select
                          className="w-full text-xs border-0 bg-transparent focus:bg-blue-50 focus:outline-none rounded px-1 py-0.5"
                          value={act.status}
                          onChange={(e) => onChange(updateActivity(days, di, ai, "status", e.target.value))}
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 w-16">
                        <EditCell
                          type="number"
                          min={0}
                          step={0.5}
                          value={act.hours}
                          className="text-center font-bold"
                          onChange={(e) => onChange(updateActivity(days, di, ai, "hours", parseFloat(e.target.value) || 0))}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <EditCell
                          value={act.comments}
                          onChange={(e) => onChange(updateActivity(days, di, ai, "comments", e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-1 w-28">
                        <EditCell
                          value={act.author}
                          onChange={(e) => onChange(updateActivity(days, di, ai, "author", e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-1 w-24">
                        <EditCell
                          value={act.tag ?? ""}
                          placeholder="v—"
                          onChange={(e) => onChange(updateActivity(days, di, ai, "tag", e.target.value))}
                          className="text-center font-mono text-xs"
                        />
                      </td>
                      <td className="px-2 py-1 w-28">
                        <EditCell
                          value={act.fd_ticket ?? ""}
                          placeholder="—"
                          onChange={(e) => onChange(updateActivity(days, di, ai, "fd_ticket", e.target.value))}
                          className="text-center font-mono text-xs"
                        />
                      </td>
                      <td className="px-2 py-1 w-20 text-right">
                        <div className="flex gap-1 justify-end items-center">
                          <a
                            href={buildMailto(act, day)}
                            title="Generar ticket en Freshdesk"
                            className="text-[10px] text-violet-600 hover:text-violet-800 font-semibold whitespace-nowrap"
                          >
                            + Ticket
                          </a>
                          {ai === day.activities.length - 1 && (
                            <button
                              onClick={() => onChange(addActivity(days, di, defaultAuthor))}
                              className="text-blue-500 hover:text-blue-700 text-xs"
                              title="Agregar actividad"
                            >
                              +
                            </button>
                          )}
                          <button
                            onClick={() => onChange(removeActivity(days, di, ai))}
                            className="text-red-400 hover:text-red-600 text-xs"
                            title="Eliminar"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {hasActivities && (
                  <tr key={`${day.date}-subtotal`} className="h-6">
                    <td colSpan={8} className="bg-[#DEEAF1] text-[#1F497D] font-bold text-xs text-right px-3">
                      TOTAL DÍA: {day.total_hours.toFixed(1)} h
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
    </div>
  )
}

function formatDate(dateStr: string, weekday: string): string {
  const [y, m, d] = dateStr.split("-")
  return `${weekday} ${d}/${m}/${y}`
}
