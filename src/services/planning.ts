import type {Objective,PlanningActivity,PlanningState,Subtask,Task,TaskStatus,ObjStatus} from '../types';
import {today} from '../utils';
import {uid} from '../store';

const nowIso=()=>new Date().toISOString();
const stamp=()=>today()+'T'+new Date().toTimeString().slice(0,8);
export const emptyPlanning=():PlanningState=>({objectives:[],tasks:[],customCategories:['Pessoal','Profissional','Financeiro','Estudos','Casa','Saúde e bem-estar','Outros'],activities:[]});

export const isTaskDone=(t:Task)=>t.subs.length?t.subs.every(s=>s.done):t.status==='concluida';
export const taskProgress=(t:Task)=>t.subs.length?Math.round(t.subs.filter(s=>s.done).length/t.subs.length*100):(t.status==='concluida'?100:0);
export const taskViewStatus=(t:Task):TaskStatus=>{if(t.subs.length){if(t.subs.every(s=>s.done))return 'concluida';if(t.subs.some(s=>s.done)||t.status==='em-andamento')return 'em-andamento';return 'pendente'}return t.status};
export const isTaskOverdue=(t:Task)=>!!t.due&&t.due<today()&&!isTaskDone(t);
export const tasksOf=(p:PlanningState,oid:string)=>p.tasks.filter(t=>t.objectiveId===oid);
export const objectiveProgress=(p:PlanningState,oid:string)=>{const ts=tasksOf(p,oid);return ts.length?Math.round(ts.filter(isTaskDone).length/ts.length*100):0};
export const objectiveCounts=(p:PlanningState,oid:string)=>{const ts=tasksOf(p,oid);return{total:ts.length,done:ts.filter(isTaskDone).length,pending:ts.length-ts.filter(isTaskDone).length}};

export const addActivity=(p:PlanningState,type:string,desc:string,objectiveId:string|null):PlanningState=>{
const a:PlanningActivity={id:uid(),type,desc,date:nowIso(),objectiveId};
return{...p,activities:[a,...p.activities].slice(0,200)};
};

const computedStatus=(ts:Task[]):ObjStatus=>{
if(!ts.length)return 'nao-iniciado';
if(ts.every(isTaskDone))return 'concluido';
const started=ts.some(t=>t.status==='em-andamento'||isTaskDone(t)||t.subs.some(s=>s.done));
return started?'em-andamento':'nao-iniciado';
};

/** Recalcula o status de UM objetivo (exceto arquivados) e registra atividades nas transições. */
export const recalcObjective=(p:PlanningState,oid:string):PlanningState=>{
const obj=p.objectives.find(o=>o.id===oid);if(!obj||obj.archived)return p;
const ts=tasksOf(p,oid);
const computed=computedStatus(ts);
if(ts.length===0){
  if(obj.status==='concluido'&&obj.completedAt)return p; // conclusão manual de objetivo vazio
  if(obj.status!=='nao-iniciado')return{...p,objectives:p.objectives.map(o=>o.id===oid?{...o,status:'nao-iniciado',completedAt:null}:o)};
  return p;
}
if(computed==='concluido'){
  if(obj.status!=='concluido'||!obj.completedAt){
    p={...p,objectives:p.objectives.map(o=>o.id===oid?{...o,status:'concluido',completedAt:o.completedAt??today()}:o)};
    p=addActivity(p,'objetivo-concluido',`Objetivo concluído: ${obj.name}`,oid);
  }
  return p;
}
if(obj.status==='concluido'){
  p={...p,objectives:p.objectives.map(o=>o.id===oid?{...o,status:computed,completedAt:null}:o)};
  p=addActivity(p,'objetivo-reaberto',`Objetivo reaberto: ${obj.name}`,oid);
  return p;
}
if(obj.status!==computed)return{...p,objectives:p.objectives.map(o=>o.id===oid?{...o,status:computed}:o)};
return p;
};

const recalcMany=(p:PlanningState,oids:string[])=>oids.reduce((acc,oid)=>recalcObjective(acc,oid),p);

