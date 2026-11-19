import {Link} from 'react-router-dom';
import {ShoppingCart,Wallet,Brain,Package,ArrowRight,Clock,ShoppingBag,Sofa,BedDouble,CookingPot,Bath,DoorOpen,AlertTriangle,CalendarDays,Map as MapIcon,Sparkles} from 'lucide-react';
import {LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,PieChart,Pie,Cell,ResponsiveContainer} from 'recharts';
import {useStore,usePrefs} from './../store';
import {brl,avg,progress,monthOcc,lastMonths} from '../utils';

const MES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const K:[string,string,string][]=[['fixa','Fixas','#8B5CF6'],['variavel','Variáveis','#3B82F6'],['eventual','Eventuais','#06B6D4']];
const ri:Record<string,any>={sala:Sofa,quarto:BedDouble,cozinha:CookingPot,banheiro:Bath};

export default function Dashboard(){
  const s=useStore();
  const p=usePrefs();
  const now=new Date(),ym=lastMonths(6),cur=ym[5],prev=ym[4];

  const pend=s.items.filter(i=>i.status!=='comprado');
  const bought=s.items.filter(i=>i.status==='comprado');
  const marketPend=s.market.shoppingItems.length;

  const tot=(m:string)=>monthOcc(s.expenses,m).reduce((a,x)=>a+x.e.value,0);
  const buy=(m:string)=>bought.filter(i=>i.purchase?.date.slice(0,7)===m).reduce((a,i)=>a+i.purchase!.price,0);

  const data=ym.map(m=>({m:MES[+m.slice(5)-1],Despesas:tot(m),Compras:buy(m)}));
  const delta=tot(prev)?Math.round((tot(cur)/tot(prev)-1)*100):null;

  const all6=ym.flatMap(m=>monthOcc(s.expenses,m));
  const kinds=K.map(([k,l,c])=>{
    const v=all6.filter(x=>x.e.kind===k).reduce((a,x)=>a+x.e.value,0);
    return {k,l,c,v};
  });

  const pr=s.subjects.map(progress),T=pr.reduce((a,x)=>a+x.t,0),D=pr.reduce((a,x)=>a+x.d,0);
  const knowledgePct=T?Math.round(D/T*100):0;

  const totalEstimated=pend.reduce((a,i)=>a+avg(i)*i.qty,0);
  const monthDespesas=tot(cur);
  const highPriorityPend=pend.filter(i=>i.priority==='alta');

  return <div style={{display:'grid',gap:20}}>
    {/* Cabeçalho */}
    <div className="between" style={{alignItems:'flex-start'}}>
      <div>
        <small style={{color:'var(--mut)'}}>Bem-vindo de volta, {p.name}</small>
        <h1 style={{fontSize:'1.8rem',marginTop:2}}>Dashboard</h1>
        <p className="sub" style={{margin:'2px 0 0 0'}}>Visão geral do seu sistema pessoal</p>
      </div>
      <div className="card" style={{margin:0,padding:'8px 14px',display:'flex',alignItems:'center',gap:8,background:'var(--card)'}}>
        <CalendarDays size={16} style={{color:'var(--lav)'}}/>
        <div style={{fontSize:'0.85rem'}}>
          <div style={{textTransform:'capitalize',fontWeight:600}}>{now.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</div>
          <div style={{color:'var(--mut)',fontSize:'0.75rem'}}>Semana {Math.ceil(now.getDate()/7)}</div>
        </div>
      </div>
    </div>

    {/* Indicadores Principais (4 cards) */}
    <div className="dash-stats">
      {/* 1. Itens Planejados */}
      <div className="card" style={{margin:0,padding:16}}>
        <div className="between" style={{marginBottom:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:'rgba(139,92,246,0.15)',color:'var(--pri)',display:'grid',placeItems:'center'}}>
            <ShoppingCart size={20}/>
          </div>
          <span className="badge" style={{background:'rgba(66,214,208,0.12)',color:'var(--aqua)',border:'none',fontWeight:600}}>
            ✓ {bought.length} comprados
          </span>
        </div>
        <b style={{fontSize:'1.8rem',display:'block',marginBottom:2}}>{pend.length}</b>
        <span style={{color:'var(--mut)',fontSize:'0.85rem'}}>Itens Planejados</span>
      </div>

      {/* 2. Despesas do mês */}
      <div className="card" style={{margin:0,padding:16}}>
        <div className="between" style={{marginBottom:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:'rgba(59,130,246,0.15)',color:'#3B82F6',display:'grid',placeItems:'center'}}>
            <Wallet size={20}/>
          </div>
          {delta!==null&&(
            <span className={'badge '+(delta>0?'down':'up')} style={{border:'none',fontWeight:600}}>
              {delta>0?'+':''}{delta}% vs. mês anterior
            </span>
          )}
        </div>
        <b style={{fontSize:'1.8rem',display:'block',marginBottom:2}}>{brl(monthDespesas)}</b>
        <span style={{color:'var(--mut)',fontSize:'0.85rem'}}>Despesas do mês</span>
      </div>

      {/* 3. Orçamento Estimado */}
      <div className="card" style={{margin:0,padding:16}}>
        <div className="between" style={{marginBottom:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:'rgba(240,184,110,0.15)',color:'var(--amb)',display:'grid',placeItems:'center'}}>
            <Package size={20}/>
          </div>
        </div>
        <b style={{fontSize:'1.8rem',display:'block',marginBottom:2}}>{brl(totalEstimated)}</b>
        <span style={{color:'var(--mut)',fontSize:'0.85rem'}}>Orçamento Estimado</span>
      </div>

      {/* 4. Conhecimento */}
      <div className="card" style={{margin:0,padding:16}}>
        <div className="between" style={{marginBottom:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:'rgba(66,214,208,0.15)',color:'var(--aqua)',display:'grid',placeItems:'center'}}>
            <Brain size={20}/>
          </div>
        </div>
        <b style={{fontSize:'1.8rem',display:'block',marginBottom:2}}>{knowledgePct}%</b>
        <span style={{color:'var(--mut)',fontSize:'0.85rem'}}>Conhecimento ({D}/{T} subtemas)</span>
      </div>
    </div>

    {/* Gráficos (2 colunas no desktop, 1 coluna no mobile) */}
    <div className="dash-charts">
      <div className="card" style={{margin:0,padding:20}}>
        <div className="between" style={{marginBottom:4}}>
          <div>
            <h3 style={{margin:0,fontSize:'1.1rem'}}>Evolução Financeira</h3>
            <p style={{margin:0,color:'var(--mut)',fontSize:'0.85rem'}}>Despesas vs. Compras nos últimos 6 meses</p>
          </div>
          <span className="badge" style={{color:'var(--mut)'}}>6 meses ▾</span>
        </div>
        <div style={{height:220,marginTop:10}}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#989AAF" opacity={0.15}/>
              <XAxis dataKey="m" stroke="#989AAF" fontSize={12}/>
              <YAxis stroke="#989AAF" fontSize={12} width={40}/>
              <Tooltip formatter={(v:number)=>brl(v)}/>
              <Line dataKey="Despesas" stroke="#8B5CF6" strokeWidth={2.5} dot={false}/>
              <Line dataKey="Compras" stroke="#42D6D0" strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{margin:0,padding:20}}>
        <div className="between" style={{marginBottom:4}}>
          <div>
            <h3 style={{margin:0,fontSize:'1.1rem'}}>Tipos de Despesa</h3>
            <p style={{margin:0,color:'var(--mut)',fontSize:'0.85rem'}}>Distribuição geral</p>
          </div>
        </div>
        <div style={{height:140,marginTop:4}}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={kinds} dataKey="v" innerRadius={42} outerRadius={62} paddingAngle={2}>
                {kinds.map(k=><Cell key={k.k} fill={k.c}/>)}
              </Pie>
              <Tooltip formatter={(v:number)=>brl(v)}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:'grid',gap:6,marginTop:8}}>
          {kinds.map(k=><div key={k.k} className="between" style={{fontSize:'0.85rem'}}>
            <span className="row" style={{margin:0,gap:6}}><i className="dot" style={{background:k.c,width:8,height:8,borderRadius:'50%',display:'inline-block'}}/>{k.l}</span>
            <b>{brl(k.v)}</b>
          </div>)}
        </div>
      </div>
    </div>

    {/* Ações Rápidas (4 colunas desktop, 2 colunas mobile) */}
    <div className="card" style={{margin:0,padding:16}}>
      <h3 style={{margin:'0 0 12px 0',fontSize:'1.05rem',display:'flex',alignItems:'center',gap:8}}>
        <Sparkles size={18} style={{color:'var(--amb)'}}/> Ações Rápidas
      </h3>
      <div className="dash-actions">
        {[
          ['/casa/compras',ShoppingCart,'Ver compras planejadas'],
          ['/casa/despesas/lista',Wallet,'Registrar despesa'],
          ['/conhecimento/mapa',MapIcon,'Mapa neural'],
          ['/conhecimento/trilha',Clock,'Trilha com IA']
        ].map(([to,I,l])=>{
          const Ic=I as any;
          return <Link key={to as string} to={to as string} className="card hov" style={{margin:0,padding:14,display:'flex',alignItems:'center',justifyContent:'space-between',textDecoration:'none',color:'inherit',background:'var(--bg)'}}>
            <div className="row" style={{margin:0,gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:'rgba(139,92,246,0.15)',color:'var(--pri)',display:'grid',placeItems:'center'}}>
                <Ic size={16}/>
              </div>
              <b style={{fontSize:'0.9rem'}}>{l as string}</b>
            </div>
            <ArrowRight size={16} style={{color:'var(--mut)'}}/>
          </Link>;
        })}
      </div>
    </div>

    {/* Grid Inferior (3 colunas desktop, 1 coluna mobile) */}
    <div className="dash-bottom">

      {/* 1. Minha casa */}
      <div className="card" style={{margin:0,padding:20,display:'flex',flexDirection:'column'}}>
        <div className="between" style={{marginBottom:14}}>
          <h3 style={{margin:0,fontSize:'1.1rem'}}>Minha casa</h3>
          <small style={{color:'var(--mut)'}}>{s.rooms.length} cômodos ›</small>
        </div>
        <div style={{display:'grid',gap:10,flex:1}}>
          {s.rooms.slice(0,3).map(r=>{
            const rItems=s.items.filter(i=>i.roomId===r.id);
            const rBought=rItems.filter(i=>i.status==='comprado').length;
            const rTotal=rItems.length;
            const rPct=rTotal>0?Math.round((rBought/rTotal)*100):0;
            const Icon=ri[r.id]??DoorOpen;
            return <div key={r.id} className="card" style={{margin:0,padding:12,background:'var(--bg)'}}>
              <div className="between" style={{marginBottom:6}}>
                <div className="row" style={{margin:0,gap:8}}>
                  <div style={{width:28,height:28,borderRadius:8,background:'rgba(139,92,246,0.15)',color:'var(--pri)',display:'grid',placeItems:'center'}}>
                    <Icon size={14}/>
                  </div>
                  <b>{r.name}</b>
                </div>
                <small style={{color:'var(--mut)'}}>{rTotal} itens · {rPct}%</small>
              </div>
              {rTotal>0&&(
                <div className="bar" style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${rPct}%`,height:'100%',background:'var(--aqua)'}}/>
                </div>
              )}
            </div>;
          })}
        </div>
        <Link to="/casa/compras" className="link-more" style={{marginTop:12}}>Ver todos os cômodos ›</Link>
      </div>

      {/* 2. Últimas compras */}
      <div className="card" style={{margin:0,padding:20,display:'flex',flexDirection:'column'}}>
        <div className="between" style={{marginBottom:14}}>
          <h3 style={{margin:0,fontSize:'1.1rem'}}>Últimas compras</h3>
          <Link to="/casa/compras" className="link-more">Ver histórico ›</Link>
        </div>
        <div style={{display:'grid',gap:10,flex:1}}>
          {bought.length?(
            bought.slice(0,3).map(i=>(
              <div key={i.id} className="between" style={{padding:'8px 10px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--bd)'}}>
                <div className="row" style={{margin:0,gap:10}}>
                  <div style={{width:28,height:28,borderRadius:8,background:'rgba(66,214,208,0.15)',color:'var(--aqua)',display:'grid',placeItems:'center'}}>
                    <ShoppingCart size={14}/>
                  </div>
                  <div>
                    <b>{i.name}</b>
                    <p style={{margin:0,color:'var(--mut)',fontSize:'0.72rem'}}>Comprado em {i.purchase?.date?new Date(i.purchase.date+'T00:00:00').toLocaleDateString('pt-BR'):'recentemente'}</p>
                  </div>
                </div>
                <b style={{color:'var(--aqua)',fontSize:'0.9rem'}}>{brl(i.purchase?.price??avg(i))}</b>
              </div>
            ))
          ):(
            <p style={{color:'var(--mut)',fontSize:'0.85rem',margin:0}}>Nenhuma compra registrada.</p>
          )}
        </div>
      </div>

      {/* 3. Precisa da sua atenção */}
      <div className="card" style={{margin:0,padding:20,display:'flex',flexDirection:'column'}}>
        <div className="between" style={{marginBottom:14}}>
          <div className="row" style={{margin:0,gap:8}}>
            <AlertTriangle size={16} style={{color:'var(--amb)'}}/>
            <h3 style={{margin:0,fontSize:'1.1rem'}}>Precisa da sua atenção</h3>
          </div>
          <span className="badge" style={{background:'rgba(240,184,110,0.15)',color:'var(--amb)',fontWeight:600}}>{highPriorityPend.length} pendentes</span>
        </div>
        <div style={{display:'grid',gap:10,flex:1}}>
          {highPriorityPend.length?(
            highPriorityPend.slice(0,3).map(i=>{
              const roomObj=s.rooms.find(r=>r.id===i.roomId);
              return <div key={i.id} className="between" style={{padding:'8px 10px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--bd)'}}>
                <div className="row" style={{margin:0,gap:8}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'var(--amb)'}}/>
                  <div>
                    <b>{i.name}</b>
                    <p style={{margin:0,color:'var(--mut)',fontSize:'0.72rem'}}>{roomObj?roomObj.name:'Geral'}</p>
                  </div>
                </div>
                <b style={{fontSize:'0.85rem'}}>{brl(avg(i))}</b>
              </div>;
            })
          ):(
            <p style={{color:'var(--mut)',fontSize:'0.85rem',margin:0}}>{'Nenhum item pendente de alta prioridade.'}</p>
          )}
        </div>
        <Link to="/casa/compras" className="link-more" style={{marginTop:12}}>Ver todas as prioridades ›</Link>
      </div>

    </div>

    {/* Lista de compras (Rodapé inferior) */}
    <div className="card" style={{margin:0,padding:20,background:'linear-gradient(135deg, #1B1D2D 0%, #252243 100%)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,border:'1px solid rgba(139,92,246,0.3)'}}>
      <div className="row" style={{margin:0,gap:14}}>
        <div style={{width:44,height:44,borderRadius:12,background:'rgba(139,92,246,0.2)',color:'var(--lav)',display:'grid',placeItems:'center'}}>
          <ShoppingBag size={24}/>
        </div>
        <div>
          <h3 style={{margin:0,fontSize:'1.15rem'}}>Lista de compras</h3>
          <p style={{margin:0,color:'var(--mut)',fontSize:'0.85rem'}}>Seus itens pendentes para comprar.</p>
        </div>
      </div>
      <div className="row" style={{margin:0,gap:16}}>
        <span className="badge" style={{background:'rgba(139,92,246,0.2)',color:'var(--lav)',border:'none',padding:'6px 12px',fontWeight:600}}>
          {marketPend} itens pendentes
        </span>
        <Link to="/casa/mercado" className="btn" style={{background:'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',textDecoration:'none'}}>
          Acessar lista <ArrowRight size={16} style={{marginLeft:4}}/>
        </Link>
      </div>
    </div>

  </div>;
}
