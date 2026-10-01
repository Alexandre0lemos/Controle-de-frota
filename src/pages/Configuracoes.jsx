import { useAuth } from '../context/AuthContext'

export default function Configuracoes() {
  const { profile, role } = useAuth()

  return (
    <div className="main">
      <div className="topbar">
        <h1>⚙️ Configurações do Sistema</h1>
        <div className="sub">Ajustes de conta e preferências da frota</div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Perfil do Usuário</h3></div>
        <div className="panel-body">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label>Nome completo</label>
              <input value={profile?.nome || '—'} readOnly style={{ background: '#eee' }} />
            </div>
            <div className="field">
              <label>Cargo / Role</label>
              <input value={role || '—'} readOnly style={{ background: '#eee' }} />
            </div>
          </div>
          <div className="empty-note" style={{ marginTop: '10px' }}>
            Alterações de perfil devem ser feitas através do administrador do Supabase.
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Preferências da Frota</h3></div>
        <div className="panel-body">
          <div className="field">
            <label>Nome da Empresa</label>
            <input defaultValue="SUPRA ALIMENTOS" />
          </div>
          <div className="field">
            <label>Unidade de Medida KM</label>
            <select defaultValue="km">
              <option value="km">Quilômetros (km)</option>
              <option value="mi">Milhas (mi)</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => alert('Configurações salvas!')}>
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  )
}
