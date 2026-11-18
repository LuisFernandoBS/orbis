import {useState} from 'react';
import {useSearchParams,useNavigate} from 'react-router-dom';
import {Plus,Search,Archive,Pencil,Trash2,Star,List,LayoutGrid,CheckCircle2,Undo2,Plus as PlusIcon} from 'lucide-react';
import {useStore,set,uid} from '../../store';
import {Modal,Stat,Progress,Empty,toast,fd} from '../../components/ui';
import {today,L} from '../../utils';
import type {Objective,Task,Priority,ObjStatus,PlanningState} from '../../types';
import {createObjective,updateObjective,deleteObjective,archiveObjective,toggleFavorite,addCategory,isTaskDone,objectiveProgress,manualConclude,createTask} from '../../services/planning';
import {ObjBadge,PriBadge,PL_CATS} from './shared';

export default function Objectives(){
const s=useStore();
const [params,setParams]=useSearchParams();
const currentId=params.get('id');
const [q,setQ]=useState('');
const [catF,setCatF]=useState('');
const [showArch,setShowArch]=useState(false);
const [m,setM]=useState<{id?:string}|null>(null);
const nav=useNavigate();

const objs=s.planning.objectives;
const cur=currentId?objs.find(o=>o.id===currentId):null;

const handleToggleConclude=(o:Objective)=>{
const tCount=s.planning.tasks.filter(t=>t.objectiveId===o.id).length;
if(tCount===0){
  if(confirm('Este objetivo não possui tarefas. Deseja marcá-lo como concluído?')){set(st=>({...st,planning:manualConclude(st.planning,o.id,o.status!=='concluido')}));toast('Status atualizado')}
}else{toast('Adicione ou remova tarefas para alterar a conclusão deste objetivo.')}
};

if(cur){
const tasks=s.planning.tasks.filter(t=>t.objectiveId===cur.id);
const prog=objectiveProgress(s.planning,cur.id);
return <><div className="phead"><div><small>Objetivo</small><h1>{cur.name}</h1></div><div className="row"><button className="btn ghost" onClick={()=>setParams({})}>← Voltar</button><button className="btn ghost" onClick={()=>setM({id:cur.id})}><Pencil size={16}/>Editar</button></div></div>
<div className="card"><div className="between"><span><PriBadge p={cur.priority}/> <ObjBadge o={cur}/></span><div className="row"><button className="ib" onClick={()=>set(st=>({...st,planning:toggleFavorite(st.planning,cur.id)}))}><Star size={18} fill={cur.favorite?'currentColor':'none'}/></button><button className="ib" onClick={()=>set(st=>({...st,planning:archiveObjective(st.planning,cur.id,!cur.archived)}))}><Archive size={18}/></button></div></div>
<p>{cur.desc||'Nenhuma descrição.'}</p>
<div className="row mt"><small>Criado em: {new Date(cur.createdAt).toLocaleDateString('pt-BR')}</small>{cur.dueDate&&<small>Prazo: {new Date(cur.dueDate+'T00:00:00').toLocaleDateString('pt-BR')}</small>}</div>
<Progress v={prog}/>
<div className="between mt"><span>{tasks.filter(isTaskDone).length} / {tasks.length} tarefas concluídas</span><span className="mpct">{prog}%</span></div>
{tasks.length===0&&<div className="mt"><button className="btn ghost sm" onClick={()=>handleToggleConclude(cur)}>{cur.status==='concluido'?'Reabrir objetivo':'Marcar objetivo como concluído'}</button></div>}
</div>
<div className="card"><div className="between"><h3>Tarefas vinculadas</h3><button className="btn sm" onClick={()=>setM({id:'new-task'})}><Plus size={14}/>Adicionar tarefa</button></div>
{tasks.map(t=><div key={t.id} className="between mt"><span className="row"><CheckCircle2 size={18} color={isTaskDone(t)?'var(--aqua)':'var(--mut)'}/>{t.name}</span><span className="badge">{t.status}</span></div>)}
<button className="btn ghost sm mt" onClick={()=>nav(`/planning/tasks?objective=${cur.id}`)}>Gerenciar tarefas →</button></div>
<div className="card"><h3>Atividade deste objetivo</h3>{s.planning.activities.filter(a=>a.objectiveId===cur.id).map(a=><div key={a.id} className="between mt"><span><b>{a.desc}</b><br/><small>{new Date(a.date).toLocaleString('pt-BR')}</small></span></div>)}</div>
{m&&<ObjectiveModal id={m.id==='new-task'?undefined:m?.id} isNewTask={m.id==='new-task'} activeObjectiveId={cur.id} onClose={()=>setM(null)}/>}
</>;
}

const filtered=objs.filter(o=>o.name.toLowerCase().includes(q.toLowerCase())&&(!catF||o.category===catF)&&(showArch||!o.archived));
return <><div className="phead"><div><h1>Meus Objetivos</h1><p className="sub">Gerencie seus objetivos pessoais e acompanhe o progresso</p></div><button className="btn" onClick={()=>setM({})}><Plus size={16}/>Novo objetivo</button></div>
<div className="row srch"><Search size={16}/><input placeholder="Buscar objetivos…" value={q} onChange={e=>setQ(e.target.value)}/><select value={catF} onChange={e=>setCatF(e.target.value)}><option value="">Todas as categorias</option>{[...PL_CATS,...s.planning.customCategories.filter(c=>!PL_CATS.includes(c))].map(c=><option key={c} value={c}>{c}</option>)}</select><label className="row"><input type="checkbox" checked={showArch} onChange={e=>setShowArch(e.target.checked)}/>Mostrar arquivados</label></div>
{filtered.length?<div className="grid">{filtered.map(o=>{const p=objectiveProgress(s.planning,o.id);return <div key={o.id} className="card"><div className="between"><b>{o.name}</b><span className="row"><Star size={16} fill={o.favorite?'currentColor':'none'} onClick={()=>set(st=>({...st,planning:toggleFavorite(st.planning,o.id)}))}/></span></div><small>{o.category}</small><div className="row"><PriBadge p={o.priority}/><ObjBadge o={o}/></div><Progress v={p}/><div className="between mt"><small>{s.planning.tasks.filter(t=>t.objectiveId===o.id&&isTaskDone(t)).length} / {s.planning.tasks.filter(t=>t.objectiveId===o.id).length} tarefas</small><button className="ib" onClick={()=>setParams({id:o.id})}><LayoutGrid size={16}/></button></div></div>})}</div>:<Empty text="Nenhum objetivo encontrado."/>}
{m&&<ObjectiveModal id={m.id==='new-task'?undefined:m?.id} isNewTask={m.id==='new-task'} activeObjectiveId={undefined} onClose={()=>setM(null)}/>}</>;
}

