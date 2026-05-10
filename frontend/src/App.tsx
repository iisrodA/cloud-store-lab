import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AuditEvents from './pages/AuditEvents'
import CreateGame from './pages/CreateGame'
import GameDetail from './pages/GameDetail'
import Home from './pages/Home'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/games/:id" element={<GameDetail />} />
        <Route path="/audit" element={<AuditEvents />} />
      </Routes>
    </Layout>
  )
}
