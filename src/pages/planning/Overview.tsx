import {Link} from 'react-router-dom';
import {Target,ListTodo,Clock,CheckCircle2,Plus,ArrowRight} from 'lucide-react';
import {useStore} from '../../store';
import {Stat,Empty} from '../../components/ui';
import {planningStats,isTaskDone,isTaskOverdue,objectiveProgress} from '../../services/planning';
import {ObjBadge,PriBadge} from './shared';

export default function Overview(){
const s=useStore();
const st=planningStats(s.planning);
const activeObjs=s.planning.objectives.filter(o=>!o.archived);
const pendingTasks=s.planning.tasks.filter(t=>!isTaskDone(t)).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
const lateTasks=pendingTasks.filter(isTaskOverdue);

return <><div className="between"><div><h1>Visão Geral do Planejamento</h1><p className="sub">Acompanhe seus objetivos e tarefas centrais</p></div><div className="row"><Link to="/planning/objectives" className="btn sm"><Plus size={14}/>Novo objetivo</Link><Link to="/planning/tasks" className="btn ghost sm"><Plus size={14}/>Nova tarefa</Link></div></div>
<div className="grid">
<Stat icon={<Target size={18}/>} label="Objetivos ativos" value={st.objectives}/>
<Stat icon={<CheckCircle2 size={18}/>} label="Objetivos concluídos" value={st.completed}/>
<Stat icon={<Clock size={18}/>} label="Objetivos em andamento" value={st.inProgress}/>
<Stat icon={<ListTodo size={18}/>} label="Tarefas pendentes" value={st.tasksPending}/>
<Stat icon={<CheckCircle2 size={18}/>} label="Tarefas concluídas" value={st.tasksDone}/>
{st.tasksLate>0?<Stat icon={<Clock size={18}/>} label="Tarefas atrasadas" value={st.tasksLate}/>:null}
</div>
<div className="two">
<div className="card"><h3>Meus Objetivos Principais</h3><small>Acompanhe o andamento geral</small>
{activeObjs.length?<div style={{marginTop:12}}>{activeObjs.slice(0,4).map(o=>{const pr=objectiveProgress(s.planning,o.id);return <div key={o.id} className="card between" style={{background:'var(--bg)'}}><div><b>{o.name}</b><br/><small>{o.category} · {pr}% concluído</small></div><Link to={`/planning/objectives?id=${o.id}`} className="ib"><ArrowRight size={16}/></Link></div>})}</div>:<Empty text="Nenhum objetivo cadastrado."/>}
</div>
<div className="card"><h3>Tarefas Próximas</h3><small>Próximas datas limite</small>
{pendingTasks.length?<div style={{marginTop:12}}>{pendingTasks.slice(0,4).map(t=>{const o=s.planning.objectives.find(x=>x.id===t.objectiveId);return <div key={t.id} className="card between" style={{background:'var(--bg)'}}><div><b>{t.name}</b><br/><small>{o?.name} · {t.due?new Date(t.due+'T00:00:00').toLocaleDateString('pt-BR'):'Sem prazo'}</small></div><PriBadge p={t.priority}/></div>})}</div>:<Empty text="Nenhuma tarefa pendente."/>}
</div>
</div>
{lateTasks.length>0&&<div className="card" style={{borderLeft:'3px solid #ef6b73'}}><h3>Tarefas Atrasadas</h3>{lateTasks.map(t=><div key={t.id} className="between mt"><span><b>{t.name}</b> <small>({t.due?new Date(t.due+'T00:00:00').toLocaleDateString('pt-BR'):''})</small></span><Link to="/planning/tasks" className="btn ghost sm">Ver</Link></div>)}</div>}
<div className="card"><h3>Atividade Recente</h3>{s.planning.activities.length?s.planning.activities.slice(0,5).map(a=><div key={a.id} className="between mt"><span><b>{a.desc}</b><br/><small>{new Date(a.date).toLocaleString('pt-BR')}</small></span></div>):<small>Nenhuma atividade recente.</small>}</div>
</>;
}
