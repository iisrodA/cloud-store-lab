import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const inputCls =
  'w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none'

export default function CreateGame() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    genre: '',
    current_version: '',
    release_year: '',
  })
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const game = await api.createProduct({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        genre: form.genre,
        current_version: form.current_version,
        release_year: parseInt(form.release_year, 10),
      })
      if (image) {
        await api.uploadImage(game.id, image)
      }
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center">
    <div className="w-full max-w-xl">
      <h1 className="mb-6 text-3xl font-bold">Nuevo videojuego</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Nombre</label>
          <input
            className={inputCls}
            required
            placeholder="Ej: Hollow Knight"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Descripción</label>
          <textarea
            className={inputCls}
            rows={3}
            placeholder="Descripción del juego..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Precio (USD)</label>
            <input
              className={inputCls}
              type="text"
              inputMode="decimal"
              required
              placeholder="19.99"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
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
              type="text"
              inputMode="numeric"
              required
              placeholder="2024"
              value={form.release_year}
              onChange={(e) => setForm({ ...form, release_year: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Imagen (opcional)</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400 transition hover:border-cyan-500 hover:text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{image ? image.name : 'Seleccionar imagen...'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {submitting && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            )}
            {submitting ? 'Creando...' : 'Crear videojuego'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => navigate('/')}
            className="rounded-lg border border-slate-700 px-5 py-2 font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
    </div>
  )
}