/* ---------- Objetivos ---------- */
export const createObjective=(p:PlanningState,input:Omit<Objective,'id'|'status'|'completedAt'|'archived'|'favorite'|'createdAt'>&{createdAt?:string}):PlanningState=>{
const o:Objective={...input,id:uid(),status:'nao-iniciado',favorite:false,archived:false,completedAt:null,createdAt:input.createdAt??stamp()};
p={...p,objectives:[o,...p.objectives]};
return addActivity(p,'objetivo-criado',`Objetivo criado: ${o.name}`,o.id);
};
export const updateObjective=(p:PlanningState,id:string,patch:Partial<Objective>):PlanningState=>{
const before=p.objectives.find(o=>o.id===id);if(!before)return p;
p={...p,objectives:p.objectives.map(o=>o.id===id?{...o,...patch}:o)};
return addActivity(p,'objetivo-editado',`Objetivo editado: ${patch.name??before.name}`,id);
};
export const deleteObjective=(p:PlanningState,id:string):PlanningState=>({...p,
objectives:p.objectives.filter(o=>o.id!==id),
tasks:p.tasks.filter(t=>t.objectiveId!==id),
activities:p.activities.filter(a=>a.objectiveId!==id)});
export const archiveObjective=(p:PlanningState,id:string,archived:boolean):PlanningState=>{
const o=p.objectives.find(x=>x.id===id);if(!o)return p;
p={...p,objectives:p.objectives.map(x=>x.id===id?{...x,archived}:x)};
p=addActivity(p,archived?'objetivo-arquivado':'objetivo-restaurado',`Objetivo ${archived?'arquivado':'restaurado'}: ${o.name}`,id);
if(!archived)p=recalcObjective(p,id);
return p;
};
export const toggleFavorite=(p:PlanningState,id:string):PlanningState=>({...p,objectives:p.objectives.map(o=>o.id===id?{...o,favorite:!o.favorite}:o)});
/** Conclusão manual — apenas para objetivos sem tarefas (a confirmação é feita na UI). */
export const manualConclude=(p:PlanningState,id:string,done:boolean):PlanningState=>{
const o=p.objectives.find(x=>x.id===id);if(!o)return p;
p={...p,objectives:p.objectives.map(x=>x.id===id?{...x,status:done?'concluido':'nao-iniciado',completedAt:done?today():null}:x)};
return addActivity(p,done?'objetivo-concluido':'objetivo-reaberto',`Objetivo ${done?'concluído (manual)':'reaberto'}: ${o.name}`,id);
};

/* ---------- Tarefas ---------- */
export const createTask=(p:PlanningState,input:Omit<Task,'id'|'createdAt'>):PlanningState=>{
const t:Task={...input,id:uid(),createdAt:stamp()};
const wasCompleted=p.objectives.find(o=>o.id===t.objectiveId)?.status==='concluido';
p={...p,tasks:[t,...p.tasks]};
p=addActivity(p,'tarefa-criada',`Tarefa criada: ${t.name}`,t.objectiveId);
if(wasCompleted){
  p={...p,objectives:p.objectives.map(o=>o.id===t.objectiveId?{...o,status:'em-andamento',completedAt:null}:o)};
  p=addActivity(p,'objetivo-reaberto','Objetivo reaberto após nova tarefa',t.objectiveId);
}
return recalcObjective(p,t.objectiveId);
};
export const updateTask=(p:PlanningState,id:string,patch:Partial<Task>):PlanningState=>{
const t=p.tasks.find(x=>x.id===id);if(!t)return p;
const oldDone=isTaskDone(t);
p={...p,tasks:p.tasks.map(x=>{
  if(x.id!==id)return x;
  const merged={...x,...patch};
  if(merged.subs.length&&patch.status==='concluida')merged.status='concluida'; // recalculado abaixo se necessário
  return merged;
})};
const after=p.tasks.find(x=>x.id===id)!;
if(after.subs.length){
  const synced=after.subs.every(s=>s.done)?{...after,status:'concluida' as TaskStatus}:(after.status==='concluida'?{...after,status:'em-andamento' as TaskStatus}:after);
  p={...p,tasks:p.tasks.map(x=>x.id===id?synced:x)};
}
const newDone=isTaskDone(p.tasks.find(x=>x.id===id)!);
if(oldDone!==newDone)p=addActivity(p,newDone?'tarefa-concluida':'tarefa-reaberta',`Tarefa ${newDone?'concluída':'reaberta'}: ${after.name}`,after.objectiveId);
return recalcObjective(p,after.objectiveId);
};
export const deleteTask=(p:PlanningState,id:string):PlanningState=>{
const t=p.tasks.find(x=>x.id===id);if(!t)return p;
p={...p,tasks:p.tasks.filter(x=>x.id!==id)};
return recalcObjective(p,t.objectiveId);
};
export const toggleTask=(p:PlanningState,id:string):PlanningState=>{
const t=p.tasks.find(x=>x.id===id);if(!t)return p;
const oid=t.objectiveId;
const nowDone=isTaskDone(t);
if(t.subs.length){
  p={...p,tasks:p.tasks.map(x=>x.id===id?{...x,status:nowDone?'em-andamento':'concluida',subs:x.subs.map(s=>({...s,done:!nowDone}))}:x)};
}else{
  p={...p,tasks:p.tasks.map(x=>x.id===id?{...x,status:nowDone?'em-andamento':'concluida'}:x)};
}
p=addActivity(p,nowDone?'tarefa-reaberta':'tarefa-concluida',`Tarefa ${nowDone?'reaberta':'concluída'}: ${t.name}`,oid);
return recalcObjective(p,oid);
};

