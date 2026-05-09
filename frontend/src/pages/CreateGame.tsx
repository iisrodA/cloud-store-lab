import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const inputCls =
  'w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none'

export default function CreateGame() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    genre: '',
    current_version: '',
    release_year: new Date().getFullYear(),
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const game = await api.createProduct(form)
      navigate(`/games/${game.id}`)
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-3xl font-bold">Nuevo videojuego</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Nombre</label>
          <input
            className={inputCls}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Descripción</label>
          <textarea
            className={inputCls}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Precio (USD)</label>
            <input
              className={inputCls}
              type="number"
              step="0.01"
              min="0"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Género</label>
            <input
              className={inputCls}
              required
              placeholder="RPG, FPS, ..."
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Versión actual</label>
            <input
              className={inputCls}
              required
              placeholder="1.0.0"
              value={form.current_version}
              onChange={(e) => setForm({ ...form, current_version: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Año de lanzamiento</label>
            <input
              className={inputCls}
              type="number"
              required
              value={form.release_year}
              onChange={(e) =>
                setForm({ ...form, release_year: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-cyan-500 px-5 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {submitting ? 'Creando...' : 'Crear videojuego'}
        </button>
      </form>
    </div>
  )
}
