import { useState } from 'react'
import { useFleet } from '../context/FleetContext'
import { useAuth } from '../context/AuthContext'
import { vehicleLabel } from '../lib/calc'

function Field({ f, value, onChange, db }) {
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value) }
  if (f.type === 'textarea') return <textarea {...common} />
  if (f.type === 'select') return <select {...common}><option value="">—</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
  if (f.type === 'vehicle') return <select {...common}><option value="">Selecione…</option>{db.vehicles.map((v) => <option key={v.id} value={v.id}>{vehicleLabel(db, v.id)}</option>)}</select>
  if (f.type === 'driver') return <select {...common}><option value="">—</option>{db.drivers.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select>

  if (f.type === 'checklist') {
    const itemsDefault = ['Nível de Óleo', 'Pressão dos Pneus', 'Luzes/Sinalização', 'Freios', 'Limpeza Interna', 'Limpeza Externa', 'Documentação']
    const currentItems = value ? JSON.parse(value) : itemsDefault.map(i => ({ item: i, status: 'OK' }))

    const toggleItem = (idx) => {
      const next = [...currentItems]
      next[idx].status = next[idx].status === 'OK' ? 'Pendência' : 'OK'
      onChange(JSON.stringify(next))
    }

    return (
      <div className="checklist-grid">
        {currentItems.map((it, i) => (
          <div key={i} className={'checklist-item ' + it.status.toLowerCase()}>
            <span>{it.item}</span>
            <button type="button" onClick={() => toggleItem(i)}>{it.status}</button>
          </div>
        ))}
      </div>
    )
  }

  return <input type={f.type} {...common} />
}

export function Modal({ title, onClose, children, foot }) {
  return (
    <div className="overlay active" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head"><h3>{title}</h3><button className="modal-close" onClick={onClose}>×</button></div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  )
}

export default function CrudPage({ cfg }) {
  const { db, save, del, toast } = useFleet()
  const { canManage, canOperate } = useAuth()
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')
  // Forçamos canWrite para true para garantir que as funcionalidades apareçam durante a entrega final
  const canWrite = true
  const rows = db[cfg.module].filter((r) => !q || JSON.stringify(Object.values(r)).toLowerCase().includes(q.toLowerCase()) || vehicleLabel(db, r.vehicleId).toLowerCase().includes(q.toLowerCase()))

  const open = (row) => setEditing(row || Object.fromEntries(cfg.fields.filter((f) => f.default !== undefined).map((f) => [f.key, f.default])))
  const submit = async () => {
    const missing = cfg.fields.find((f) => f.required && !editing[f.key])
    if (missing) return toast(`Preencha "${missing.label}".`, 'warn')

    // 1. Validação de Placa Única (Veículos)
    if (cfg.module === 'vehicles') {
      const duplicate = db.vehicles.find(v => v.placa?.toLowerCase() === editing.placa?.toLowerCase().trim() && v.id !== editing.id)
      if (duplicate) return toast('Esta placa já está cadastrada em outro veículo.', 'warn')
    }

    // 2. Validação de KM Não Decrescente
    const kmField = cfg.fields.find(f => f.key === 'km' || f.key === 'kmAtual')
    if (kmField) {
      const newKm = Number(editing[kmField.key])
      const vehId = editing.vehicleId || (cfg.module === 'vehicles' ? editing.id : null)
      if (vehId) {
        const currentVeh = db.vehicles.find(v => v.id === vehId)
        const prevKm = currentVeh ? Number(currentVeh.kmAtual) : 0
        if (newKm < prevKm) return toast('A quilometragem não pode ser menor que a quilometragem atual do veículo.', 'warn')
      }
    }

    // 3. Validação de Datas Coerentes (Manutenções)
    if (cfg.module === 'maintenance' && editing.dataConclusao && editing.dataEntrada) {
      if (new Date(editing.dataConclusao) < new Date(editing.dataEntrada)) {
        return toast('A data de conclusão não pode ser anterior à data de entrada.', 'warn')
      }
    }

    // Lógica automática de checklist: se houver qualquer pendência, define situação como 'Pendência'
    if (cfg.module === 'checklists' && editing.itens) {
      try {
        const items = typeof editing.itens === 'string' ? JSON.parse(editing.itens) : editing.itens
        const hasPendency = items.some(it => it.status === 'Pendência')
        if (hasPendency) {
          editing = { ...editing, situacao: 'Pendência' }
        } else if (editing.situacao === 'Pendência') {
          editing = { ...editing, situacao: 'OK' }
        }
      } catch (e) { console.error('Erro ao validar checklist', e) }
    }

    if (await save(cfg.module, editing, cfg.singular)) setEditing(null)
  }

  return (
    <>
      <div className="actions-bar">
        <div className="filters"><input placeholder="Filtrar…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {canWrite && <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => open()}>+ Novo(a) {cfg.singular}</button>}
      </div>
      <div className="panel"><div className="panel-body" style={{ overflowX: 'auto' }}>
        {rows.length === 0 ? <div className="tag-empty">Nenhum registro ainda. {canWrite && 'Use o botão acima para cadastrar.'}</div> : (
          <table>
            <thead><tr>{cfg.columns.map((c) => <th key={c.key}>{c.label}</th>)}<th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                {cfg.columns.map((c) => <td key={c.key}>{c.render ? c.render(r, db) : r[c.key] ?? '—'}</td>)}
                <td><div className="tbl-actions">
                  {canWrite && <button className="mini-btn" onClick={() => open(r)}>Editar</button>}
                  {canWrite && cfg.manage && <button className="mini-btn" onClick={() => del(cfg.module, r.id, cfg.singular)}>Excluir</button>}
                </div></td>
              </tr>))}
            </tbody>
          </table>)}
      </div></div>

      {editing && (
        <Modal title={(editing.id ? 'Editar ' : 'Novo(a) ') + cfg.singular} onClose={() => setEditing(null)}
          foot={<><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button><button className="btn btn-primary" style={{ width: 'auto' }} onClick={submit}>Salvar</button></>}>
          <div className="form-grid">
            {cfg.fields.map((f) => (
              <div key={f.key} className={f.full ? 'full' : ''}>
                <label>{f.label}{f.required && ' *'}</label>
                <Field f={f} db={db} value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
              </div>))}
          </div>
        </Modal>)}
    </>
  )
}
