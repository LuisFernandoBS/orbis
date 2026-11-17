import {useState} from 'react';import {ChevronDown,ChevronRight,Circle,CheckCircle2} from 'lucide-react';
import KNav from '../components/KNav';import {set,useStore} from '../store';import {progress} from '../utils';import type {Subject} from '../types';
const P=(a:number,b:number,c:number,d:number)=>`M${a} ${b}C${(a+c)/2} ${b} ${(a+c)/2} ${d} ${c} ${d}`;
const gdone=(g:Subject['goals'][0])=>g.done||(g.subs.length>0&&g.subs.every(y=>y.done));
function layout(x:Subject,ex:string[]){let c=40;const goals=x.goals.map(g=>{if(ex.includes(g.id)&&g.subs.length){const ys=g.subs.map((_,i)=>c+i*36);c+=g.subs.length*36+14;return{g,ys,y:(ys[0]+ys[ys.length-1])/2}}const y=c;c+=50;return{g,ys:[] as number[],y}});
const all=goals.map(o=>o.y);return{goals,sy:all.length?(Math.min(...all)+Math.max(...all))/2:80,H:Math.max(200,c+10)}}
export default function Neural(){const s=useStore();const [sid,setSid]=useState('');const [ex,setEx]=useState<string[]>([]);const [sel,setSel]=useState<string|null>(null);
const sub=s.subjects.find(x=>x.id===sid);const tog=(id:string)=>setEx(e=>e.includes(id)?e.filter(z=>z!==id):[...e,id]);
const flip=(gid:string,id:string)=>set(st=>({...st,subjects:st.subjects.map(x=>({...x,goals:x.goals.map(g=>{if(g.id!==gid)return g;const subs=g.subs.map(y=>y.id===id?{...y,done:!y.done}:y);return{...g,subs,done:subs.every(y=>y.done)}})}))}));
const cur=s.subjects.flatMap(x=>x.goals.flatMap(g=>g.subs.map(y=>({x,g,y})))).find(o=>o.y.id===sel);
const mats=cur?s.materials.filter(m=>[cur.y.id,cur.g.id,cur.x.id].some(i=>m.links.includes(i))):[];
const n=s.subjects.length;
return <><KNav/><div className="between"><div><h1>Mapa neural</h1><p className="sub">Toque no assunto, depois na meta, depois no subtema.</p></div>
<select className="gview" value={sid} onChange={e=>{setSid(e.target.value);setSel(null)}}><option value="">Todos os assuntos</option>{s.subjects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
<div className="two" style={{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))'}}>
<div className="card gview" style={{gridColumn:'span 2'}}>{!sub?<svg viewBox="0 0 860 420" className="graph">{s.subjects.map((x,i)=>{const a=2*Math.PI*i/n-Math.PI/2,px=430+190*Math.cos(a),py=210+150*Math.sin(a),p=progress(x).pct;return <g key={x.id}><path className="lp" d={`M430 210L${px} ${py}`}/>
<g className="node" onClick={()=>setSid(x.id)}><circle cx={px} cy={py} r={30} className="n-todo"/><circle cx={px} cy={py} r={30} className="ring" strokeDasharray={`${p*1.885} 189`} transform={`rotate(-90 ${px} ${py})`}/><text x={px} y={py+4} textAnchor="middle" className="nt">{p}%</text><text x={px} y={py+50} textAnchor="middle" className="nt">{x.name.slice(0,22)}</text></g></g>})}<circle cx={430} cy={210} r={7} className="n-done"/></svg>
:(()=>{const {goals,sy,H}=layout(sub,ex);return <svg viewBox={`0 0 860 ${H}`} className="graph">
{goals.map(o=><g key={o.g.id}><path className="lp" d={P(90,sy,360,o.y)}/>{o.ys.map((y,i)=><path key={i} className="lp" d={P(360,o.y,620,y)}/>)}</g>)}
<g className="node" onClick={()=>setSid('')}><circle cx={90} cy={sy} r={30} className="n-done"/><text x={90} y={sy+52} textAnchor="middle" className="nt">{sub.name.slice(0,20)}</text></g>
{goals.map(o=><g key={o.g.id}><g className="node" onClick={()=>tog(o.g.id)}><circle cx={360} cy={o.y} r={16} className={gdone(o.g)?'n-done':'n-todo'}/><text x={360} y={o.y+32} textAnchor="middle" className="nt">{o.g.name.slice(0,24)}</text></g>
{o.ys.map((y,i)=>{const sb=o.g.subs[i];return <g key={sb.id} className="node" onClick={()=>setSel(sb.id)}><circle cx={620} cy={y} r={sel===sb.id?11:8} className={(sb.done?'n-done':'n-todo')+(sel===sb.id?' sel':'')}/><text x={636} y={y+4} className="nt">{sb.name.slice(0,26)}</text></g>})}</g>)}</svg>})()}</div>
<div className="tview" style={{gridColumn:'1/-1'}}>{s.subjects.map(x=>{const o=sid===x.id;return <div key={x.id} className="card"><button className="link row" style={{width:'100%'}} onClick={()=>setSid(o?'':x.id)}>{o?<ChevronDown size={18}/>:<ChevronRight size={18}/>}<b>{x.name}</b><span className="badge">{progress(x).pct}%</span></button>
{o&&<div className="tree">{x.goals.map(g=><div key={g.id}><button className="link row" onClick={()=>tog(g.id)}>{ex.includes(g.id)?<ChevronDown size={16}/>:<ChevronRight size={16}/>}{gdone(g)?<CheckCircle2 size={16} color="#42D6D0"/>:<Circle size={16}/>}{g.name}</button>
{ex.includes(g.id)&&<div className="tree">{g.subs.map(y=><button key={y.id} className="link row" onClick={()=>setSel(y.id)}>{y.done?<CheckCircle2 size={16} color="#42D6D0"/>:<Circle size={16}/>}{y.name}</button>)}</div>}</div>)}</div>}</div>})}</div></div>
{cur&&<div className="card"><small>{cur.x.name} → {cur.g.name}</small><h3>{cur.y.name}</h3><label className="row"><input type="checkbox" checked={cur.y.done} onChange={()=>flip(cur.g.id,cur.y.id)}/>Marcar como concluído</label>
<h4>Materiais relacionados</h4>{mats.length?mats.map(m=><div key={m.id}><a href={m.url} target="_blank" rel="noreferrer" style={{color:'var(--lav)'}}>{m.name}</a> <small>({m.status})</small></div>):<small>Nenhum material ligado.</small>}</div>}</>}
