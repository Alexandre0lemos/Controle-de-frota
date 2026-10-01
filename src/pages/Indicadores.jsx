import { useFleet } from '../context/FleetContext'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { healthScore, scoreColor } from '../lib/calc'

export default function Indicadores() {
  const { db } = useFleet()

  const stats = db.vehicles.map(v => ({
    id: v.id,
    label: `${v.numero} - ${v.placa}`,
    score: healthScore(db, v.id),
    color: scoreColor(healthScore(db, v.id)).c
  })).sort((a, b) => b.score - a.score)

  const avgScore = stats.length ? Math.round(stats.reduce((s, i) => s + i.score, 0) / stats.length) : 0

  return (
    <div className="main">
      <div className="topbar">
        <h1>📊 Indicadores de Desempenho</h1>
        <div className="sub">Análise de saúde e eficiência da frota</div>
      </div>

      <div className="grid kpi-grid">
        <div className="kpi b-black">
          <div className="num" style={{ fontSize: 34 }}>{avgScore}</div>
          <div className="lbl">SAÚDE MÉDIA DA FROTA</div>
        </div>
        <div className="kpi b-red">
          <div className="num" style={{ fontSize: 34 }}>{db.vehicles.length}</div>
          <div className="lbl">VEÍCULOS MONITORADOS</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Distribuição de Saúde por Veículo</h3></div>
        <div className="panel-body" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <XAxis dataKey="label" fontSize={11} tick={{fill: 'var(--muted)'}} />
              <YAxis domain={[0, 100]} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="score">
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
