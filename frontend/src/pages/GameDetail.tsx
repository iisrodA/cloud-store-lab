import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { api, type Comment, type Product } from '../services/api'

const inputCls =
  'w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none'

export default function GameDetail() {
  const { id } = useParams()
  const productId = Number(id)

  const [game, setGame] = useState<Product | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const [g, c] = await Promise.all([
      api.getProduct(productId),
      api.listComments(productId),
    ])
    setGame(g)
    setComments(c)
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [productId])

  const handleComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !content.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await api.addComment(productId, author, content)
      setAuthor('')
      setContent('')
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !game) return <p className="text-red-400">Error: {error}</p>
  if (!game) return <p className="text-slate-400">Cargando...</p>

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {game.image_url ? (
            <img src={game.image_url} alt={game.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600">
              sin imagen
            </div>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{game.name}</h1>
        <p className="mt-1 text-sm uppercase tracking-wide text-slate-400">
          {game.genre} · v{game.current_version} · {game.release_year}
        </p>
        <p className="mt-4 text-2xl font-semibold text-cyan-400">
          ${Number(game.price).toFixed(2)}
        </p>
        {game.description && (
          <p className="mt-4 leading-relaxed text-slate-300">{game.description}</p>
        )}

        <hr className="my-6 border-slate-800" />

        <h2 className="mb-4 text-xl font-semibold">Comentarios</h2>
        <form onSubmit={handleComment} className="mb-6 space-y-3">
          <input
            className={inputCls}
            placeholder="Tu nombre"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
          <textarea
            className={inputCls}
            rows={3}
            placeholder="Escribe un comentario..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {submitting && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            )}
            {submitting ? 'Publicando...' : 'Publicar comentario'}
          </button>
        </form>

        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-slate-500">Aún no hay comentarios.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-sm font-medium text-cyan-300">{c.author}</p>
              <p className="mt-1 text-sm text-slate-300">{c.content}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(c.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
