import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES, listAll, upsert, remove, audit } from '../lib/repo'
import { useAuth } from './AuthContext'

const Ctx = createContext(null)
export const useFleet = () => useContext(Ctx)
const empty = () => Object.fromEntries(Object.keys(TABLES).map((k) => [k, []]))

export function FleetProvider({ children }) {
  const { session, profile } = useAuth()
  const [db, setDb] = useState(empty())
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'ok') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const reload = useCallback(async (modules = Object.keys(TABLES)) => {
    try {
      const res = await Promise.all(modules.map((m) => listAll(m)))
      setDb((d) => ({ ...d, ...Object.fromEntries(modules.map((m, i) => [m, res[i]])) }))
    } catch (e) { toast('Erro ao carregar dados: ' + e.message, 'err') }
  }, [toast])

  useEffect(() => { if (session) reload().finally(() => setLoading(false)) }, [session, reload])

  // Realtime: mudanças feitas por outros usuários atualizam a tela.
  useEffect(() => {
    if (!session) return
    const ch = supabase.channel('fleet').on('postgres_changes', { event: '*', schema: 'public' }, (p) => {
      const mod = Object.keys(TABLES).find((k) => TABLES[k] === p.table)
      if (mod) reload([mod])
    }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session, reload])

  const save = async (module, obj, label) => {
    try {
      const saved = await upsert(module, obj)
      await reload([module])
      audit(profile?.nome, obj.id ? 'Editou' : 'Criou', label || module)
      toast('Salvo com sucesso.')
      return saved
    } catch (e) {
      console.error('Save error:', e)
      toast('Falha ao salvar: ' + e.message, 'err')
    }
  }
  const del = async (module, id, label) => {
    if (!window.confirm('Excluir este registro? Esta ação não pode ser desfeita.')) return
    try { await remove(module, id); await reload([module]); audit(profile?.nome, 'Excluiu', label || module); toast('Registro excluído.') }
    catch (e) { toast('Falha ao excluir: ' + e.message, 'err') }
  }

  return (
    <Ctx.Provider value={{ db, loading, reload, save, del, toast }}>
      {children}
      <div className="toast-wrap">{toasts.map((t) => <div key={t.id} className={'toast ' + t.type}>{t.msg}</div>)}</div>
    </Ctx.Provider>
  )
}
