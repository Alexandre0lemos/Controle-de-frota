import { useNavigate } from 'react-router-dom'
import { useFleet } from '../context/FleetContext'
import { buildAlerts, healthScore, scoreColor, statusBadge, fleetCostPerKm, isOpenMaint } from '../lib/calc'

export default function Central() {
  const { db } = useFleet()
  const nav = useNavigate()
  const total = db.vehicles.length
  const disp = db.vehicles.filter((v) => v.status === 'Disponível').length
  const manut = db.vehicles.filter((v) => v.status === 'Em Manutenção' || db.maintenance.some((m) => m.vehicleId === v.id && isOpenMaint(m))).length
  const bloq = db.vehicles.filter((v) => v.status === 'Bloqueado').length
  const alerts = buildAlerts(db)
  const kpi = (cls, n, l, style) => <div className={'kpi ' + cls}><div className="num" style={style}>{n}</div><div className="lbl">{l}</div></div>

  const criticalActions = alerts.filter(a => a.level === 'r')
  const otherAlerts = alerts.filter(a => a.level !== 'r')

  return (
    <>
      <div className="grid kpi-grid">
        {kpi('b-black', total, 'VEÍCULOS NA FROTA')}{kpi('b-ok', disp, 'DISPONÍVEIS')}{kpi('b-warn', manut, 'EM MANUTENÇÃO')}{kpi('b-crit', bloq, 'BLOQUEADOS')}
        {kpi('b-red', (total ? Math.round((disp / total) * 100) : 0) + '%', 'DISPONIBILIDADE')}
        {kpi('b-black', fleetCostPerKm(db).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'CUSTO POR KM', { fontSize: 24 })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '22px' }}>
        <div className="panel attn">
          <div className="panel-head">
            <h3>⚠️ Central de Ações</h3>
            <span className={'pill ' + (criticalActions.length ? 'r' : 'g')}>{criticalActions.length} Prioridade</span>
          </div>
          <div className="panel-body">
            {criticalActions.length === 0 ? <div className="empty-note">Nenhuma ação crítica pendente. 🟢</div> : criticalActions.map((a, i) => (
              <div className="alert-row" key={i}>
                <span className={'dot ' + a.level} />
                <div className="alert-txt"><b style={{ color: 'var(--crit)' }}>URGENTE:</b> {a.text}</div>
                <div className="alert-actions">
                  <button className="mini-btn primary" onClick={() => nav(a.to)}>RESOLVER</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>🔔 Outros Alertas</h3>
            <span className={'pill ' + (otherAlerts.length ? 'y' : 'g')}>{otherAlerts.length} itens</span>
          </div>
          <div className="panel-body">
            {otherAlerts.length === 0 ? <div className="empty-note">Sem outros alertas no momento.</div> : otherAlerts.map((a, i) => (
              <div className="alert-row" key={i}>
                <span className={'dot ' + a.level} />
                <div className="alert-txt">{a.text}</div>
                <div className="alert-actions">
                  <button className="mini-btn" onClick={() => nav(a.to)}>VER</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Saúde da Frota</h3></div>
        <div className="panel-body"><div className="grid health-grid">
          {db.vehicles.map((v) => { const s = healthScore(db, v.id), sc = scoreColor(s); return (
            <div className="health-card" key={v.id} onClick={() => nav(`/veiculo/${v.id}`)}>
              <div className="health-top"><div><div className="veic">{v.numero}</div><div className="placa">{v.placa} · {v.marca} {v.modelo}</div></div><span className={'badge ' + statusBadge(v.status)}>{v.status}</span></div>
              <div className="score-bar"><div className="score-fill" style={{ width: s + '%', background: sc.c }} /></div>
              <div className="score-row"><b>{s}/100</b><span style={{ color: sc.c, fontWeight: 700 }}>{sc.label}</span></div>
            </div>) })}
        </div></div>
      </div>
    </>
  )
}
