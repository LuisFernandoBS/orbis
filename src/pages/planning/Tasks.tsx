import {useEffect,useState} from 'react';
import {useSearchParams,useNavigate,Link} from 'react-router-dom';
import {Plus,Search,Pencil,Trash2,CheckCircle2,Circle,ChevronDown,ChevronRight,ArrowRight,List} from 'lucide-react';
import {useStore,set,uid} from '../../store';
import {Modal,Empty,toast,fd} from '../../components/ui';
import {today,L} from '../../utils';
import type {Task,Priority,TaskStatus,Subtask} from '../../types';
import {isTaskDone,isTaskOverdue,taskViewStatus,taskProgress,createTask,updateTask,deleteTask,toggleTask,toggleSubtask,addSubtask,deleteSubtask,addActivity} from '../../services/planning';
import {PriBadge,ObjBadge} from './shared';

type QuickFilter='todas'|'pendentes'|'em-andamento'|'concluidas'|'atrasadas';

export default function Tasks(){
const s=useStore();
const nav=useNavigate();
const [params,setParams]=useSearchParams();
const [q,setQ]=useState('');
const [filterObj,setFilterObj]=useState(params.get('objective')??'');
const [filterPri,setFilterPri]=useState('');
const [filterStatus,setFilterStatus]=useState('');
const [filterPeriod,setFilterPeriod]=useState('');
const [quick,setQuick]=useState<QuickFilter>('todas');
const [m,setM]=useState<{id?:string}|null>(null);
const [expanded,setExpanded]=useState<string[]>([]);

const objParam=params.get('objective')??'';
useEffect(()=>{setFilterObj(objParam)},[objParam]);

const PL=s.planning;
const activeObjs=PL.objectives.filter(o=>!o.archived);
const objOf=(t:Task)=>PL.objectives.find(o=>o.id===t.objectiveId);

const filtered=PL.tasks.filter(t=>{
const o=objOf(t);
if(!o||o.archived)return false;
if(filterObj&&t.objectiveId!==filterObj)return false;
if(q&&!t.name.toLowerCase().includes(q.toLowerCase()))return false;
if(filterPri&&t.priority!==filterPri)return false;
if(filterStatus&&taskViewStatus(t)!==filterStatus)return false;
if(filterPeriod){
  const t0=today();
  if(filterPeriod==='hoje'){if(t.due!==t0)return false}
  else if(filterPeriod==='semana'){const d=new Date(t0+'T00:00:00');const end=new Date(d);end.setDate(d.getDate()+7);if(!t.due||t.due>end.toISOString().slice(0,10))return false}
  else if(filterPeriod==='mes'){if(!t.due||t.due.slice(0,7)!==t0.slice(0,7))return false}
  else if(filterPeriod==='sem-prazo'){if(t.due)return false}
}
if(quick==='pendentes'&&taskViewStatus(t)!=='pendente')return false;
if(quick==='em-andamento'&&taskViewStatus(t)!=='em-andamento')return false;
if(quick==='concluidas'&&!isTaskDone(t))return false;
if(quick==='atrasadas'&&!isTaskOverdue(t))return false;
return true;
}).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));

const quickCounts:Record<QuickFilter,number>={
todas:PL.tasks.filter(t=>{const o=objOf(t);return o&&!o.archived}).length,
pendentes:PL.tasks.filter(t=>{const o=objOf(t);return o&&!o.archived&&taskViewStatus(t)==='pendente'}).length,
'em-andamento':PL.tasks.filter(t=>{const o=objOf(t);return o&&!o.archived&&taskViewStatus(t)==='em-andamento'}).length,
concluidas:PL.tasks.filter(t=>{const o=objOf(t);return o&&!o.archived&&isTaskDone(t)}).length,
atrasadas:PL.tasks.filter(t=>{const o=objOf(t);return o&&!o.archived&&isTaskOverdue(t)}).length};

const tog=(id:string)=>setExpanded(e=>e.includes(id)?e.filter(x=>x!==id):[...e,id]);
const tabs:[QuickFilter,string][]=[['todas','Todas'],['pendentes','Pendentes'],['em-andamento','Em andamento'],['concluidas','Concluídas'],['atrasadas','Atrasadas']];

