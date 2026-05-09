import { Link } from 'react-router-dom'
import type { Product } from '../services/api'

export default function GameCard({ game }: { game: Product }) {
  return (
    <Link
      to={`/games/${game.id}`}
      className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      <div className="aspect-video overflow-hidden bg-slate-800">
        {game.image_url ? (
          <img
            src={game.image_url}
            alt={game.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-600">
            sin imagen
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-100">{game.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
          {game.genre} · v{game.current_version} · {game.release_year}
        </p>
        <p className="mt-3 font-medium text-cyan-400">${Number(game.price).toFixed(2)}</p>
      </div>
    </Link>
  )
}
