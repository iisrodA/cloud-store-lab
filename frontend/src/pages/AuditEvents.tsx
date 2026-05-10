import { useEffect, useState } from 'react'
import { api, type AuditEvent } from '../services/api'

export default function AuditEvents() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listAuditEvents()
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const getEventColor = (type: string) => {
    switch (type) {
      case 'GAME_CREATED':
        return 'text-emerald-400 bg-emerald-950'
      case 'IMAGE_UPLOADED':
        return 'text-blue-400 bg-blue-950'
      case 'COMMENT_CREATED':
        return 'text-violet-400 bg-violet-950'
      default:
        return 'text-slate-400 bg-slate-900'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'GAME_CREATED':
        return '🎮'
      case 'IMAGE_UPLOADED':
        return '🖼️'
      case 'COMMENT_CREATED':
        return '💬'
      default:
        return '📝'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div>
      <div className="animate-fade-in-up mb-6">
        <h1 className="text-3xl font-bold">Registro de Eventos</h1>
        <p className="mt-2 text-slate-400">Auditoría de todas las actividades del sistema</p>
      </div>

      {loading && <p className="animate-fade-in text-slate-400">Cargando eventos...</p>}
      {error && <p className="animate-fade-in text-red-400">Error: {error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="animate-fade-in text-slate-400">Aún no hay eventos registrados.</p>
      )}

      {events.length > 0 && (
        <div className="space-y-3">
          {events.map((event, i) => (
            <div
              key={event.id}
              style={{ animationDelay: `${i * 0.05}s` }}
              className="animate-fade-in-up rounded-lg border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700 hover:shadow-lg hover:shadow-slate-500/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`flex items-center justify-center rounded-lg p-2 ${getEventColor(event.type)}`}>
                    <span className="text-xl">{getEventIcon(event.type)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100">{event.type.replace(/_/g, ' ')}</h3>
                      {event.product_id && (
                        <span className="text-xs text-slate-500">Producto #{event.product_id}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{formatDate(event.timestamp)}</p>
                    {Object.keys(event.details).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(event.details).map(([key, value]) => (
                          <p key={key} className="text-xs text-slate-500">
                            <span className="text-slate-400">{key}:</span> {String(value)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
