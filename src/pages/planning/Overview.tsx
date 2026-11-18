import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Target,ListTodo,CheckCircle2,AlertTriangle,Plus,ArrowRight,Gauge,CalendarClock,Check,Archive,Pencil,Circle,PlusCircle,RotateCcw,Undo2,type LucideIcon} from 'lucide-react';
import {useStore,set} from '../../store';
import {Modal,Empty,toast} from '../../components/ui';
import {today} from '../../utils';
import type {Task} from '../../types';
import {planningStats,isTaskDone,isTaskOverdue,objectiveProgress,toggleTask,updateTask,tasksOf} from '../../services/planning';
import {PriBadge} from './shared';

const rel=(iso:string)=>{const d=new Date(iso);const diff=Date.now()-d.getTime();const m=Math.floor(diff/60000);if(m<1)return 'agora';if(m<60)return `há ${m} min`;const h=Math.floor(m/60);if(h<24)return `há ${h}h`;const days=Math.floor(h/24);if(days<7)return days===1?'há 1 dia':`há ${days} dias`;return d.toLocaleDateString('pt-BR')};
const actIcon=(type:string):LucideIcon=>{
  if(type.startsWith('objetivo-criado'))return Target;
  if(type.startsWith('objetivo-concluido'))return CheckCircle2;
  if(type.startsWith('objetivo-reaberto'))return RotateCcw;
  if(type.startsWith('objetivo-arquivado'))return Archive;
  if(type.startsWith('objetivo-restaurado'))return Undo2;
  if(type.startsWith('objetivo-editado'))return Pencil;
  if(type.startsWith('tarefa-criada'))return PlusCircle;
  if(type.startsWith('tarefa-concluida'))return CheckCircle2;
  if(type.startsWith('tarefa-reaberta'))return RotateCcw;
  if(type.startsWith('subtarefa'))return Check;
  return ListTodo;
};
const CAT_COLOR:Record<string,string>={Estudos:'#8B5CF6',Pessoal:'#42D6D0',Financeiro:'#F0B86E',Profissional:'#B69CFF',Casa:'#7DD3FC','Saúde e bem-estar':'#34D399',Outros:'#989AAF'};
const catStyle=(c:string)=>{const col=CAT_COLOR[c]??'#989AAF';return{color:col,borderColor:col+'55',background:col+'1f'}};

