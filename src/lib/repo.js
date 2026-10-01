import { supabase } from './supabase'

const snake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
const mapKeys = (o, fn) => Object.fromEntries(Object.entries(o).map(([k, v]) => [fn(k), v]))
const clean = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '' ? null : v]))

// módulo (app) -> tabela (Supabase). Módulo novo = 1 linha aqui + 1 tabela no schema.sql
export const TABLES = {
  vehicles: 'vehicles', drivers: 'drivers', maintenance: 'maintenance', oil: 'oil_changes',
  preventive: 'preventive', kmLog: 'km_log', checklists: 'checklists', refuels: 'refuels',
  tires: 'tires', damages: 'damages', documents: 'documents', workshops: 'workshops',
}

export async function listAll(module) {
  const { data, error } = await supabase.from(TABLES[module]).select('*')
  if (error) throw error
  return data.map((r) => mapKeys(r, camel))
}
export async function upsert(module, obj) {
  const row = clean(mapKeys(obj, snake))
  delete row.created_at
  const q = supabase.from(TABLES[module])
  const { data, error } = await (row.id ? q.update(row).eq('id', row.id) : q.insert(row)).select().single()
  if (error) throw error
  return mapKeys(data, camel)
}
export async function remove(module, id) {
  const { error } = await supabase.from(TABLES[module]).delete().eq('id', id)
  if (error) throw error
}
export async function audit(usuario, acao, detalhe) {
  await supabase.from('audit_log').insert({ usuario, acao, detalhe })
}

export async function uploadFile(file, folder = 'general') {
  const { data, error } = await supabase.storage
    .from('fleet_attachments')
    .upload(`attachments/${folder}/${Date.now()}_${file.name}`, file, {
      cacheControl: '3600',
      upsert: true
    })
  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('fleet_attachments')
    .getPublicUrl(data.path)

  return publicUrl
}

export async function deleteFile(path) {
  const { error } = await supabase.storage
    .from('fleet_attachments')
    .remove([path])
  if (error) throw error
}
