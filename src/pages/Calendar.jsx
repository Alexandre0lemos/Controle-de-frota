import { useFleet } from '../context/FleetContext'
import { vehicleLabel, fmtDate, oilStatus, preventiveInfo, docStatus } from '../lib/calc'

export default function Calendar() {
  const { db } = useFleet()

  // Agrega todos os vencimentos do sistema
  const events = [
    ...db.oil.map(o => {
      const s = oilStatus(db, o)
      return { date: s.proxData, label: `Troca de Óleo: ${vehicleLabel(db, o.vehicleId)}`, type: 'Óleo', status: s.status, to: '/oleo' }
    }),
    ...db.preventive.map(p => {
      const s = preventiveInfo(db, p)
      return { date: s.proxData, label: `Preventiva ${p.servico}: ${vehicleLabel(db, p.vehicleId)}`, type: 'Preventiva', status: s.status, to: '/preventivas' }
    }),
    ...db.documents.map(d => {
      const s = docStatus(d)
      return { date: d.dataVencimento, label: `${d.tipo}: ${vehicleLabel(db, d.vehicleId)}`, type: 'Documento', status: s, to: '/documentacao' }
    }),
    ...db.drivers.map(d => {
      const s = d.validadeCnh ? (new Date(d.validadeCnh) < new Date() ? 'r' : 'g') : 'gray'
      return { date: d.validadeCnh, label: `CNH: ${d.nome}`, type: 'CNH', status: s, to: '/motoristas' }
    }),
  ].filter(e => e.date).sort((a, b) => new Date(a.date) - new Date(b.date))

  const critical = events.filter(e => e.status === 'r')
  const upcoming = events.filter(e => e.status === 'y')
  const ok = events.filter(e => e.status === 'g')

  const Section = ({ title, list, color }) => (
    <div className="panel" style={{ marginBottom: '22px' }}>
      <div className="panel-head" style={{ borderLeft: `4px solid ${color}` }}>
        <h3>{title}</h3>
        <span className={'pill ' + color}>{list.length} item(ns)</span>
      </div>
      <div className="panel-body">
        {list.length === 0 ? <div className="empty-note">Nenhum item nesta categoria.</div> : (
          <div className="grid" style={{ gap: '8px' }}>
            {list.map((e, i) => (
              <div className="alert-row" key={i} style={{ borderBottom: 'none', background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                <span className={'dot ' + e.status} />
                <div className="alert-txt">
                  <b style={{ fontSize: '13px' }}>{fmtDate(e.date)}</b> — {e.label}
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--muted)' }}>({e.type})</span>
                </div>
                <div className="alert-actions">
                  <button className="mini-btn" onClick={() => window.location.href = e.to}>Ver</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="main">
      <div className="topbar">
        <h1>🗓️ Calendário de Vencimentos</h1>
        <div className="sub">Controle de prazos preventivos e documentais</div>
      </div>

      <Section title="🔴 Vencidos ou Críticos" list={critical} color="r" />
      <Section title="🟡 Vencendo em Breve" list={upcoming} color="y" />
      <Section title="🟢 Em Dia" list={ok} color="g" />
    </div>
  )
}
