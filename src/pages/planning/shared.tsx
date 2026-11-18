import {useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {CheckCircle2,Circle,Plus,X,ListTodo,CalendarDays,Target,ChevronDown,ChevronRight,Pencil,Trash2,Star} from 'lucide-react';
import {useStore,set} from '../../store';
import {Modal,Stat,Progress,Empty,toast,fd} from '../../components/ui';
import {brl,today,L} from '../../utils';
import type {Objective,Task,Priority,ObjStatus,PlanningState} from '../../types';
import {isTaskDone,isTaskOverdue,taskProgress,taskViewStatus,objectiveProgress,createTask} from '../../services/planning';

export const PL_CATS=['Pessoal','Profissional','Financeiro','Estudos','Casa','Saúde e bem-estar','Outros'];
export const ObjBadge=({o}:{o:Objective})=>{
const map:Record<string,string>={'nao-iniciado':'Não iniciado','em-andamento':'Em andamento',concluido:'Concluído',arquivado:'Arquivado'};
const cls:Record<string,string>={'nao-iniciado':'var(--mut)','em-andamento':'var(--amb)',concluido:'var(--aqua)',arquivado:'var(--mut)'};
return <span className="badge" style={{color:cls[o.status]}}>{map[o.status]}</span>;
};
export const PriBadge=({p}:{p:Priority})=><span className={'badge p-'+p}>{L[p]}</span>;

export const TaskItem=({t}:{t:Task})=>{
const s=useStore();
const obj=s.planning.objectives.find(o=>o.id===t.objectiveId);
const late=isTaskOverdue(t);
const done=isTaskDone(t);
return <div className="card item between" style={late?{borderLeft:'3px solid #ef6b73'}:undefined}>
<Link to={`/planning/objectives?id=${t.objectiveId}`} className="link between" style={{padding:0,color:'inherit',flex:1}}>
<span><b style={{textDecoration:done?'line-through':'none'}}>{t.name}</b><br/><small>{obj?.name??'Objetivo'} · {t.due?new Date(t.due+'T00:00:00').toLocaleDateString('pt-BR'):'Sem prazo'}</small></span>
<span className="row" style={{margin:0}}><PriBadge p={t.priority}/>{done?<CheckCircle2 size={18} color="var(--aqua)"/>:<Circle size={18} color="var(--mut)"/>}</span></Link>
</div>;
};
export const ObjectivesList=({objectives,showArchived=false,onEdit}:{objectives:Objective[];showArchived?:boolean;onEdit?:(o:Objective)=>void})=>{
const s=useStore();
const expand=useState<string|null>(null);
const open=showArchived?objectives:objectives.filter(o=>!o.archived);
if(!open.length)return <Empty text="Nenhum objetivo encontrado."/>;
return <div className="two">{open.map(o=>{const pr=objectiveProgress(s.planning,o.id);return <div key={o.id} className="card"><div className="between"><b>{o.name}</b>{onEdit&&<button className="ib" onClick={()=>onEdit(o)}><Pencil size={16}/></button>}</div><small>{o.category}</small><div className="row"><PriBadge p={o.priority}/><ObjBadge o={o}/></div><Progress v={pr}/><div className="between mt"><small>{s.planning.tasks.filter(t=>t.objectiveId===o.id&&isTaskDone(t)).length} / {s.planning.tasks.filter(t=>t.objectiveId===o.id).length} tarefas</small><Link to={`/planning/objectives?id=${o.id}`} style={{color:'var(--lav)',fontSize:'.8rem'}}>Detalhes →</Link></div></div>})}</div>;
};