return <><div className="phead"><div><h1>Todas as Tarefas</h1><p className="sub">Central de tarefas vinculadas aos seus objetivos</p></div><button className="btn" onClick={()=>setM({})}><Plus size={16}/>Nova tarefa</button></div>
<div className="tabs">{tabs.map(([k,l])=><button key={k} className={'tab'+(quick===k?' on':'')} onClick={()=>setQuick(k)}>{l} <small>({quickCounts[k]})</small></button>)}</div>
<div className="row srch"><Search size={16}/><input placeholder="Buscar tarefas…" value={q} onChange={e=>setQ(e.target.value)}/><select value={filterObj} onChange={e=>{setFilterObj(e.target.value);setParams(e.target.value?{objective:e.target.value}:{})}}><option value="">Todos os objetivos</option>{activeObjs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select><select value={filterPri} onChange={e=>setFilterPri(e.target.value)}><option value="">Todas prioridades</option><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select><select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="">Todos status</option><option value="pendente">Pendente</option><option value="em-andamento">Em andamento</option><option value="concluida">Concluída</option></select><select value={filterPeriod} onChange={e=>setFilterPeriod(e.target.value)}><option value="">Todos os períodos</option><option value="hoje">Hoje</option><option value="semana">Próximos 7 dias</option><option value="mes">Este mês</option><option value="sem-prazo">Sem prazo</option></select></div>
{!activeObjs.length&&<Empty text="Crie um objetivo primeiro — toda tarefa pertence a um objetivo."/>}
{filtered.length?<div style={{display:'grid',gap:10}}>{filtered.map(t=>{const o=objOf(t)!;const done=isTaskDone(t);const late=isTaskOverdue(t);const open=expanded.includes(t.id);const progress=taskProgress(t);const vs=taskViewStatus(t);
return <div key={t.id} className="card item" style={late?{borderLeft:'3px solid #ef6b73'}:undefined}>
<div className="between" style={{flexWrap:'nowrap',gap:8}}>
<button className="ib" aria-label={done?'Reabrir tarefa':'Concluir tarefa'} onClick={()=>set(st=>({...st,planning:toggleTask(st.planning,t.id)}))}>{done?<CheckCircle2 size={22} color="var(--aqua)"/>:<Circle size={22}/>}</button>
<button className="mhead" style={{minHeight:0,flex:1}} onClick={()=>tog(t.id)}>
<span className="mtxt"><b style={{textDecoration:done?'line-through':'none',opacity:done?.7:1}}>{t.name}</b>
<small><Link to={`/planning/objectives?id=${o.id}`} style={{color:'var(--lav)',textDecoration:'none'}} onClick={e=>e.stopPropagation()}>{o.name}</Link> · {t.due?new Date(t.due+'T00:00:00').toLocaleDateString('pt-BR'):'Sem prazo'}{late?' · atrasada':''}{t.subs.length?` · ${t.subs.filter(s=>s.done).length}/${t.subs.length} subtarefas`:''}</small></span>
<span className="row" style={{margin:0}}><PriBadge p={t.priority}/><span className="badge">{vs==='em-andamento'?'Em andamento':vs==='concluida'?'Concluída':'Pendente'}</span>{t.subs.length?(open?<ChevronDown size={16}/>:<ChevronRight size={16}/>):null}</span>
</button>
<button className="ib" aria-label="Editar" onClick={()=>setM({id:t.id})}><Pencil size={16}/></button>
<button className="ib" aria-label="Excluir" onClick={()=>confirm('Excluir tarefa e suas subtarefas?')&&(set(st=>({...st,planning:deleteTask(st.planning,t.id)})),toast('Tarefa excluída'))}><Trash2 size={16}/></button>
</div>
{t.subs.length?<div className="bar" style={{marginTop:8}}><i style={{width:progress+'%'}}/></div>:null}
{open&&<div className="tree">{t.subs.map(sb=><div key={sb.id} className="between"><label className="row"><input type="checkbox" checked={sb.done} onChange={()=>set(st=>({...st,planning:toggleSubtask(st.planning,t.id,sb.id)}))}/><span style={{textDecoration:sb.done?'line-through':'none',opacity:sb.done?.6:1}}>{sb.name}</span></label><button className="ib" aria-label="Remover subtarefa" onClick={()=>set(st=>({...st,planning:deleteSubtask(st.planning,t.id,sb.id)}))}><Trash2 size={14}/></button></div>)}
<AddSubtask taskId={t.id}/></div>}
</div>})}</div>:(activeObjs.length?<Empty text="Nenhuma tarefa com esse filtro."/>:null)}
{m&&<TaskModal id={m.id} onClose={()=>setM(null)}/>}</>;
}

function AddSubtask({taskId}:{taskId:string}){
const [v,setV]=useState('');
return <form className="row" style={{margin:'6px 0 0'}} onSubmit={e=>{e.preventDefault();const n=v.trim();if(n){set(st=>({...st,planning:addSubtask(st.planning,taskId,n)}));setV('')}}}><input placeholder="Nova subtarefa…" value={v} onChange={e=>setV(e.target.value)}/><button className="btn sm">Adicionar</button></form>;
}

function TaskModal({id,onClose}:{id?:string;onClose:()=>void}){
const s=useStore();
const t=id?s.planning.tasks.find(x=>x.id===id):null;
const activeObjs=s.planning.objectives.filter(o=>!o.archived);
return <Modal title={t?'Editar tarefa':'Nova tarefa'} onClose={onClose}><form className="form" onSubmit={e=>{const f=fd(e);const data={objectiveId:f.objectiveId,name:f.name,desc:f.desc,priority:f.priority as Priority,due:f.due||null,status:f.status as TaskStatus};
if(t){set(st=>({...st,planning:updateTask(st.planning,t.id,{...data,status:t.subs.length?t.status:data.status})}))}
else{set(st=>({...st,planning:createTask(st.planning,{...data,subs:[]})}))}
onClose();toast('Tarefa salva')}}>
<label style={{gridColumn:'1/-1'}}>Objetivo relacionado *<select name="objectiveId" required defaultValue={t?.objectiveId??activeObjs[0]?.id??''}>{activeObjs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
<label style={{gridColumn:'1/-1'}}>Título *<input name="name" required defaultValue={t?.name}/></label>
<label style={{gridColumn:'1/-1'}}>Descrição<textarea name="desc" defaultValue={t?.desc}/></label>
<label>Prioridade<select name="priority" defaultValue={t?.priority??'media'}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></label>
<label>Prazo<input name="due" type="date" defaultValue={t?.due??''}/></label>
<label>Status<select name="status" defaultValue={t?.status??'pendente'}><option value="pendente">Pendente</option><option value="em-andamento">Em andamento</option><option value="concluida">Concluída</option></select></label>
<div className="row end"><button type="button" className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn">Salvar</button></div></form></Modal>;
}
