import {useState,useEffect} from 'react';import {useParams,useNavigate} from 'react-router-dom';import {Plus,Trash2,Search,ShoppingCart,CheckCircle2,Star,Wallet,Heart,Clock,AlertTriangle,ArrowRight,ShoppingBag,Sofa,BedDouble,CookingPot,Bath,DoorOpen,ChevronRight,Home} from 'lucide-react';
import {useStore,set,uid} from '../store';import {Modal,Stat,Empty,fd,toast,Money} from '../components/ui';import {brl,avg,today,L} from '../utils';import type {Item,Priority} from '../types';

const ri:Record<string,any>={sala:Sofa,quarto:BedDouble,cozinha:CookingPot,banheiro:Bath};

export default function Compras(){
  const s=useStore();
  const {room}=useParams();
  const nav=useNavigate();
  const tab=room??'geral';
  const setTab=(k:string)=>nav(k==='geral'?'/casa/compras':'/casa/compras/'+k);
  const [q,setQ]=useState('');
  const [m,setM]=useState<{id?:string}|null>(null);

  const pend=s.items.filter(i=>i.status!=='comprado');
  const bought=s.items.filter(i=>i.status==='comprado');
  const shown=(tab==='hist'?bought:tab==='desejos'?s.items.filter(i=>!i.roomId&&i.status!=='comprado'):s.items.filter(i=>i.roomId===tab)).filter(i=>i.name.toLowerCase().includes(q.toLowerCase()));

  const totalEstimated=pend.reduce((a,i)=>a+avg(i)*i.qty,0);
  const totalSpent=bought.reduce((a,i)=>a+(i.purchase?.price??0),0);
  const budgetPct=totalEstimated>0?Math.min(100,(totalSpent/totalEstimated)*100):0;
  const highPriorityPend=pend.filter(i=>i.priority==='alta');

  const delItem=(i:Item)=>{
    if(confirm(`Excluir "${i.name}"?`)){
      set(st=>({...st,items:st.items.filter(x=>x.id!==i.id)}));
      toast('Item excluído');
    }
  };

  return <>
    {tab==='geral'?(
      <>
        {/* Cabeçalho */}
        <div className="phead" style={{marginBottom:20}}>
          <div>
            <h1>Compras</h1>
            <p className="sub">Planeje, compare ofertas e registre suas compras.</p>
          </div>
          <div className="row" style={{margin:0,gap:10}}>
            <button className="btn" onClick={()=>setM({})}><Plus size={16}/>Novo item</button>
            <button className="btn ghost" onClick={()=>{
              const n=prompt('Nome do novo cômodo');
              if(n?.trim()) set(st=>({...st,rooms:[...st.rooms,{id:uid(),name:n.trim()}]}));
            }}><Plus size={16}/>Novo cômodo</button>
          </div>
        </div>

        {/* Indicadores principais (4 cards) */}
        <div className="grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))',marginBottom:20}}>
          <Stat icon={<ShoppingCart size={18}/>} label="Itens planejados" value={pend.length}/>
          <Stat icon={<CheckCircle2 size={18}/>} label="Comprados" value={bought.length}/>
          <Stat icon={<Wallet size={18}/>} label="Orçamento estimado" value={brl(totalEstimated)}/>
          <Stat icon={<Star size={18}/>} label="Gasto atual" value={brl(totalSpent)}/>
        </div>

        {/* Área principal — duas colunas */}
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:20,alignItems:'start'}}>

          {/* Coluna Esquerda */}
          <div style={{display:'grid',gap:20}}>

            {/* 1. Orçamento da casa */}
            <div className="card" style={{padding:20}}>
              <div className="between" style={{marginBottom:12}}>
                <div>
                  <h3 style={{margin:0,fontSize:'1.1rem'}}>Orçamento da casa</h3>
                  <p style={{margin:0,color:'var(--mut)',fontSize:'0.85rem'}}>Gasto em relação ao estimado</p>
                </div>
                <span style={{fontSize:'1.5rem',fontWeight:700,color:'var(--aqua)'}}>{budgetPct.toFixed(1).replace('.',',')}%</span>
              </div>
              <div className="bar" style={{height:8,background:'rgba(255,255,255,0.08)',borderRadius:4,overflow:'hidden',marginBottom:10}}>
                <div style={{width:`${Math.min(100,budgetPct)}%`,height:'100%',background:'linear-gradient(90deg, var(--pri), var(--aqua))',borderRadius:4,transition:'width .3s ease'}}/>
              </div>
              <div className="between" style={{fontSize:'0.85rem',color:'var(--mut)'}}>
                <span>{brl(totalSpent)} gastos</span>
                <span>Est. {brl(totalEstimated)}</span>
              </div>
            </div>

            {/* 2. Minha casa */}
            <div className="card" style={{padding:20}}>
              <div className="between" style={{marginBottom:14}}>
                <h3 style={{margin:0,fontSize:'1.1rem',display:'flex',alignItems:'center',gap:8}}>
                  <Home size={18} style={{color:'var(--pri)'}}/> Minha casa
                </h3>
                <small style={{color:'var(--mut)'}}>{s.rooms.length} cômodos</small>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}>
                {s.rooms.map(r=>{
                  const rItems=s.items.filter(i=>i.roomId===r.id);
                  const rBought=rItems.filter(i=>i.status==='comprado').length;
                  const rTotal=rItems.length;
                  const rPct=rTotal>0?Math.round((rBought/rTotal)*100):0;
                  const Icon=ri[r.id]??DoorOpen;
                  return <div key={r.id} className="card hov" style={{margin:0,padding:14,cursor:'pointer'}} onClick={()=>setTab(r.id)}>
                    <div className="between" style={{marginBottom:10}}>
                      <div className="row" style={{margin:0,gap:10}}>
                        <div style={{width:36,height:36,borderRadius:10,background:'rgba(139,92,246,0.15)',color:'var(--pri)',display:'grid',placeItems:'center'}}>
                          <Icon size={18}/>
                        </div>
                        <div>
                          <b style={{fontSize:'0.95rem'}}>{r.name}</b>
                          <p style={{margin:0,color:'var(--mut)',fontSize:'0.75rem'}}>{rTotal} {rTotal===1?'item':'itens'} · {rTotal===0?'Vazio':rPct+'%'}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{color:'var(--mut)'}}/>
                    </div>
                    {rTotal>0&&(
                      <div className="bar" style={{height:4,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{width:`${rPct}%`,height:'100%',background:'var(--aqua)',borderRadius:2}}/>
                      </div>
                    )}
                  </div>;
                })}
              </div>
            </div>

            {/* 3. Últimas compras */}
            <div className="card" style={{padding:20}}>
              <div className="between" style={{marginBottom:14}}>
                <h3 style={{margin:0,fontSize:'1.1rem',display:'flex',alignItems:'center',gap:8}}>
                  <Clock size={18} style={{color:'var(--lav)'}}/> Últimas compras
                </h3>
                <button className="btn ghost sm" onClick={()=>setTab('hist')} style={{color:'var(--lav)',border:'none',padding:'4px 8px'}}>
                  Ver histórico <ArrowRight size={14} style={{marginLeft:4}}/>
                </button>
              </div>
              {bought.length?(
                <div style={{display:'grid',gap:10}}>
                  {bought.slice(0,3).map(i=>{
                    const roomObj=s.rooms.find(r=>r.id===i.roomId);
                    return <div key={i.id} className="between" style={{padding:'8px 0',borderBottom:'1px solid var(--bd)'}}>
                      <div>
                        <b>{i.name}</b>
                        <p style={{margin:0,color:'var(--mut)',fontSize:'0.75rem'}}>
                          {roomObj?roomObj.name+' · ':''}Comprado em {i.purchase?.date?new Date(i.purchase.date+'T00:00:00').toLocaleDateString('pt-BR'):'recentemente'}
                        </p>
                      </div>
                      <b style={{color:'var(--aqua)'}}>{brl(i.purchase?.price??avg(i))}</b>
                    </div>;
                  })}
                </div>
              ):(
                <p style={{color:'var(--mut)',fontSize:'0.9rem',margin:0}}>Nenhuma compra registrada ainda.</p>
              )}
            </div>

          </div>

          {/* Coluna Direita */}
          <div style={{display:'grid',gap:20}}>

            {/* 1. Precisa da sua atenção */}
            <div className="card" style={{padding:20}}>
              <div className="between" style={{marginBottom:14}}>
                <div className="row" style={{margin:0,gap:8}}>
                  <AlertTriangle size={18} style={{color:'var(--amb)'}}/>
                  <h3 style={{margin:0,fontSize:'1.1rem'}}>Precisa da sua atenção</h3>
                </div>
                <span className="badge" style={{background:'rgba(240,184,110,0.15)',color:'var(--amb)',fontWeight:600}}>{highPriorityPend.length} pendentes</span>
              </div>
              <p style={{color:'var(--mut)',fontSize:'0.85rem',margin:'0 0 14px 0'}}>Itens de alta prioridade ainda não comprados.</p>

              {highPriorityPend.length?(
                <div style={{display:'grid',gap:10,marginBottom:14}}>
                  {highPriorityPend.slice(0,3).map(i=>{
                    const roomObj=s.rooms.find(r=>r.id===i.roomId);
                    return <div key={i.id} className="between" style={{padding:'10px 12px',background:'rgba(255,255,255,0.02)',borderRadius:10,border:'1px solid var(--bd)'}}>
                      <div className="row" style={{margin:0,gap:10}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:'var(--amb)'}}/>
                        <div>
                          <b>{i.name}</b>
                          <p style={{margin:0,color:'var(--mut)',fontSize:'0.75rem'}}>{roomObj?roomObj.name:'Geral'}</p>
                        </div>
                      </div>
                      <b style={{fontSize:'0.9rem'}}>{brl(avg(i))}</b>
                    </div>;
                  })}
                </div>
              ):(
                <p style={{color:'var(--mut)',fontSize:'0.9rem',margin:'0 0 14px 0'}}>Nenhum item pendente de alta prioridade.</p>
              )}

              <button className="btn ghost" onClick={()=>setTab('desejos')} style={{width:'100%',justifyContent:'center',gap:6}}>
                Ver todas as prioridades <ArrowRight size={14}/>
              </button>
            </div>

            {/* 2. Lista de compras (Submódulo Mercado / Resumo) */}
            <div className="card" style={{padding:24,background:'linear-gradient(135deg, #1B1D2D 0%, #252243 100%)',position:'relative',overflow:'hidden',border:'1px solid rgba(139,92,246,0.3)'}}>
              <div style={{position:'absolute',top:-20,right:-20,width:120,height:120,background:'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>
              <div className="row" style={{margin:'0 0 12px 0',gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(139,92,246,0.2)',color:'var(--lav)',display:'grid',placeItems:'center'}}>
                  <ShoppingBag size={22}/>
                </div>
                <div>
                  <h3 style={{margin:0,fontSize:'1.15rem'}}>Lista de compras</h3>
                  <p style={{margin:0,color:'var(--mut)',fontSize:'0.85rem'}}>Seus itens pendentes para o supermercado.</p>
                </div>
              </div>
              <p style={{color:'var(--tx)',fontSize:'0.9rem',margin:'0 0 16px 0',opacity:0.9}}>
                Não se esqueça de conferir sua lista de compras e manter o estoque em dia.
              </p>
              <button className="btn" onClick={()=>nav('/casa/mercado')} style={{width:'100%',justifyContent:'center',gap:8,background:'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'}}>
                Ver lista completa <ArrowRight size={16}/>
              </button>
            </div>

          </div>

        </div>
      </>
    ):(
      <>
        <div className="phead">
          <div>
            <h1>{tab==='desejos'?'Lista de Desejos':tab==='hist'?'Histórico':s.rooms.find(r=>r.id===tab)?.name??'Compras'}</h1>
            <p className="sub">Planeje, compare ofertas e registre compras</p>
          </div>
          {tab!=='hist'&&<button className="btn" onClick={()=>setM({})}><Plus size={16}/>Novo item</button>}
        </div>

        {tab!=='hist'&&<div className="row srch"><Search size={16}/><input placeholder="Buscar itens…" value={q} onChange={e=>setQ(e.target.value)}/>{tab!=='desejos'&&<button className="btn ghost sm" onClick={()=>{if(confirm('Excluir cômodo? Os itens vão para a lista de desejos.')){set(st=>({...st,rooms:st.rooms.filter(r=>r.id!==tab),items:st.items.map(i=>i.roomId===tab?{...i,roomId:null}:i)}));setTab('geral')}}}>Excluir cômodo</button>}</div>}

        {shown.length?(
          <div className="grid">{shown.map(i=><div key={i.id} className="card item tl" role="button" tabIndex={0} onClick={()=>setM({id:i.id})} onKeyDown={e=>e.key==='Enter'&&setM({id:i.id})}><div className="between" style={{flexWrap:'nowrap'}}><div><span className={'badge p-'+i.priority}>{L[i.priority]}</span><span className="badge">{L[i.status]}</span></div><button className="ib" aria-label="Excluir item" onClick={e=>{e.stopPropagation();delItem(i)}}><Trash2 size={16}/></button></div><b>{i.name}</b><small>{i.desc}</small>{i.purchase?<b className="price">{brl(i.purchase.price)} · {i.purchase.store}</b>:avg(i)>0&&<b className="price">{brl(avg(i))}</b>}</div>)}</div>
        ):(
          <Empty text="Nada por aqui ainda."/>
        )}
      </>
    )}

    {m&&<ItemModal id={m.id} roomId={['desejos','hist','geral'].includes(tab)?null:tab} onClose={()=>setM(null)}/>}
  </>;
}

function ItemModal({id,roomId,onClose}:{id?:string;roomId:string|null;onClose:()=>void}){
  const s=useStore();
  const it=s.items.find(i=>i.id===id);
  const [buy,setBuy]=useState(false);
  const [ok,setOk]=useState(0);
  useEffect(()=>{if(buy)setTimeout(()=>document.getElementById('buyform')?.scrollIntoView({behavior:'smooth',block:'center'}),50)},[buy]);
  const upd=(fn:(i:Item)=>Item)=>set(st=>({...st,items:st.items.map(x=>x.id===id?fn(x):x)}));
  const sel=it?.offers.filter(o=>o.selected)??[],prices=sel.map(o=>o.price);
  const del=()=>{if(it&&confirm('Excluir item?')){set(st=>({...st,items:st.items.filter(x=>x.id!==it.id)}));toast('Item excluído');onClose()}};
  const footer=it?<><button type="button" className="btn dsolid icon" aria-label="Excluir item" onClick={del}><Trash2 size={18}/></button>{it.status!=='comprado'&&!buy&&<button type="button" className="btn ghost" onClick={()=>setBuy(true)}>Registrar compra</button>}<button form="itemform" className="btn">Salvar</button></>:<><button type="button" className="btn ghost" onClick={onClose}>Cancelar</button><button form="itemform" className="btn">Salvar</button></>;
  return <Modal full title={it?it.name:'Novo item'} onClose={onClose} footer={footer}>
  <form id="itemform" className="form" onSubmit={e=>{const f=fd(e);const b={name:f.name,desc:f.desc,qty:+f.qty||1,priority:f.priority as Priority,roomId:f.room||null};const st0=(f.status||'desejado') as 'desejado'|'pesquisando';
  set(st=>({...st,items:it?st.items.map(x=>x.id===it.id?{...x,...b,status:x.status==='comprado'?'comprado':st0}:x):[...st.items,{id:uid(),...b,status:st0,offers:[]}]}));onClose()}}>
  <label>Nome<input name="name" required defaultValue={it?.name}/></label><label>Descrição<input name="desc" defaultValue={it?.desc}/></label>
  <label>Quantidade<input name="qty" type="number" min="1" defaultValue={it?.qty??1}/></label>
  <label>Prioridade<select name="priority" defaultValue={it?.priority??'media'}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></label>
  {it?.status!=='comprado'&&<label>Status<select name="status" defaultValue={it?.status??'desejado'}><option value="desejado">Desejado</option><option value="pesquisando">Pesquisando</option></select></label>}
  <label>Cômodo<select name="room" defaultValue={it?.roomId??roomId??''}><option value="">Sem cômodo (desejos)</option>{s.rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
  </form>
  {it&&<><h4>Ofertas</h4>{it.offers.map(o=><div key={o.id} className="card between"><label className="row"><input type="checkbox" checked={o.selected} onChange={()=>upd(x=>({...x,offers:x.offers.map(y=>y.id===o.id?{...y,selected:!y.selected}:y)}))}/><span><b>{o.name}</b><br/><small>{o.features} · {o.store} · {o.used?'usado':'novo'}</small></span></label><span className="row"><b className="price">{brl(o.price)}</b><button className="ib" aria-label="Remover oferta" onClick={()=>upd(x=>({...x,offers:x.offers.filter(y=>y.id!==o.id)}))}><Trash2 size={16}/></button></span></div>)}
  {sel.length>0&&<div className="card">Média (selecionadas): <b>{brl(prices.reduce((a,b)=>a+b,0)/sel.length)}</b> · Menor: {brl(Math.min(...prices))} · Maior: {brl(Math.max(...prices))} · {sel.length} oferta(s)</div>}
  <form key={ok} className="form" onSubmit={e=>{const f=fd(e);upd(x=>({...x,offers:[...x.offers,{id:uid(),name:f.name,features:f.features,price:+f.price,store:f.store,url:f.url,used:f.cond==='usado',date:today(),selected:true}]}));setOk(o=>o+1)}}>
  <label>Produto<input name="name" required/></label><label>Características<input name="features"/></label><label>Preço (R$)<Money name="price" required/></label><label>Loja<input name="store"/></label><label>Link<input name="url" type="url"/></label><label>Condição<select name="cond"><option>novo</option><option>usado</option></select></label><div className="row end"><button className="btn sm">Adicionar oferta</button></div></form>
  {it.status!=='comprado'&&(buy?<form id="buyform" className="form" onSubmit={e=>{const f=fd(e);upd(x=>({...x,status:'comprado',purchase:{price:+f.price,store:f.store,date:f.date,notes:f.notes}}));toast('Compra registrada');onClose()}}><label>Valor pago (R$)<Money name="price" required defaultValue={avg(it)}/></label><label>Loja<input name="store"/></label><label>Data<input name="date" type="date" defaultValue={today()}/></label><label>Observações<input name="notes"/></label><div className="row end"><button className="btn">Confirmar compra</button></div></form>:null)}
  </>}</Modal>}
