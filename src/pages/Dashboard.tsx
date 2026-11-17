import {ShoppingCart,Wallet,Brain,CheckCircle2} from 'lucide-react';import {AreaChart,Area,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {useStore} from '../store';import {Stat,Progress} from '../components/ui';import {avg,brl,progress,monthOcc,lastMonths} from '../utils';
export default function Dashboard(){const s=useStore();const pend=s.items.filter(i=>i.status!=='comprado'),bought=s.items.filter(i=>i.status==='comprado');
const budget=pend.reduce((a,i)=>a+avg(i)*i.qty,0),spent=bought.reduce((a,i)=>a+(i.purchase?.price??0),0);
const data=lastMonths(6).map(m=>({m:m.slice(5),total:monthOcc(s.expenses,m).reduce((a,x)=>a+x.e.value,0)}));
const cur=data[data.length-1].total,pr=s.subjects.map(progress),goalsDone=s.subjects.flatMap(x=>x.goals).filter(g=>g.done||(g.subs.length>0&&g.subs.every(x=>x.done))).length;
const T=pr.reduce((a,p)=>a+p.t,0),gen=T?Math.round(pr.reduce((a,p)=>a+p.d,0)/T*100):0;
return <><h1>Dashboard</h1><p className="sub">Visão geral do seu sistema pessoal</p>
<div className="grid"><Stat icon={<ShoppingCart size={18}/>} label="Itens planejados" value={pend.length} hint={`${bought.length} comprados`}/><Stat icon={<CheckCircle2 size={18}/>} label="Orçamento estimado" value={brl(budget)} hint={`Gasto: ${brl(spent)}`}/><Stat icon={<Wallet size={18}/>} label="Despesas do mês" value={brl(cur)}/><Stat icon={<Brain size={18}/>} label="Conhecimento" value={gen+'%'} hint={`${s.subjects.length} assuntos · ${goalsDone} metas concluídas`}/></div>
<div className="card"><h3>Despesas nos últimos 6 meses</h3><div style={{height:220}}><ResponsiveContainer><AreaChart data={data}><XAxis dataKey="m" stroke="#989AAF" fontSize={12}/><YAxis stroke="#989AAF" fontSize={12} width={48}/><Tooltip formatter={(v:number)=>brl(v)}/><Area dataKey="total" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={.2}/></AreaChart></ResponsiveContainer></div></div>
<div className="card"><h3>Progresso dos estudos</h3>{s.subjects.map((x,i)=><div key={x.id} className="mt"><div className="between"><span>{x.name}</span><b>{pr[i].pct}%</b></div><Progress v={pr[i].pct}/></div>)}</div></>}
