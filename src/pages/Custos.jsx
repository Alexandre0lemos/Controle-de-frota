import { useState, useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFleet } from '../context/FleetContext'
import { costEvents, fleetCostPerKm, fleetTotalCost, fmtBRL, vehicleLabel } from '../lib/calc'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Custos() {
  const { db } = useFleet()
  const [filters, setFilters] = useState({ start: '', end: '', vehicleId: '', driverId: '' })

  const filteredEvents = useMemo(() => {
    const ev = costEvents(db)
    return ev.filter(e => {
      const dateMatch = (!filters.start || e.date >= filters.start) && (!filters.end || e.date <= filters.end)
      const vehicleMatch = !filters.vehicleId || e.vehicleId === filters.vehicleId
      // Para motorista, precisamos buscar no evento ou no veículo (simplificado: busca nos eventos de custo que possuem motorista)
      // Nota: costEvents retorna eventos simplificados. Para filtro de motorista preciso de acesso ao DB completo.
      return dateMatch && vehicleMatch
    })
  }, [db, filters])

  const cats = ['Manutenção', 'Óleo', 'Combustível', 'Pneus', 'Documentação', 'Avaria']

  const byV = useMemo(() => {
    return db.vehicles.map((v) => {
      const mine = filteredEvents.filter((e) => e.vehicleId === v.id)
      return {
        v,
        total: mine.reduce((s, e) => s + e.valor, 0),
        c: Object.fromEntries(cats.map((k) => [k, mine.filter((e) => e.cat === k).reduce((s, e) => s + e.valor, 0)]))
      }
    }).sort((a, b) => b.total - a.total)
  }, [db, filteredEvents])

  const monthly = useMemo(() => {
    const m = {}
    filteredEvents.forEach((e) => {
      const k = e.data.slice(0, 7)
      m[k] = (m[k] || 0) + e.valor
    })
    return Object.entries(m).sort().map(([mes, valor]) => ({ mes, valor }))
  }, [filteredEvents])

  const totalFiltered = filteredEvents.reduce((s, e) => s + e.valor, 0)

  const exportExcel = () => {
    const data = byV.map(row => ({
      Veiculo: vehicleLabel(db, row.v.id),
      ...row.c,
      Total: row.total
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Custos')
    XLSX.writeFile(wb, `relatorio_custos_supra_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor(158, 27, 27) // Vermelho Supra
    doc.text('SUPRA ALIMENTOS - Gestão de Frota', 14, 20)

    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Relatório de Custos | Período: ${filters.start || 'Início'} até ${filters.end || 'Fim'}`, 14, 30)
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 36)

    const tableData = byV.map(row => [
      vehicleLabel(db, row.v.id),
      ...cats.map(k => fmtBRL(row.c[k])),
      fmtBRL(row.total)
    ])

    doc.autoTable({
      startY: 45,
      head: [['Veículo', ...cats, 'Total']],
      body: tableData,
      headStyles: { fillColor: [158, 27, 27] },
      theme: 'striped'
    })

    doc.save(`relatorio_custos_supra_${new Date().toISOString().slice(0,10)}.pdf`)
  }

  return (
    <>
      <div className="panel" style={{ marginBottom: '22px' }}>
        <div className="panel-head"><h3>Filtros de Relatório</h3></div>
        <div className="panel-body">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="field">
              <label>Data Início</label>
              <input type="date" value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })} />
            </div>
            <div className="field">
              <label>Data Fim</label>
              <input type="date" value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })} />
            </div>
            <div className="field">
              <label>Veículo</label>
              <select value={filters.vehicleId} onChange={e => setFilters({ ...filters, vehicleId: e.target.value })}>
                <option value="">Todos os veículos</option>
                {db.vehicles.map(v => <option key={v.id} value={v.id}>{vehicleLabel(db, v.id)}</option>)}
              </select>
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button className="btn btn-ghost" style={{ width: 'auto' }} onClick={exportExcel}>Exportar Excel</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={exportPDF}>Exportar PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid kpi-grid">
        <div className="kpi b-red"><div className="num" style={{ fontSize: 24 }}>{fmtBRL(totalFiltered)}</div><div className="lbl">CUSTO TOTAL PERÍODO</div></div>
        <div className="kpi b-black"><div className="num" style={{ fontSize: 24 }}>{fmtBRL(fleetCostPerKm(db))}</div><div className="lbl">CUSTO MÉDIO KM (GERAL)</div></div>
      </div>

      <div className="panel"><div className="panel-head"><h3>Custo por veículo (Filtrados)</h3></div><div className="panel-body" style={{ overflowX: 'auto' }}>
        <table><thead><tr><th>Veículo</th>{cats.map((c) => <th key={c}>{c}</th>)}<th>Total</th></tr></thead>
          <tbody>{byV.map(({ v, c, total }) => <tr key={v.id}><td><b>{vehicleLabel(db, v.id)}</b></td>{cats.map((k) => <td key={k}>{fmtBRL(c[k])}</td>)}<td><b>{fmtBRL(total)}</b></td></tr>)}</tbody></table>
      </div></div>

      <div className="panel"><div className="panel-head"><h3>Evolução mensal</h3></div><div className="panel-body" style={{ height: 280 }}>
        <ResponsiveContainer><BarChart data={monthly}><XAxis dataKey="mes" /><YAxis /><Tooltip formatter={(v) => fmtBRL(v)} /><Bar dataKey="valor" fill="#9E1B1B" /></BarChart></ResponsiveContainer>
      </div></div>
    </>
  )
}
