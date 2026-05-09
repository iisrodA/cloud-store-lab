import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition ${isActive ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}`

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-cyan-400">
            <span className="text-2xl">☁</span> Cloud Games
          </Link>
          <nav className="flex gap-6">
            <NavLink to="/" end className={navClass}>Catálogo</NavLink>
            <NavLink to="/create" className={navClass}>Crear juego</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-6 pb-8 pt-4 text-center text-xs text-slate-500">
        Cloud Computing Lab · FastAPI + Google Cloud
      </footer>
    </div>
  )
}
