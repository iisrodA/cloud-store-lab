import { useEffect, useState } from 'react'
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
      <h1 className="mb-6 text-3xl font-bold">Catálogo</h1>
      {loading && <p className="text-slate-400">Cargando catálogo...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}
      {!loading && !error && games.length === 0 && (
        <p className="text-slate-400">
          Aún no hay juegos. <a href="/create" className="text-cyan-400 underline">Crea el primero</a>.
        </p>
      )}
      {games.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => <GameCard key={g.id} game={g} />)}
        </div>
      )}
    </div>
  )
}
