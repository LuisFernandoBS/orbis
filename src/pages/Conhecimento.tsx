import KNav from '../components/KNav';import {useState} from 'react';import {ChevronDown,ChevronRight,Pencil,Trash2} from 'lucide-react';
import {useStore,set,uid} from '../store';import {AddInline,Progress,Empty} from '../components/ui';import {progress} from '../utils';import type {Subject,Goal} from '../types';
export default function Conhecimento(){const s=useStore();const [open,setOpen]=useState<string|null>(null);
const up=(sid:string,fn:(x:Subject)=>Subject)=>set(st=>({...st,subjects:st.subjects.map(x=>x.id===sid?fn(x):x)}));
const ug=(sid:string,gid:string,fn:(g:Goal)=>Goal)=>up(sid,x=>({...x,goals:x.goals.map(g=>g.id===gid?fn(g):g)}));
const ren=(n:string)=>prompt('Novo nome',n)?.trim()||n;
return <><KNav/><h1>Conhecimento</h1><p className="sub">Assuntos → metas → subtemas. Progresso = subtemas concluídos (meta sem subtemas conta como 1 unidade).</p>
<AddInline ph="Novo assunto" onAdd={v=>set(st=>({...st,subjects:[...st.subjects,{id:uid(),name:v,goals:[]}]}))}/>
{s.subjects.length?s.subjects.map(x=>{const p=progress(x),o=open===x.id;return <div key={x.id} className="card"><div className="between"><button className="row link" onClick={()=>setOpen(o?null:x.id)}>{o?<ChevronDown size={18}/>:<ChevronRight size={18}/>}<b>{x.name}</b><span className="badge">{p.pct}%</span></button>
<span className="row"><button className="ib" aria-label="Renomear" onClick={()=>up(x.id,y=>({...y,name:ren(y.name)}))}><Pencil size={16}/></button><button className="ib" aria-label="Excluir" onClick={()=>confirm('Excluir assunto?')&&set(st=>({...st,subjects:st.subjects.filter(y=>y.id!==x.id)}))}><Trash2 size={16}/></button></span></div>
<small>{x.goals.length} metas · {p.d}/{p.t} concluídos</small><Progress v={p.pct}/>
{o&&<div className="tree">{x.goals.map(g=><div key={g.id}><div className="between"><label className="row"><input type="checkbox" checked={g.done||(g.subs.length>0&&g.subs.every(y=>y.done))} onChange={e=>ug(x.id,g.id,h=>({...h,done:e.target.checked,subs:h.subs.map(y=>({...y,done:e.target.checked}))}))}/><b>{g.name}</b></label>
<span className="row"><button className="ib" aria-label="Renomear" onClick={()=>ug(x.id,g.id,h=>({...h,name:ren(h.name)}))}><Pencil size={14}/></button><button className="ib" aria-label="Excluir" onClick={()=>up(x.id,y=>({...y,goals:y.goals.filter(h=>h.id!==g.id)}))}><Trash2 size={14}/></button></span></div>
<div className="tree">{g.subs.map(y=><div key={y.id} className="between"><label className="row"><input type="checkbox" checked={y.done} onChange={e=>ug(x.id,g.id,h=>{const subs=h.subs.map(z=>z.id===y.id?{...z,done:e.target.checked}:z);return{...h,subs,done:subs.every(z=>z.done)}})}/>{y.name}</label>
<button className="ib" aria-label="Excluir" onClick={()=>ug(x.id,g.id,h=>({...h,subs:h.subs.filter(z=>z.id!==y.id)}))}><Trash2 size={14}/></button></div>)}
<AddInline ph="Novo subtema" onAdd={v=>ug(x.id,g.id,h=>({...h,done:false,subs:[...h.subs,{id:uid(),name:v,done:false}]}))}/></div></div>)}
<AddInline ph="Nova meta" onAdd={v=>up(x.id,y=>({...y,goals:[...y.goals,{id:uid(),name:v,done:false,subs:[]}]}))}/></div>}</div>}):<Empty text="Cadastre seu primeiro assunto."/>}</>}
