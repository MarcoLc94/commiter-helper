import { useEffect, useRef } from "react"

interface Props {
  defaultName: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

export function SaveModal({ defaultName, onConfirm, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = inputRef.current?.value.trim()
    if (name) onConfirm(name)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full mx-4">
        <h3 className="font-semibold text-slate-800 text-base mb-1">Guardar reporte</h3>
        <p className="text-xs text-slate-500 mb-4">Asigna un nombre para identificar este reporte en el historial.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            defaultValue={defaultName}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre del reporte"
          />
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:border-slate-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
