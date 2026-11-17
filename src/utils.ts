import type {Expense,Item,Subject} from './types';
export const nodes=(ss:Subject[])=>{const m=new Map<string,{label:string;sid:string}>();ss.forEach(s=>{m.set(s.id,{label:s.name,sid:s.id});s.goals.forEach(g=>{m.set(g.id,{label:s.name+' → '+g.name,sid:s.id});g.subs.forEach(y=>m.set(y.id,{label:s.name+' → '+g.name+' → '+y.name,sid:s.id}))})});return m};
export const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const today=()=>new Date().toISOString().slice(0,10);
export const avg=(i:Item)=>{const s=i.offers.filter(o=>o.selected);return s.length?s.reduce((a,o)=>a+o.price,0)/s.length:0};
/** Progresso: unidades folha concluídas / total. Meta com subtemas conta pelos subtemas; meta sem subtemas conta como 1 unidade. */
export const progress=(s:Subject)=>{let t=0,d=0;s.goals.forEach(g=>{if(g.subs.length){t+=g.subs.length;d+=g.subs.filter(x=>x.done).length}else{t++;if(g.done)d++}});return{t,d,pct:t?Math.round(d/t*100):0}};
/** Gera ocorrências de uma despesa (recorrente ou não) em [from,to], sem duplicar. */
export const occ=(e:Expense,from:string,to:string)=>{if(e.rec==='none')return e.date>=from&&e.date<=to?[e.date]:[];
const r:string[]=[],b=new Date(e.date+'T00:00:00Z');for(let n=0;n<2000;n++){const d=new Date(b);
if(e.rec==='weekly')d.setUTCDate(b.getUTCDate()+7*n);else if(e.rec==='biweekly')d.setUTCDate(b.getUTCDate()+14*n);else if(e.rec==='monthly')d.setUTCMonth(b.getUTCMonth()+n);else d.setUTCFullYear(b.getUTCFullYear()+n);
const s=d.toISOString().slice(0,10);if(s>to)break;if(s>=from)r.push(s)}return r};
export const monthOcc=(es:Expense[],ym:string)=>es.flatMap(e=>occ(e,ym+'-01',ym+'-31').map(date=>({e,date}))).sort((a,b)=>b.date.localeCompare(a.date));
export const lastMonths=(n:number)=>Array.from({length:n},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(n-1-i));return d.toISOString().slice(0,7)});
