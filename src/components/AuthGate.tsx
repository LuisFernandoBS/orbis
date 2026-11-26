import {useEffect,useState,type ReactNode} from 'react';import type {Session} from '@supabase/supabase-js';
import {supabase} from '../services/supabase';import {hydrate} from '../store';import {fd} from './ui';
function SplashScreen({syncing=false}:{syncing?:boolean}){return <div className="orbis-splash" role="status" aria-live="polite"><div className="splash-stars" aria-hidden="true"><i/><i/><i/><i/><i/></div><div className="splash-center"><div className="splash-orbit splash-orbit-one"/><div className="splash-orbit splash-orbit-two"/><div className="splash-logo-wrap"><img src="/logo.png" alt=""/><span/></div><div className="splash-wordmark">ORBIS</div><div className="splash-caption">{syncing?'Preparando seus dados':'Seu espaço, em harmonia'}</div><div className="splash-loader" aria-hidden="true"><i/></div></div><div className="splash-footnote">{syncing?'Sincronizando seu espaço':'Carregando sua experiência'}</div></div>}
function Login(){const [up,setUp]=useState(false);const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
const go=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=fd(e);setBusy(true);setMsg('');
try{const r=up?await supabase.auth.signUp({email:f.email,password:f.password}):await supabase.auth.signInWithPassword({email:f.email,password:f.password});
if(r.error)setMsg(r.error.message);else if(up&&!r.data.session)setMsg('Conta criada. Confirme o email para entrar.')}
finally{setBusy(false)}};
return <div className="overlay" style={{position:'static',minHeight:'100dvh'}}><form className="card form" style={{width:'min(380px,100%)'}} onSubmit={go}><div className="row" style={{gridColumn:'1/-1'}}><img src="/logo.png" className="logo-img" alt=""/><b>ORBIS</b></div>
<label style={{gridColumn:'1/-1'}}>Email<input name="email" type="email" required autoComplete="email"/></label><label style={{gridColumn:'1/-1'}}>Senha<input name="password" type="password" minLength={6} required autoComplete={up?'new-password':'current-password'}/></label>
{msg&&<small style={{gridColumn:'1/-1',color:'#ef6b73'}}>{msg}</small>}<div className="row" style={{gridColumn:'1/-1'}}><button className="btn" style={{width:'100%'}} disabled={busy}>{up?'Criar conta':'Entrar'}</button><button type="button" className="btn ghost" style={{width:'100%'}} onClick={()=>setUp(!up)}>{up?'Já tenho conta':'Criar conta'}</button></div></form></div>}
export default function AuthGate({children}:{children:ReactNode}){const [ses,setSes]=useState<Session|null|undefined>(undefined);const [ready,setReady]=useState(false);const [err,setErr]=useState('');
useEffect(()=>{supabase.auth.getSession().then(({data,error})=>{if(error)setErr(error.message);setSes(data.session)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>{setErr('');setSes(s)});return()=>data.subscription.unsubscribe()},[]);
const uid=ses?.user.id;useEffect(()=>{setReady(false);if(uid)hydrate().then(()=>setReady(true)).catch(e=>setErr(String(e?.message??e)))},[uid]);
if(ses===undefined)return <div className="empty">Carregando…</div>;if(!ses)return <Login/>;
if(err)return <div className="empty">Erro ao carregar seus dados: {err}<br/>Rodou o supabase/schema.sql?</div>;
return ready?<>{children}</>:<div className="empty">Sincronizando…</div>}
