import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FleetProvider } from './context/FleetContext'
import { configured } from './lib/supabase'
import Layout, { MENU } from './components/Layout'
import CrudPage from './components/CrudPage'
import Login from './pages/Login'
import Central from './pages/Central'
import Custos from './pages/Custos'
import Soon from './pages/Soon'
import VehicleDetail from './pages/VehicleDetail'
import Calendar from './pages/Calendar'
import Indicadores from './pages/Indicadores'
import Configuracoes from './pages/Configuracoes'
import { MODULES } from './modules'

function Gate() {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="soon-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner"></div>
      <h2 style={{ marginTop: '20px', color: 'var(--primary)' }}>Sincronizando Frota...</h2>
    </div>
  )
  if (!session) return <Login />
  return (
    <FleetProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Central />} />
          <Route path="veiculo/:id" element={<VehicleDetail />} />
          {MODULES.map((m) => <Route key={m.path} path={m.path} element={<CrudPage cfg={m} />} />)}
          <Route path="custos" element={<Custos />} />
          <Route path="calendario" element={<Calendar />} />
          <Route path="indicadores" element={<Indicadores />} />
          <Route path="config" element={<Configuracoes />} />
          {MENU.filter((m) => m.soon).map((m) => <Route key={m.path} path={m.path} element={<Soon title={m.title} />} />)}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </FleetProvider>
  )
}

export default function App() {
  if (!configured) return <div className="soon-wrap"><h2>Supabase não configurado</h2><p>Copie <code>.env.example</code> para <code>.env</code> e preencha URL e anon key.</p></div>
  return <BrowserRouter><AuthProvider><Gate /></AuthProvider></BrowserRouter>
}
