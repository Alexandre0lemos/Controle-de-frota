import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { MODULES } from '../modules'
import { useFleet } from '../context/FleetContext'

export const MENU = [
  { path: '', icon: '🏠', title: 'Central da Frota' },
  ...MODULES.map(({ path, icon, title }) => ({ path, icon, title })),
  { path: 'custos', icon: '💰', title: 'Custos' },
  { path: 'indicadores', icon: '📊', title: 'Indicadores' },
  { path: 'relatorios', icon: '📋', title: 'Relatórios' },
  { path: 'calendario', icon: '🗓️', title: 'Calendário' },
  { path: 'config', icon: '⚙️', title: 'Configurações' },
]

export default function Layout() {
  const { profile, role, signOut } = useAuth()
  const { db } = useFleet()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const { pathname } = useLocation()
  const current = MENU.find((m) => '/' + m.path === pathname) || MENU[0]

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const query = q.toLowerCase()
      // Busca Veículo por placa ou número
      const v = db.vehicles.find(veh => veh.placa.toLowerCase().includes(query) || String(veh.numero).includes(query))
      if (v) return nav(`/veiculo/${v.id}`)

      // Busca Motorista por nome
      const d = db.drivers.find(drv => drv.nome.toLowerCase().includes(query))
      if (d) return nav(`/motoristas`) // Redireciona para a lista de motoristas

      setQ('')
    }
  }

  return (
    <div id="shell" className="active">
      <div className={'sidebar' + (open ? ' open' : '')}>
        <div className="sb-brand"><span className="k1">SUPRA ALIMENTOS</span><br /><span className="k2">GESTÃO DA<br />FROTA</span></div>
        <div className="sb-nav">{MENU.map((m) => (
          <NavLink key={m.path} to={'/' + m.path} end onClick={() => setOpen(false)} className={({ isActive }) => 'sb-item' + (isActive ? ' active' : '') + (m.soon ? ' disabled' : '')}>
            <span className="ic">{m.icon}</span>{m.title}</NavLink>))}</div>
        <div className="sb-foot">Logado como<br /><b>{profile?.nome || '—'}</b> · {ROLES[role] || '—'}<br /><span className="logout" onClick={signOut}>Sair</span></div>
      </div>
      <div className="main">
        <div className="topbar">
          <button id="menuToggle" onClick={() => setOpen(!open)}>☰</button>
          <div><h1>{current.title}</h1></div>
          <div className="search-box">
            <span className="ic">🔍</span>
            <input placeholder="Buscar veículo ou motorista..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={handleSearch} />
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
