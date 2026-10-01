// Regras de negócio portadas do HTML original (funções puras; recebem o "db").
export const todayIso = () => new Date().toISOString().slice(0, 10)
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)
export const fmtBRL = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const fmtDate = (iso) => (iso ? iso.split('-').reverse().join('/') : '—')
export const num = (v) => Number(v) || 0

export const vehicleById = (db, id) => db.vehicles.find((v) => v.id === id)
export const vehicleLabel = (db, id) => { const v = vehicleById(db, id); return v ? `${v.numero} · ${v.placa}` : '—' }
export const driverName = (db, id) => db.drivers.find((d) => d.id === id)?.nome || '—'

export const maintenanceCost = (m) => num(m.pecas) + num(m.maoObra) + num(m.outros)
export const isOpenMaint = (m) => m.status !== 'Finalizada' && m.status !== 'Cancelada'
export const isMaintLate = (m) => isOpenMaint(m) && m.dataPrevista && daysBetween(m.dataPrevista, todayIso()) > 0
export const stoppedDays = (m) => daysBetween(m.dataEntrada, todayIso())

function periodic(db, vehicleId, baseKm, baseDate, perKm, perMeses, yKm, yDias) {
  const kmAtual = vehicleById(db, vehicleId)?.kmAtual ?? baseKm
  const kmRestante = num(baseKm) + num(perKm) - num(kmAtual)
  const dt = new Date(baseDate); dt.setMonth(dt.getMonth() + num(perMeses))
  const proxData = dt.toISOString().slice(0, 10)
  const diasRestantes = daysBetween(todayIso(), proxData)
  let status = 'g'
  if (kmRestante <= 0 || diasRestantes <= 0) status = 'r'
  else if (kmRestante <= yKm || diasRestantes <= yDias) status = 'y'
  return { status, kmRestante, diasRestantes, proxData }
}
export const oilStatus = (db, o) => periodic(db, o.vehicleId, o.km, o.data, o.periodicidadeKm, o.periodicidadeMeses, 1500, 20)
export const preventiveInfo = (db, p) => periodic(db, p.vehicleId, p.ultimaExecucaoKm, p.ultimaExecucaoData, p.periodicidadeKm, p.periodicidadeMeses, 1000, 15)
export const docStatus = (d) => {
  if (!d.dataVencimento) return 'g'
  const x = daysBetween(todayIso(), d.dataVencimento)
  return x <= 0 ? 'r' : x <= 30 ? 'y' : 'g'
}

export function healthScore(db, vid) {
  const veh = vehicleById(db, vid); if (!veh) return 0
  let s = 100
  db.maintenance.filter((m) => m.vehicleId === vid && isOpenMaint(m)).forEach((m) => {
    s -= 8; if (isMaintLate(m)) s -= 12; if (stoppedDays(m) > 5) s -= 8
  })
  db.oil.filter((o) => o.vehicleId === vid).forEach((o) => { const t = oilStatus(db, o).status; s -= t === 'r' ? 15 : t === 'y' ? 6 : 0 })
  db.preventive.filter((p) => p.vehicleId === vid).forEach((p) => { const t = preventiveInfo(db, p).status; s -= t === 'r' ? 12 : t === 'y' ? 5 : 0 })
  db.damages.filter((d) => d.vehicleId === vid && d.status !== 'Resolvida').forEach((d) => { s -= d.classificacao === 'Crítica' ? 15 : d.classificacao === 'Moderada' ? 7 : 3 })
  db.documents.filter((d) => d.vehicleId === vid).forEach((d) => { const t = docStatus(d); s -= t === 'r' ? 12 : t === 'y' ? 4 : 0 })
  if (veh.status === 'Bloqueado') s -= 20
  if (veh.status === 'Pendente') s -= 8
  return Math.max(0, Math.min(100, Math.round(s)))
}
export const scoreColor = (s) =>
  s >= 90 ? { c: '#2E7D46', label: 'Excelente' } : s >= 75 ? { c: '#5B8A3D', label: 'Bom' } : s >= 60 ? { c: '#C08A28', label: 'Atenção' } : { c: '#9E1B1B', label: 'Crítico' }
export const statusBadge = (s) => ({ Disponível: 'disp', Pendente: 'pend', 'Em Manutenção': 'manu', Bloqueado: 'bloq' }[s] || 'inat')

