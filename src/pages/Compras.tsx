import {useState,useEffect,useRef} from 'react';import {useParams,useNavigate} from 'react-router-dom';import {Plus,Trash2,Search,ShoppingCart,CheckCircle2,Star,Wallet,Heart,Clock,AlertTriangle,ArrowRight,ShoppingBag,Sofa,BedDouble,CookingPot,Bath,DoorOpen,ChevronRight,Home,Pencil,Sparkles,Check,Image as ImageIcon,LoaderCircle,RefreshCw,X,Tag,Link as LinkIcon,Store,ShieldCheck,Upload} from 'lucide-react';
import {useStore,set,uid} from '../store';import {Modal,Stat,Empty,fd,toast,Money} from '../components/ui';import {brl,avg,offerTotal,today,L} from '../utils';import type {Item,Priority,Offer,Room} from '../types';import {supabase} from '../services/supabase';
import {discoverProducts} from '../services/ai';
import type {ProductDiscovery as ProductDiscoveryData,ProductSuggestion} from '../services/ai';

const ri:Record<string,any>={sala:Sofa,quarto:BedDouble,cozinha:CookingPot,banheiro:Bath};
const priorityOrder:Record<Priority,number>={alta:0,media:1,baixa:2};

export default function Compras(){
  const s=useStore();
  const {room}=useParams();
  const nav=useNavigate();
  const tab=room??'geral';
  const setTab=(k:string)=>nav(k==='geral'?'/casa/compras':'/casa/compras/'+k);
  const [q,setQ]=useState('');
  const [m,setM]=useState<{id?:string}|null>(null);
  const [aiRoom,setAiRoom]=useState<Room|null>(null);

  const roomObj = s.rooms.find(r=>r.id===tab);
  const [priorityFilter,setPriorityFilter]=useState('');
  const [statusFilter,setStatusFilter]=useState('');

  const pend=s.items.filter(i=>i.status!=='comprado');
  const bought=s.items.filter(i=>i.status==='comprado');

  const roomItems = tab==='hist' ? bought : tab==='desejos' ? s.items.filter(i=>!i.roomId&&i.status!=='comprado') : s.items.filter(i=>i.roomId===tab);
  const roomTotalItems = roomItems.length;
  const roomBoughtCount = roomItems.filter(i=>i.status==='comprado').length;
  const roomEstimatedBudget = roomItems.reduce((acc,i)=>acc+(i.purchase?.price ?? (avg(i)*i.qty)),0);

  const shown = roomItems.filter(i=>{
    if(q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    if(priorityFilter && i.priority !== priorityFilter) return false;
    if(statusFilter && i.status !== statusFilter) return false;
    return true;
  }).sort((a,b)=>{
    return priorityOrder[a.priority]-priorityOrder[b.priority]||a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'});
  });

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
        <div className="grid c-stats-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))',marginBottom:20}}>
          <Stat icon={<ShoppingCart size={18}/>} label="Itens planejados" value={pend.length}/>
          <Stat icon={<CheckCircle2 size={18}/>} label="Comprados" value={bought.length}/>
          <Stat icon={<Wallet size={18}/>} label="Orçamento estimado" value={brl(totalEstimated)}/>
          <Stat icon={<Star size={18}/>} label="Gasto atual" value={brl(totalSpent)}/>
        </div>

        {/* Área principal — duas colunas */}
        <div className="c-main-grid" style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:20,alignItems:'start'}}>

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
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12}}>
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
        {/* Cabeçalho do cômodo / seção */}
        <div className="phead" style={{marginBottom:20}}>
          <div>
            <h1>{tab==='desejos'?'Lista de Desejos':tab==='hist'?'Histórico':roomObj?.name??'Compras'}</h1>
            <p className="sub">Planeje, compare ofertas e registre compras</p>
          </div>
          {tab!=='hist'&&tab!=='desejos'&&roomObj&&<div className="row" style={{margin:0,gap:8,justifyContent:'flex-end'}}><button className="btn ai-discover-btn" onClick={()=>setAiRoom(roomObj)}><Sparkles size={16}/>Descobrir produtos com IA</button><button className="btn" onClick={()=>setM({})}><Plus size={16}/>Novo item</button></div>}
          {tab==='desejos'&&<button className="btn" onClick={()=>setM({})}><Plus size={16}/>Novo item</button>}
        </div>

        {/* Busca e filtros */}
        {tab!=='hist'&&(
          <div className="card" style={{padding:16,marginBottom:20}}>
            <div className="row" style={{margin:0,gap:12,flexWrap:'wrap'}}>
              <div style={{position:'relative',flex:1,display:'flex',alignItems:'center',minWidth:220}}>
                <Search size={16} style={{position:'absolute',left:12,color:'var(--mut)'}}/>
                <input placeholder="Buscar itens…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:38,width:'100%'}}/>
              </div>
              <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} style={{width:'auto',minWidth:140}}>
                <option value="">Todas prioridades</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{width:'auto',minWidth:140}}>
                <option value="">Todos status</option>
                <option value="desejado">Desejado</option>
                <option value="pesquisando">Pesquisando</option>
                <option value="comprado">Comprado</option>
              </select>
              {tab!=='desejos'&&tab!=='hist'&&(
                <button className="btn ghost danger" onClick={()=>{
                  if(confirm(`Excluir cômodo "${roomObj?.name}"? Os itens vão para a lista de desejos.`)){
                    set(st=>({...st,rooms:st.rooms.filter(r=>r.id!==tab),items:st.items.map(i=>i.roomId===tab?{...i,roomId:null}:i)}));
                    setTab('geral');
                    toast('Cômodo excluído');
                  }
                }} style={{borderColor:'rgba(239,107,115,0.3)',color:'#ef6b73'}}>
                  <Trash2 size={16}/> Excluir cômodo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cards dos produtos em grade responsiva (4+ colunas em desktop) */}
        {shown.length?(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16,marginBottom:24}}>
            {shown.map(i=>{
              const RoomIcon=roomObj&&ri[roomObj.id]?ri[roomObj.id]:ShoppingCart;
              const selOffer=i.offers.find(o=>o.selected);
              const storeName=i.purchase?.store || selOffer?.store || (i.offers.length > 0 ? `${i.offers.length} oferta(s)` : 'Sem oferta');
              const itemPrice=i.purchase?.price ?? (avg(i)>0 ? avg(i)*i.qty : 0);
              return <div key={i.id} className="card hov" style={{margin:0,padding:18,cursor:'pointer',display:'flex',flexDirection:'column',gap:14}} onClick={()=>setM({id:i.id})} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&setM({id:i.id})}>
                <div className="between" style={{margin:0}}>
                  <div className="row" style={{margin:0,gap:6}}>
                    <span className={'badge p-'+i.priority}>{L[i.priority]}</span>
                    <span className="badge">{L[i.status]}</span>
                  </div>
                  <button className="ib" aria-label="Excluir item" onClick={e=>{e.stopPropagation();delItem(i)}}><Trash2 size={16}/></button>
                </div>
                <div className="row" style={{margin:0,gap:12,alignItems:'flex-start'}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(139,92,246,0.15)',color:'var(--pri)',display:'grid',placeItems:'center',flex:'none'}}>
                    <RoomIcon size={20}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <b style={{fontSize:'1.05rem',display:'block',marginBottom:4,wordBreak:'break-word'}}>{i.name}</b>
                    {i.desc && <p style={{margin:0,color:'var(--mut)',fontSize:'0.85rem',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{i.desc}</p>}
                  </div>
                </div>
                <div className="between" style={{marginTop:'auto',paddingTop:10,borderTop:'1px solid var(--bd)'}}>
                  <span style={{fontSize:'0.8rem',color:'var(--mut)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'55%'}}>
                    {storeName}
                  </span>
                  <b className="price" style={{color:'var(--aqua)',fontSize:'1.05rem',fontWeight:700}}>
                    {brl(itemPrice)}
                  </b>
                </div>
              </div>;
            })}
          </div>
        ):(
          <Empty text="Nada por aqui ainda. Adicione novos itens para começar."/>
        )}

        {/* Resumo do cômodo (se aplicável, para cômodos e desejos) */}
        {tab!=='hist' && roomItems.length > 0 && (
          <div className="card" style={{padding:24,background:'linear-gradient(135deg, #1B1D2D 0%, #252243 100%)',border:'1px solid rgba(139,92,246,0.3)',borderRadius:16,marginTop:24}}>
            <div className="between" style={{marginBottom:16}}>
              <div>
                <h3 style={{margin:0,fontSize:'1.15rem'}}>Resumo de {roomObj?.name ?? 'Desejos'}</h3>
                <p style={{margin:0,color:'var(--mut)',fontSize:'0.85rem'}}>Estatísticas e orçamento atualizados</p>
              </div>
              <span className="badge" style={{background:'rgba(139,92,246,0.2)',color:'var(--lav)',fontWeight:600,padding:'6px 12px'}}>
                {roomBoughtCount} de {roomTotalItems} comprados ({roomTotalItems > 0 ? Math.round((roomBoughtCount/roomTotalItems)*100) : 0}%)
              </span>
            </div>
            <div className="grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14,margin:0}}>
              <div className="card" style={{margin:0,padding:16,background:'rgba(27,29,45,0.7)',border:'1px solid var(--bd)'}}>
                <small style={{color:'var(--mut)',fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>Total de itens</small>
                <b style={{fontSize:'1.4rem',display:'block',marginTop:6}}>{roomTotalItems}</b>
              </div>
              <div className="card" style={{margin:0,padding:16,background:'rgba(27,29,45,0.7)',border:'1px solid var(--bd)'}}>
                <small style={{color:'var(--mut)',fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>Itens comprados</small>
                <b style={{fontSize:'1.4rem',display:'block',marginTop:6,color:'var(--aqua)'}}>{roomBoughtCount}</b>
              </div>
              <div className="card" style={{margin:0,padding:16,background:'rgba(27,29,45,0.7)',border:'1px solid var(--bd)'}}>
                <small style={{color:'var(--mut)',fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>Orçamento estimado</small>
                <b style={{fontSize:'1.4rem',display:'block',marginTop:6,color:'var(--lav)'}}>{brl(roomEstimatedBudget)}</b>
              </div>
            </div>
          </div>
        )}
      </>
    )}

    {aiRoom&&<ProductDiscovery room={aiRoom} onClose={()=>setAiRoom(null)}/>}
    {m&&<ItemModal id={m.id} roomId={['desejos','hist','geral'].includes(tab)?null:tab} onClose={()=>setM(null)}/>}
  </>;
}

const normProductName=(name:string)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');

function ProductDiscovery({room,onClose}:{room:Room;onClose:()=>void}){
  const s=useStore();
  const [data,setData]=useState<ProductDiscoveryData|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [activeCategory,setActiveCategory]=useState('');
  const [newProductNames,setNewProductNames]=useState<string[]>([]);

  const generate=async(more=false)=>{
    setBusy(true);setError('');
    try{
      const existing=s.items.filter(i=>i.roomId===room.id).map(i=>i.name);
      const presented=data?.categories.flatMap(c=>c.products.map(p=>p.name))??[];
      const result=await discoverProducts({room:room.name,roomId:room.id,existingProducts:existing,avoidNames:presented,count:more?12:18});
      if(more){
        const alreadyKnown=new Set([...existing,...presented].map(normProductName));
        const freshNames=result.categories.flatMap(c=>c.products.map(p=>p.name))
          .filter(name=>name&&!alreadyKnown.has(normProductName(name)))
          .filter((name,index,names)=>names.findIndex(other=>normProductName(other)===normProductName(name))===index);
        setNewProductNames(freshNames.map(normProductName));
      }else setNewProductNames([]);
      setData(current=>{
        if(!more||!current)return result;
        const merged=result.categories.map(category=>{
          const old=current.categories.find(c=>normProductName(c.name)===normProductName(category.name));
          const products=[...(old?.products??[]),...category.products];
          const unique=products.filter((product,index,all)=>all.findIndex(p=>normProductName(p.name)===normProductName(product.name))===index);
          return {name:category.name,products:unique};
        });
        current.categories.forEach(category=>{
          if(!merged.some(c=>normProductName(c.name)===normProductName(category.name)))merged.push(category);
        });
        return {room:result.room,categories:merged};
      });
      setActiveCategory(result.categories[0]?.name??'');
    }catch(e){setError((e as Error).message)}
    setBusy(false);
  };

  useEffect(()=>{generate(false);},[]);

  const inList=(name:string)=>{
    const n=normProductName(name);
    return s.items.some(i=>i.roomId===room.id&&normProductName(i.name)===n);
  };
  const addProduct=(product:ProductSuggestion)=>{
    if(inList(product.name)){toast('Este produto já está na lista');return;}
    set(st=>{
      const duplicate=st.items.some(i=>i.roomId===room.id&&normProductName(i.name)===normProductName(product.name));
      if(duplicate)return st;
      const item:Item={id:uid(),name:product.name,desc:product.description,qty:1,priority:'media',status:'desejado',roomId:room.id,offers:[]};
      return {...st,items:[...st.items,item]};
    });
    toast(`"${product.name}" adicionado à lista`);
  };

  const categories=data?.categories??[];
  const selected=categories.find(c=>c.name===activeCategory)??categories[0];
  return <Modal full title={`Descobrir produtos — ${room.name}`} onClose={onClose} footer={
    <button className="btn ai-generate-more" onClick={()=>generate(true)} disabled={busy} aria-live="polite">
      {busy?<LoaderCircle className="ai-spin" size={16}/>:<RefreshCw size={16}/>} {busy?'Gerando sugestões…':'Gerar mais sugestões'}
    </button>
  }>
    <div className="ai-discover">
      {busy&&!data&&<div className="ai-state"><LoaderCircle className="ai-spin" size={28}/><b>Consultando a IA…</b><small>Estamos escolhendo produtos úteis para {room.name}.</small></div>}
      {error&&<div className="ai-state ai-error"><AlertTriangle size={22}/><b>Não foi possível gerar sugestões</b><small>{error}</small><button className="btn ghost sm" onClick={()=>generate(false)}>Tentar novamente</button></div>}
      {!busy&&data&&categories.length===0&&<div className="ai-state"><b>Nenhuma sugestão encontrada</b><small>Tente gerar novas ideias para este ambiente.</small></div>}
      {data&&selected&&<>
        <div className="ai-category-tabs" role="tablist" aria-label="Categorias de produtos">
          {categories.map(category=><button key={category.name} type="button" role="tab" aria-selected={selected.name===category.name} className={'ai-category-tab '+(selected.name===category.name?'on':'')} onClick={()=>setActiveCategory(category.name)}>{category.name}</button>)}
        </div>
        <div className="ai-product-grid">
          {selected.products.map(product=>{
            const added=inList(product.name);
            const isNew=newProductNames.includes(normProductName(product.name));
            return <article className="ai-product-card" key={`${selected.name}-${normProductName(product.name)}`}>
              <div className="ai-product-placeholder"><ImageIcon size={24}/><small>Produto {room.name}</small></div>
              <div className="ai-product-body">
                <div className="ai-product-meta">
                  <span className="ai-category-label">{selected.name}</span>
                  {isNew&&<span className="ai-new-badge">Novo</span>}
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                {product.reason&&<small className="ai-reason">{product.reason}</small>}
                <button className={'btn ai-add-btn '+(added?'added':'')} onClick={()=>addProduct(product)} disabled={added}>
                  {added?<><Check size={16}/>Já adicionado</>:<><Plus size={16}/>Adicionar à lista</>}
                </button>
              </div>
            </article>;
          })}
        </div>
      </>}
    </div>
  </Modal>
}

function ItemModal({id,roomId,onClose}:{id?:string;roomId:string|null;onClose:()=>void}){
  const s=useStore();
  const it=s.items.find(i=>i.id===id);
  const [buy,setBuy]=useState(false);
  const [editOffer,setEditOffer]=useState<Offer|null>(null);
  useEffect(()=>{if(buy)setTimeout(()=>document.getElementById('buyform')?.scrollIntoView({behavior:'smooth',block:'center'}),50)},[buy]);
  const upd=(fn:(i:Item)=>Item)=>set(st=>({...st,items:st.items.map(x=>x.id===id?fn(x):x)}));
  const sel=it?.offers.filter(o=>o.selected)??[];
  const totals=sel.map(offerTotal);
  const del=()=>{if(it&&confirm('Excluir item?')){set(st=>({...st,items:st.items.filter(x=>x.id!==it.id)}));toast('Item excluído');onClose()}};
  const footer=it?<><button type="button" className="btn dsolid icon" aria-label="Excluir item" onClick={del}><Trash2 size={18}/></button>{it.status!=='comprado'&&!buy&&<button type="button" className="btn ghost" onClick={()=>setBuy(true)}>Registrar compra</button>}<button form="itemform" className="btn">Salvar</button></>:<><button type="button" className="btn ghost" onClick={onClose}>Cancelar</button><button form="itemform" className="btn">Salvar</button></>;
  return <><Modal full title={it?it.name:'Novo item'} onClose={onClose} footer={footer}>
  <form id="itemform" className="form" onSubmit={e=>{const f=fd(e);const b={name:f.name,desc:f.desc,qty:+f.qty||1,priority:f.priority as Priority,roomId:f.room||null};const st0=(f.status||'desejado') as 'desejado'|'pesquisando';
  set(st=>({...st,items:it?st.items.map(x=>x.id===it.id?{...x,...b,status:x.status==='comprado'?'comprado':st0}:x):[...st.items,{id:uid(),...b,status:st0,offers:[]}]}));onClose()}}>
  <label>Nome<input name="name" required defaultValue={it?.name}/></label><label>Descrição<input name="desc" defaultValue={it?.desc}/></label>
  <label>Quantidade<input name="qty" type="number" min="1" defaultValue={it?.qty??1}/></label>
  <label>Prioridade<select name="priority" defaultValue={it?.priority??'media'}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></label>
  {it?.status!=='comprado'&&<label>Status<select name="status" defaultValue={it?.status??'desejado'}><option value="desejado">Desejado</option><option value="pesquisando">Pesquisando</option></select></label>}
  <label>Cômodo<select name="room" defaultValue={it?.roomId??roomId??''}><option value="">Sem cômodo (desejos)</option>{s.rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
  </form>
  {it&&<><h4>Ofertas</h4>{it.offers.map(o=>{
    const ot=offerTotal(o);
    const hasFrete=o.frete!==undefined&&o.frete>0;
    return <div key={o.id} className="card between">
      <label className="row"><input type="checkbox" checked={o.selected} onChange={()=>upd(x=>({...x,offers:x.offers.map(y=>y.id===o.id?{...y,selected:!y.selected}:y)}))}/>
      {o.imageUrl&&<img src={o.imageUrl} alt="" style={{width:48,height:48,objectFit:'cover',borderRadius:8,flex:'none'}}/>}
      <span>
        <b>{o.name}</b><br/>
        <small>{o.features}{o.features?' · ':''}{o.store}{o.store?' · ':''}{o.used?'usado':'novo'}</small>
      </span></label>
      <span className="row" style={{alignItems:'center',gap:8}}>
        <div style={{textAlign:'right'}}>
          {hasFrete&&<div style={{fontSize:'0.75rem',color:'var(--mut)'}}>Prod: {brl(o.price)} + Frete: {brl(o.frete!)}</div>}
          <b className="price" style={{color:'var(--aqua)'}}>{brl(ot)}</b>
        </div>
        <button className="ib" aria-label="Editar oferta" onClick={()=>setEditOffer(o)}><Pencil size={16}/></button>
        <button className="ib" aria-label="Remover oferta" onClick={()=>upd(x=>({...x,offers:x.offers.filter(y=>y.id!==o.id)}))}><Trash2 size={16}/></button>
      </span>
    </div>;
  })}
  {sel.length>0&&<div className="card">Média (selecionadas): <b>{brl(totals.reduce((a,b)=>a+b,0)/sel.length)}</b> · Menor: {brl(Math.min(...totals))} · Maior: {brl(Math.max(...totals))} · {sel.length} oferta(s)</div>}
  <button type="button" className="btn" onClick={()=>setEditOffer({id:'',name:'',features:'',price:0,store:'',url:'',used:false,date:today(),selected:true})}><Plus size={16}/>Adicionar oferta</button>
  {it.status!=='comprado'&&(buy?<form id="buyform" className="form" onSubmit={e=>{const f=fd(e);upd(x=>({...x,status:'comprado',purchase:{price:+f.price,store:f.store,date:f.date,notes:f.notes}}));toast('Compra registrada');onClose()}}><label>Valor pago (R$)<Money name="price" required defaultValue={avg(it)}/></label><label>Loja<input name="store"/></label><label>Data<input name="date" type="date" defaultValue={today()}/></label><label>Observações<input name="notes"/></label><div className="row end"><button className="btn">Confirmar compra</button></div></form>:null)}
  </>}</Modal>{editOffer&&it&&<OfferModal item={it} offer={editOffer.id?editOffer:null} onClose={()=>setEditOffer(null)} onSave={offer=>{upd(x=>({...x,offers:editOffer.id?x.offers.map(y=>y.id===offer.id?offer:y):[...x.offers,offer]}));setEditOffer(null)}}/>}</>}

function OfferModal({item,offer,onClose,onSave}:{item:Item;offer:Offer|null;onClose:()=>void;onSave:(offer:Offer)=>void}){
  const [url,setUrl]=useState(offer?.url??'');const [imageUrl,setImageUrl]=useState(offer?.imageUrl??'');const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);const fileRef=useRef<HTMLInputElement>(null);
  const shopee=(()=>{try{const host=new URL(url).hostname.toLowerCase();return host==='shopee.com.br'||host.endsWith('.shopee.com.br')}catch{return false}})();
  useEffect(()=>{if(!url.trim()||!shopee){setStatus('');return}if(offer?.imageUrl&&url===offer.url)return;let active=true;const timer=setTimeout(async()=>{setBusy(true);setStatus('Identificando imagem do produto...');try{const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)throw new Error('Faça login para identificar a imagem.');const response=await fetch('/api/offers/image',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({url})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível localizar a imagem. Você pode adicioná-la manualmente.');if(active){setImageUrl(result.imageUrl);setStatus('Imagem carregada com sucesso!')}}catch(error){if(active)setStatus((error as Error).message)}finally{if(active)setBusy(false)}},650);return()=>{active=false;clearTimeout(timer)}},[url]);
  const uploadManual=async(file?:File)=>{if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setStatus('Use uma imagem JPG, PNG ou WebP.');return}if(file.size>3_000_000){setStatus('A imagem manual deve ter até 3 MB.');return}setBusy(true);setStatus('Salvando imagem...');try{const dataUrl=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Falha ao ler a imagem'));reader.readAsDataURL(file)});const {data:{session}}=await supabase.auth.getSession();const response=await fetch('/api/offers/image',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token??''}`},body:JSON.stringify({imageDataUrl:dataUrl})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Falha ao salvar');setImageUrl(result.imageUrl);setStatus('Imagem carregada com sucesso!')}catch{setStatus('Não foi possível salvar a imagem. Tente novamente.')}finally{setBusy(false)}};
  return <Modal full title={`${item.name} · ${offer?'Editar oferta':'Adicionar oferta'}`} onClose={onClose} footer={<><button type="button" className="btn ghost offer-cancel" onClick={onClose}><X size={16}/>Cancelar</button><button form="offer-editor" className="btn offer-save"><Plus size={18}/>{offer?'Salvar alterações':'Adicionar oferta'}</button></>}>
    <form id="offer-editor" className="offer-editor" onSubmit={e=>{const f=fd(e);const updated:Offer={id:offer?.id||uid(),name:f.name.trim(),features:f.features.trim(),price:+f.price||0,frete:f.frete?+f.frete:undefined,store:f.store.trim(),url:f.url.trim(),imageUrl:imageUrl||undefined,used:f.cond==='usado',date:offer?.date??today(),selected:offer?.selected??true};onSave(updated)}}>
      <div className="offer-intro"><div className="offer-tag"><Tag size={24}/></div><div><h2>{item.name}</h2><p>{offer?'Editar oferta para este produto':'Adicionar uma oferta para este produto'}</p></div></div>
      {shopee&&<div className={'offer-status '+(imageUrl?'success':'')} role="status"><Sparkles size={19}/><span><b>Link da Shopee detectado!</b> {status||'A imagem do produto será buscada automaticamente.'}</span>{busy&&<LoaderCircle className="ai-spin" size={18}/>}</div>}
      <div className="offer-layout"><div className="offer-visual-column">
        <div className="offer-preview">{imageUrl?<img src={imageUrl} alt={`Imagem de ${item.name}`}/>:<div className="offer-placeholder"><ImageIcon size={34}/><b>Prévia do produto</b><small>A imagem da oferta aparecerá aqui</small></div>}<div className="offer-image-actions"><button type="button" className="btn ghost sm" onClick={()=>fileRef.current?.click()}><Upload size={15}/>{imageUrl?'Trocar imagem':'Adicionar imagem'}</button>{imageUrl&&<button type="button" className="btn ghost sm danger" onClick={()=>{setImageUrl('');setStatus('Imagem removida.')}}><Trash2 size={15}/>Remover</button>}</div></div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>uploadManual(e.target.files?.[0])}/>
        <label className="offer-field offer-link-field"><span>Link da oferta</span><div className="offer-input-icon"><LinkIcon size={18}/><input name="url" type="url" value={url} onChange={e=>{const next=e.target.value;if(next!==url){setImageUrl('');setStatus('')}setUrl(next)}} placeholder="https://shopee.com.br/..."/></div></label>
        {status&&!shopee&&<div className="offer-inline-status" role="status">{status}</div>}
      </div><div className="offer-fields">
        <label className="offer-field"><span>Produto</span><div className="offer-input-icon"><ShoppingBag size={18}/><input name="name" required defaultValue={offer?.name??item.name} placeholder="Nome do produto"/></div></label>
        <div className="offer-pair"><label className="offer-field"><span>Características</span><input name="features" defaultValue={offer?.features} placeholder="Modelo, tamanho, cor..."/></label><label className="offer-field"><span>Condição</span><select name="cond" defaultValue={offer?.used?'usado':'novo'}><option value="novo">Novo</option><option value="usado">Usado</option></select></label></div>
        <div className="offer-pair"><label className="offer-field"><span>Preço do produto (R$)</span><Money name="price" required defaultValue={offer?.price}/></label><label className="offer-field"><span>Frete (R$ · opcional)</span><Money name="frete" defaultValue={offer?.frete}/></label></div>
        <label className="offer-field"><span>Loja</span><div className="offer-input-icon"><Store size={18}/><input name="store" defaultValue={offer?.store??(shopee?'Shopee':'')} placeholder="Nome da loja"/></div></label>
        <div className="offer-tip"><ShieldCheck size={19}/><span><b>Dica do Orbis</b><small>Compare o preço total com o frete antes de escolher sua oferta.</small></span></div>
      </div></div>
    </form>
  </Modal>
}
