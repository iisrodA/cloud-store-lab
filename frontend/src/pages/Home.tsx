import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GameCard from '../components/GameCard'
import { api, type Product } from '../services/api'

export default function Home() {
  const [games, setGames] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listProducts()
      .then(setGames)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="animate-fade-in-up mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Catálogo</h1>
        <Link
          to="/create"
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nuevo juego
        </Link>
      </div>
      {loading && <p className="animate-fade-in text-slate-400">Cargando catálogo...</p>}
      {error && <p className="animate-fade-in text-red-400">Error: {error}</p>}
      {!loading && !error && games.length === 0 && (
        <p className="animate-fade-in text-slate-400">
          Aún no hay juegos.{' '}
          <Link to="/create" className="text-cyan-400 underline">
            Crea el primero
          </Link>
          .
        </p>
      )}
      {games.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <GameCard key={g.id} game={g} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}
    </div>
  )
}
