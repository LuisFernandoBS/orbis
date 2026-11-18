import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronLeft,ChevronRight,Calendar as CalendarIcon,CheckCircle2,Circle} from 'lucide-react';
import {useStore,set} from '../../store';
import {Modal} from '../../components/ui';
import {today} from '../../utils';
import type {Task} from '../../types';
import {isTaskDone,isTaskOverdue,toggleTask,updateTask} from '../../services/planning';
import {PriBadge} from './shared';

export default function CalendarView(){
const s=useStore();
const [mode,setMode]=useState<'month'|'week'>('month');
const [date,setDate]=useState(new Date());
const [selTask,setSelTask]=useState<Task|null>(null);

const PL=s.planning;
const activeObjs=PL.objectives.filter(o=>!o.archived);
const activeObjIds=new Set(activeObjs.map(o=>o.id));
const tasks=PL.tasks.filter(t=>activeObjIds.has(t.objectiveId)&&t.due);

// Navegação de datas
const prev=()=>{const d=new Date(date);if(mode==='month')d.setMonth(d.getMonth()-1);else d.setDate(d.getDate()-7);setDate(d)};
const next=()=>{const d=new Date(date);if(mode==='month')d.setMonth(d.getMonth()+1);else d.setDate(d.getDate()+7);setDate(d)};

const title=mode==='month'?date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):`Semana de ${new Date(date.getTime()-date.getDay()*864e5).toLocaleDateString('pt-BR')}`;

// Montar matriz do mês ou semana
const days=Array.from({length:mode==='month'?42:7},(_,i)=>{
const d=new Date(date);
if(mode==='month'){
  d.setDate(1);
  const startDay=d.getDay();
  d.setDate(i-startDay+1);
}else{
  const day=d.getDay();
  d.setDate(d.getDate()-day+i);
}
return d.toISOString().slice(0,10);
});

return <><div className="between"><div><h1>Calendário de Tarefas</h1><p className="sub">Visualize e ajuste prazos por data</p></div>
<div className="row"><button className="btn ghost sm" onClick={()=>setDate(new Date())}>Hoje</button><button className={'btn sm '+(mode==='month'?'':'ghost')} onClick={()=>setMode('month')}>Mês</button><button className={'btn sm '+(mode==='week'?'':'ghost')} onClick={()=>setMode('week')}>Semana</button></div></div>
<div className="card between"><button className="ib" onClick={prev}><ChevronLeft size={20}/></button><h3 style={{textTransform:'capitalize'}}>{title}</h3><button className="ib" onClick={next}><ChevronRight size={20}/></button></div>
<div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:6,marginBottom:8}}>{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=><div key={d} style={{textAlign:'center',fontSize:'.8rem',color:'var(--mut)',fontWeight:700}}>{d}</div>)}</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:6}}>
{days.map(dStr=>{const ts=tasks.filter(t=>t.due===dStr);const isToday=dStr===today();const isOtherMonth=mode==='month'&&dStr.slice(0,7)!==date.toISOString().slice(0,7);
return <div key={dStr} className="card" style={{minHeight:110,padding:8,opacity:isOtherMonth?.4:1,borderColor:isToday?'var(--pri)':'var(--bd)'}}>
<div className="between"><small style={{fontWeight:700}}>{dStr.split('-')[2]}</small></div>
<div style={{display:'grid',gap:4,marginTop:6}}>
{ts.map(t=>{const done=isTaskDone(t);const late=isTaskOverdue(t);const o=PL.objectives.find(x=>x.id===t.objectiveId);
return <button key={t.id} className="link" style={{padding:'4px 6px',fontSize:'.75rem',background:'var(--bg)',borderRadius:6,textAlign:'left',width:'100%',justifyContent:'flex-start',borderLeft:late?'3px solid #ef6b73':undefined}} onClick={()=>setSelTask(t)}>
<span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:done?'line-through':'none'}}>{t.name}</span>
</button>})}
</div>
</div>})}
</div>
{selTask&&<TaskDateModal task={selTask} onClose={()=>setSelTask(null)}/>}</>;
}

function TaskDateModal({task,onClose}:{task:Task;onClose:()=>void}){
const s=useStore();
const o=s.planning.objectives.find(x=>x.id===task.objectiveId);
const done=isTaskDone(task);
return <Modal title={task.name} onClose={onClose}>
<div style={{display:'grid',gap:12}}>
<p><b>Objetivo:</b> {o?.name}</p>
<p><b>Status:</b> {task.status}</p>
<label>Alterar Data Limite<input type="date" defaultValue={task.due??''} onChange={e=>{const due=e.target.value||null;set(st=>({...st,planning:updateTask(st.planning,task.id,{due})}))}}/></label>
<div className="row">
<button className="btn sm ghost" onClick={()=>{set(st=>({...st,planning:toggleTask(st.planning,task.id)}));onClose()}}>{done?'Reabrir tarefa':'Concluir tarefa'}</button>
<Link to="/planning/tasks" className="btn sm" onClick={onClose}>Ir para Todas as Tarefas</Link>
</div>
</div>
</Modal>;
}