/* ---------- Subtarefas ---------- */
const syncTaskWithSubs=(p:PlanningState,taskId:string):PlanningState=>{
const t=p.tasks.find(x=>x.id===taskId);if(!t)return p;
const allDone=t.subs.length>0&&t.subs.every(s=>s.done);
const next:TaskStatus=allDone?'concluida':(t.status==='concluida'?'em-andamento':t.status);
if(next!==t.status)p={...p,tasks:p.tasks.map(x=>x.id===taskId?{...x,status:next}:x)};
return p;
};
export const addSubtask=(p:PlanningState,taskId:string,name:string):PlanningState=>{
const t=p.tasks.find(x=>x.id===taskId);if(!t)return p;
const wasDone=isTaskDone(t);
p={...p,tasks:p.tasks.map(x=>x.id===taskId?{...x,status:x.status==='concluida'?'em-andamento':x.status,subs:[...x.subs,{id:uid(),name,done:false}]}:x)};
if(wasDone)p=addActivity(p,'tarefa-reaberta',`Tarefa reaberta: ${t.name}`,t.objectiveId);
return recalcObjective(syncTaskWithSubs(p,taskId),t.objectiveId);
};
export const updateSubtask=(p:PlanningState,taskId:string,subId:string,patch:Partial<Subtask>):PlanningState=>{
const t=p.tasks.find(x=>x.id===taskId);if(!t)return p;
p={...p,tasks:p.tasks.map(x=>x.id===taskId?{...x,subs:x.subs.map(s=>s.id===subId?{...s,...patch}:s)}:x)};
return recalcObjective(syncTaskWithSubs(p,taskId),t.objectiveId);
};
export const toggleSubtask=(p:PlanningState,taskId:string,subId:string):PlanningState=>{
const t=p.tasks.find(x=>x.id===taskId);if(!t)return p;
const before=isTaskDone(t);const sub=t.subs.find(s=>s.id===subId);const willBe=!(sub?.done);
p={...p,tasks:p.tasks.map(x=>x.id===taskId?{...x,subs:x.subs.map(s=>s.id===subId?{...s,done:!s.done}:s)}:x)};
p=syncTaskWithSubs(p,taskId);
const after=p.tasks.find(x=>x.id===taskId)!;const afterDone=isTaskDone(after);
if(willBe)p=addActivity(p,'subtarefa-concluida',`Subtarefa concluída: ${sub?.name??''}`,t.objectiveId);
if(before!==afterDone)p=addActivity(p,afterDone?'tarefa-concluida':'tarefa-reaberta',`Tarefa ${afterDone?'concluída':'reaberta'}: ${after.name}`,t.objectiveId);
return recalcObjective(p,t.objectiveId);
};
export const deleteSubtask=(p:PlanningState,taskId:string,subId:string):PlanningState=>{
const t=p.tasks.find(x=>x.id===taskId);if(!t)return p;
const before=isTaskDone(t);
p={...p,tasks:p.tasks.map(x=>x.id===taskId?{...x,subs:x.subs.filter(s=>s.id!==subId)}:x)};
p=syncTaskWithSubs(p,taskId);
const after=p.tasks.find(x=>x.id===taskId)!;const afterDone=isTaskDone(after);
if(before!==afterDone)p=addActivity(p,afterDone?'tarefa-concluida':'tarefa-reaberta',`Tarefa ${afterDone?'concluída':'reaberta'}: ${after.name}`,t.objectiveId);
return recalcObjective(p,t.objectiveId);
};

/* ---------- Categorias e indicadores ---------- */
export const addCategory=(p:PlanningState,name:string):PlanningState=>name.trim()&&!p.customCategories.includes(name.trim())?{...p,customCategories:[...p.customCategories,name.trim()]}:p;
export const removeCategory=(p:PlanningState,name:string):PlanningState=>({...p,customCategories:p.customCategories.filter(c=>c!==name)});

export const planningStats=(p:PlanningState)=>{
const active=p.objectives.filter(o=>!o.archived);
const t=p.tasks;
const activeIds=new Set(active.map(o=>o.id));
const taskInActive=t.filter(x=>activeIds.has(x.objectiveId));
return{
objectives:active.length,
completed:active.filter(o=>o.status==='concluido').length,
inProgress:active.filter(o=>o.status==='em-andamento').length,
notStarted:active.filter(o=>o.status==='nao-iniciado').length,
tasksTotal:t.length,
tasksPending:t.filter(x=>!isTaskDone(x)).length,
tasksDone:t.filter(isTaskDone).length,
tasksLate:t.filter(isTaskOverdue).length,
tasksInActive:taskInActive.length};
};
