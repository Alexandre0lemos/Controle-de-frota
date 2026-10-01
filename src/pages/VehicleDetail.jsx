import { useParams, useNavigate } from 'react-router-dom'
import { useFleet } from '../context/FleetContext'
import { vehicleById, vehicleLabel, healthScore, scoreColor, fmtBRL, fmtDate, maintenanceCost, costEvents } from '../lib/calc'
import Layout from '../components/Layout'

export default function VehicleDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { db } = useFleet()

  const v = vehicleById(db, id)
  if (!v) return <div className="soon-wrap"><h2>Veículo não encontrado</h2><button className="btn btn-primary" onClick={() => nav('/frota')}>Voltar</button></div>

  // Agregação de todos os eventos para a Linha do Tempo
  const events = [
    ...db.maintenance.filter(m => m.vehicleId === id).map(m => ({ date: m.dataEntrada, type: 'Manutenção', label: m.tipo, detail: m.problema, cost: maintenanceCost(m), color: 'var(--red)' })),
    ...db.oil.filter(o => o.vehicleId === id).map(o => ({ date: o.data, type: 'Óleo', label: 'Troca de Óleo', detail: `${o.marca} ${o.tipoOleo}`, cost: o.custo, color: 'var(--gold)' })),
    ...db.refuels.filter(r => r.vehicleId === id).map(r => ({ date: r.data, type: 'Combustível', label: 'Abastecimento', detail: r.posto, cost: r.valor, color: 'var(--black)' })),
    ...db.documents.filter(d => d.vehicleId === id).map(d => ({ date: d.dataVencimento, type: 'Documento', label: d.tipo, detail: d.numero, cost: d.custo, color: 'var(--muted)' })),
    ...db.damages.filter(d => d.vehicleId === id).map(d => ({ date: d.data, type: 'Avaria', label: d.classificacao, detail: d.descricao, cost: d.custo, color: 'var(--crit)' })),
    ...db.tires.filter(t => t.vehicleId === id).map(t => ({ date: t.dataInstalacao, type: 'Pneu', label: 'Instalação', detail: `${t.marca} ${t.modelo}`, cost: t.valor, color: 'var(--charcoal)' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const totalCost = events.reduce((s, e) => s + (e.cost || 0), 0)
  const s = healthScore(db, id)
  const sc = scoreColor(s)

  return (
    <div className="main">
      <div className="topbar">
        <div>
          <h1>{v.numero} · {v.placa}</h1>
          <div className="sub">{v.marca} {v.modelo} · {v.setor}</div>
        </div>
        <button className="btn btn-ghost" style={{ width: 'auto' }} onClick={() => nav('/frota')}>← Voltar para Frota</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        <div className="sidebar-right">
          <div className="panel">
            <div className="panel-head"><h3>Resumo</h3></div>
            <div className="panel-body">
              <div className="field">
                <label>Status</label>
                <span className={'badge ' + (v.status === 'Disponível' ? 'disp' : v.status === 'Bloqueado' ? 'bloq' : 'manu')}>
                  {v.status}
                </span>
              </div>
              <div className="field">
                <label>KM Atual</label>
                <div className="num" style={{ fontSize: 24 }}>{Number(v.kmAtual).toLocaleString('pt-BR')} km</div>
              </div>
              <div className="field">
                <label>Custo Total Acumulado</label>
                <div className="num" style={{ fontSize: 24, color: 'var(--red)' }}>{fmtBRL(totalCost)}</div>
              </div>
              <div className="field" style={{ marginTop: 20 }}>
                <label>Nota de Saúde</label>
                <div className="score-bar"><div className="score-fill" style={{ width: s + '%', background: sc.c }} /></div>
                <div className="score-row"><b>{s}/100</b><span style={{ color: sc.c, fontWeight: 700 }}>{sc.label}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-section">
          <div className="panel">
            <div className="panel-head"><h3>Histórico de Eventos</h3></div>
            <div className="panel-body">
              {events.length === 0 ? <div className="empty-note">Nenhum evento registrado para este veículo.</div> : (
                <div className="timeline">
                  {events.map((e, i) => (
                    <div className="tl-item" key={i}>
                      <div className="tl-date">{fmtDate(e.date)}</div>
                      <div className="tl-title" style={{ color: e.color }}>{e.type} · {e.label}</div>
                      <div className="tl-txt" style={{ fontSize: 14, color: 'var(--muted)', margin: '4px 0' }}>{e.detail}</div>
                      {e.cost > 0 && <div className="tl-cost">Custo: {fmtBRL(e.cost)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