export default function Overview(){
const s=useStore();
const st=planningStats(s.planning);
const activeObjs=s.planning.objectives.filter(o=>!o.archived);
const inProgressObjs=activeObjs.filter(o=>o.status==='em-andamento');
const activeIds=new Set(activeObjs.map(o=>o.id));
const activeTasks=s.planning.tasks.filter(t=>activeIds.has(t.objectiveId));
const pendingTasks=activeTasks.filter(t=>!isTaskDone(t)).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
const lateTasks=pendingTasks.filter(isTaskOverdue);
const overall=activeObjs.length?Math.round(activeObjs.reduce((a,o)=>a+objectiveProgress(s.planning,o.id),0)/activeObjs.length):0;
const mainObjs=[...activeObjs].sort((a,b)=>Number(b.favorite)-Number(a.favorite)||objectiveProgress(s.planning,b.id)-objectiveProgress(s.planning,a.id)).slice(0,4);
const [reagendar,setReagendar]=useState<Task|null>(null);
const [newDue,setNewDue]=useState('');

return <>
<div className="phead"><div><h1>Visão Geral do Planejamento</h1><p className="sub">Seus objetivos, tarefas e prioridades num relance</p></div><div className="row" style={{margin:0}}><Link to="/planning/objectives" className="btn sm"><Plus size={14}/>Novo objetivo</Link><Link to="/planning/tasks" className="btn ghost sm"><Plus size={14}/>Nova tarefa</Link></div></div>

<div className="kpis">
<div className="card kpi hov fade-up" style={{animationDelay:'0ms'}}>
<span className="kico"><Target size={20}/></span>
<b>{st.objectives}</b>
<span className="klabel">Objetivos ativos</span>
<small>{inProgressObjs.length} em andamento · {st.completed} concluído{st.completed===1?'':'s'}</small>
</div>
<div className="card kpi hov fade-up" style={{animationDelay:'60ms'}}>
<span className="kico aqua"><Gauge size={20}/></span>
<b>{overall}<i className="pct">%</i></b>
<span className="klabel">Progresso Geral</span>
<AnimatedBar v={overall}/>
<small>média dos objetivos ativos</small>
</div>
<div className="card kpi hov fade-up" style={{animationDelay:'120ms'}}>
<span className="kico amb"><ListTodo size={20}/></span>
<b>{st.tasksPending}</b>
<span className="klabel">Tarefas pendentes</span>
<small>{st.tasksDone} concluída{st.tasksDone===1?'':'s'} no total</small>
</div>
<div className={'card kpi hov fade-up'+(lateTasks.length?' warn':'')} style={{animationDelay:'180ms'}}>
<span className="kico red"><AlertTriangle size={20}/></span>
<b>{lateTasks.length}</b>
<span className="klabel">Atenção necessária</span>
<small>{lateTasks.length?`${lateTasks.length} tarefa${lateTasks.length===1?'':'s'} atrasada${lateTasks.length===1?'':'s'}`:'tudo em dia — nada atrasado'}</small>
</div>
</div>

{lateTasks.length>0&&<div className="card alert hov fade-up" style={{animationDelay:'220ms'}}>
<div className="between" style={{marginBottom:8}}><h3 style={{margin:0,display:'flex',alignItems:'center',gap:8}}><AlertTriangle size={18} color="#ef6b73"/>Tarefas Atrasadas<small style={{fontWeight:400}}>exigem ação</small></h3><Link to="/planning/tasks" className="btn ghost sm">Ver todas<ArrowRight size={12}/></Link></div>
{lateTasks.slice(0,3).map(t=>{const o=s.planning.objectives.find(x=>x.id===t.objectiveId);return <div key={t.id} className="alert-row">
<div className="alert-txt"><b>{t.name}</b><small>{o?.name} · venceu em {new Date(t.due+'T00:00:00').toLocaleDateString('pt-BR')}</small></div>
<div className="row" style={{margin:0,flex:'none'}}><button className="btn sm btn-done" onClick={()=>{set(st=>({...st,planning:toggleTask(st.planning,t.id)}));toast('Tarefa concluída')}}><Check size={14}/>Concluir</button><button className="btn ghost sm" onClick={()=>{setReagendar(t);setNewDue(t.due??today())}}><CalendarClock size={14}/>Reagendar</button></div>
</div>})}
</div>}

<div className="two">
<div className="card fade-up" style={{animationDelay:'260ms'}}><div className="between" style={{marginBottom:2}}><h3 style={{margin:0}}>Meus Objetivos Principais</h3><Link to="/planning/objectives" className="link-more">Todos<ArrowRight size={12}/></Link></div><small>Acompanhe o andamento geral</small>
<div style={{display:'grid',gap:10,marginTop:12}}>
{mainObjs.length?mainObjs.map(o=>{const pr=objectiveProgress(s.planning,o.id);const ts=tasksOf(s.planning,o.id);const done=ts.filter(isTaskDone).length;const cat=o.category;
return <Link key={o.id} to={`/planning/objectives?id=${o.id}`} className="obj-card hov">
<div className="between" style={{flexWrap:'nowrap',gap:8}}><b className="obj-name">{o.name}</b><span className="badge cat" style={catStyle(cat)}>{cat}</span></div>
<ProgressRow v={pr}/>
<div className="between" style={{marginTop:6}}><small>{done}/{ts.length} tarefas concluídas</small><span className="mpct" style={{color:pr>=100?'var(--aqua)':'var(--lav)'}}>{pr}%</span></div>
</Link>}):<Empty text="Nenhum objetivo cadastrado."/>}
</div>
</div>
<div className="card fade-up" style={{animationDelay:'320ms'}}><div className="between" style={{marginBottom:2}}><h3 style={{margin:0}}>Tarefas Próximas</h3><Link to="/planning/tasks" className="link-more">Todas<ArrowRight size={12}/></Link></div><small>Próximas datas limite</small>
<div style={{display:'grid',gap:8,marginTop:12}}>
{pendingTasks.length?pendingTasks.slice(0,5).map(t=>{const o=s.planning.objectives.find(x=>x.id===t.objectiveId);const late=isTaskOverdue(t);
return <div key={t.id} className={'next-row hov'+(late?' late':'')}>
<button className="ib" aria-label="Concluir tarefa" onClick={()=>{set(st=>({...st,planning:toggleTask(st.planning,t.id)}));toast('Tarefa concluída')}}><Circle size={20}/></button>
<Link to="/planning/tasks" className="next-txt"><b>{t.name}</b><small>{o?.name} · {t.due?new Date(t.due+'T00:00:00').toLocaleDateString('pt-BR'):'Sem prazo'}{late?' · atrasada':''}</small></Link>
<PriBadge p={t.priority}/>
</div>}):<Empty text="Nenhuma tarefa pendente."/>}
</div>
</div>
</div>

<div className="card fade-up" style={{animationDelay:'380ms'}}><h3>Atividade Recente</h3><small>O que aconteceu no planejamento</small>
{s.planning.activities.length?<div className="tl" style={{marginTop:12}}>{s.planning.activities.slice(0,6).map(a=>{const Ic=actIcon(a.type);return <div key={a.id} className="tl-item"><span className="tl-ico"><Ic size={13}/></span><div className="tl-body"><span className="tl-desc">{a.desc}</span><small className="tl-time" title={new Date(a.date).toLocaleString('pt-BR')}>{rel(a.date)}</small></div></div>})}</div>:<Empty text="Nenhuma atividade recente."/>}
</div>

{reagendar&&<Modal title="Reagendar tarefa" onClose={()=>setReagendar(null)}>
<div style={{display:'grid',gap:12}}>
<p style={{margin:0}}><b>{reagendar.name}</b><br/><small>Prazo atual: {reagendar.due?new Date(reagendar.due+'T00:00:00').toLocaleDateString('pt-BR'):'sem prazo'}</small></p>
<label style={{display:'grid',gap:4,fontSize:'.8rem',color:'var(--mut)'}}>Novo prazo<input type="date" value={newDue} onChange={e=>setNewDue(e.target.value)} autoFocus/></label>
<div className="row end" style={{margin:0}}><button className="btn ghost" onClick={()=>setReagendar(null)}>Cancelar</button><button className="btn" onClick={()=>{set(st=>({...st,planning:updateTask(st.planning,reagendar.id,{due:newDue||null})}));toast('Prazo atualizado');setReagendar(null)}}>Salvar</button></div>
</div>
</Modal>}
</>;
}

function AnimatedBar({v}:{v:number}){
const [w,setW]=useState(0);
useEffect(()=>{const r=requestAnimationFrame(()=>requestAnimationFrame(()=>setW(v)));return()=>cancelAnimationFrame(r)},[v]);
return <div className="bar big"><i style={{width:w+'%'}}/></div>;
}
function ProgressRow({v}:{v:number}){
const [w,setW]=useState(0);
useEffect(()=>{const r=requestAnimationFrame(()=>requestAnimationFrame(()=>setW(v)));return()=>cancelAnimationFrame(r)},[v]);
return <div className="bar" style={{marginTop:8}}><i style={{width:w+'%'}}/></div>;
}
