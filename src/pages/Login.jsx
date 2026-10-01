import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('in')
  const [f, setF] = useState({ nome: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setInfo(''); setBusy(true)
    const { error, data } = mode === 'in' ? await signIn(f.email, f.password) : await signUp(f.email, f.password, f.nome)
    setBusy(false)
    if (error) return setErr(error.message)
    if (mode === 'up' && !data.session) setInfo('Conta criada. Confirme o e-mail e peça ao administrador para liberar seu perfil.')
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <div id="loginScreen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand"><span className="k1">SUPRA ALIMENTOS</span><span className="k2">Central de Gestão</span><span className="k3">DA FROTA</span></div>
        {mode === 'up' && <div className="field"><label>Seu nome</label><input value={f.nome} onChange={set('nome')} required /></div>}
        <div className="field"><label>E-mail</label><input type="email" value={f.email} onChange={set('email')} required /></div>
        <div className="field"><label>Senha</label><input type="password" minLength={6} value={f.password} onChange={set('password')} required /></div>
        {err && <p className="err-msg">{err}</p>}{info && <p className="login-foot">{info}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Aguarde…' : mode === 'in' ? 'Entrar' : 'Criar conta'}</button>
        <div className="login-foot"><button type="button" className="link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}</button><br />"QUEM PROVA, APROVA."</div>
      </form>
    </div>
  )
}