function ObjectiveModal({id,isNewTask,activeObjectiveId,onClose}:{id?:string;isNewTask?:boolean;activeObjectiveId?:string;onClose:()=>void}){
const s=useStore();
const obj=id?s.planning.objectives.find(o=>o.id===id):null;
const allCats=[...new Set([...PL_CATS,...s.planning.customCategories])];
if(isNewTask){
  return <Modal title="Nova Tarefa" onClose={onClose}>
  <form className="form" onSubmit={e=>{const f=fd(e);set(st=>({...st,planning:createTask(st.planning,{objectiveId:activeObjectiveId||s.planning.objectives[0]?.id,name:f.name,desc:'',priority:f.priority as Priority,due:f.due||null,status:'pendente',subs:[]})}));onClose();toast('Tarefa criada')}}>
  <label>Título<input name="name" required/></label>
  <label>Prioridade<select name="priority" defaultValue="media"><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></label>
  <label>Prazo<input name="due" type="date"/></label>
  <div className="row end"><button type="button" className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn">Criar</button></div>
  </form></Modal>;
}
return <Modal title={obj?'Editar Objetivo':'Novo objetivo'} onClose={onClose}><form className="form" onSubmit={e=>{const f=fd(e);const data={name:f.name,desc:f.desc,category:f.category,priority:f.priority as Priority,startDate:f.startDate||today(),dueDate:f.dueDate||null};if(obj){set(st=>({...st,planning:updateObjective(st.planning,obj.id,data)}))}else{set(st=>({...st,planning:createObjective(st.planning,data)}))};onClose();toast('Objetivo salvo')}}>
<label style={{gridColumn:'1/-1'}}>Nome<input name="name" required defaultValue={obj?.name}/></label>
<label style={{gridColumn:'1/-1'}}>Descrição<textarea name="desc" defaultValue={obj?.desc}/></label>
<label>Categoria<input name="category" list="cats" defaultValue={obj?.category??'Pessoal'}/><datalist id="cats">{allCats.map(c=><option key={c} value={c}/>)}</datalist></label>
<label>Prioridade<select name="priority" defaultValue={obj?.priority??'media'}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></label>
<label>Data de Início<input name="startDate" type="date" defaultValue={obj?.startDate??today()}/></label>
<label>Prazo<input name="dueDate" type="date" defaultValue={obj?.dueDate??''}/></label>
<div className="row end"><button type="button" className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn">Salvar</button></div>
</form></Modal>;
}