export function buildAlerts(db) {
  const a = []
  const push = (level, text, to) => a.push({ level, text, to })
  db.maintenance.filter(isOpenMaint).forEach((m) => {
    const v = vehicleById(db, m.vehicleId); if (!v) return
    const sd = stoppedDays(m)
    if (isMaintLate(m)) push('r', `Veículo ${v.numero} com manutenção atrasada (prevista ${fmtDate(m.dataPrevista)}).`, '/manutencoes')
    else if (sd >= 3) push('r', `Veículo ${v.numero} em manutenção há ${sd} dia(s).`, '/manutencoes')
    else if (sd >= 1) push('y', `Veículo ${v.numero} em manutenção há ${sd} dia(s) — acompanhar.`, '/manutencoes')
  })
  db.oil.forEach((o) => {
    const v = vehicleById(db, o.vehicleId); if (!v) return
    const s = oilStatus(db, o)
    if (s.status === 'r') push('r', `Veículo ${v.numero} com troca de óleo atrasada.`, '/oleo')
    else if (s.status === 'y') push('y', `Veículo ${v.numero} troca óleo em ${Math.max(0, s.kmRestante)} km (~${Math.max(0, s.diasRestantes)} dias).`, '/oleo')
  })
  db.preventive.forEach((p) => {
    const v = vehicleById(db, p.vehicleId); if (!v) return
    const s = preventiveInfo(db, p)
    if (s.status !== 'g') push(s.status, `Veículo ${v.numero}: preventiva "${p.servico}" ${s.status === 'r' ? 'atrasada' : 'próxima'}.`, '/preventivas')
  })
  db.vehicles.filter((v) => v.status === 'Bloqueado').forEach((v) => push('r', `Veículo ${v.numero} está BLOQUEADO.`, '/frota'))
  db.documents.forEach((d) => {
    const v = vehicleById(db, d.vehicleId); if (!v) return
    const s = docStatus(d)
    if (s !== 'g') push(s, `${d.tipo} do veículo ${v.numero} ${s === 'r' ? 'vencido' : 'vence em ' + daysBetween(todayIso(), d.dataVencimento) + ' dia(s)'}.`, '/documentacao')
  })
  db.damages.filter((d) => d.status !== 'Resolvida').forEach((d) => {
    const v = vehicleById(db, d.vehicleId); if (!v) return
    const dias = daysBetween(d.data, todayIso())
    if (d.classificacao === 'Crítica') push('r', `Veículo ${v.numero} com avaria crítica há ${dias} dia(s).`, '/avarias')
    else if (dias >= 7) push('y', `Veículo ${v.numero} com avaria pendente há ${dias} dia(s).`, '/avarias')
  })
  const o = { r: 0, y: 1, g: 2 }
  return a.sort((x, y) => o[x.level] - o[y.level])
}

export function costEvents(db) {
  const e = []
  db.maintenance.forEach((m) => e.push({ vehicleId: m.vehicleId, data: m.dataEntrada, valor: maintenanceCost(m), cat: 'Manutenção' }))
  db.oil.forEach((o) => e.push({ vehicleId: o.vehicleId, data: o.data, valor: num(o.custo), cat: 'Óleo' }))
  db.refuels.forEach((r) => e.push({ vehicleId: r.vehicleId, data: r.data, valor: num(r.valor), cat: 'Combustível' }))
  db.documents.forEach((d) => e.push({ vehicleId: d.vehicleId, data: d.dataVencimento, valor: num(d.custo), cat: 'Documentação' }))
  db.damages.forEach((d) => e.push({ vehicleId: d.vehicleId, data: d.data, valor: num(d.custo), cat: 'Avaria' }))
  db.tires.forEach((t) => e.push({ vehicleId: t.vehicleId, data: t.dataInstalacao, valor: num(t.valor), cat: 'Pneus' }))
  return e.filter((x) => x.valor > 0 && x.data)
}
export const fleetTotalCost = (db) => costEvents(db).reduce((s, e) => s + e.valor, 0)
export const fleetCostPerKm = (db) => { const km = db.vehicles.reduce((s, v) => s + num(v.kmAtual), 0); return km ? fleetTotalCost(db) / km : 0 }
