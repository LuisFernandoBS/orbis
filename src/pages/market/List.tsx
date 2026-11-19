import {useState,useRef} from 'react';
import {Plus,Search,ShoppingCart,CheckCircle2,CalendarDays,Repeat,Check,Trash2,Pencil} from 'lucide-react';
import {useStore,set} from '../../store';
import {Stat,Empty,toast} from '../../components/ui';
import {mktStats,addShoppingItem,bumpQuantity,purchaseItem,removeItem,fmtQty,MKT_CATS} from '../../services/market';
import {catStyle,DupeModal,ItemModal} from './shared';

export default function MarketList(){
const s=useStore();
const m=s.market;
const st=mktStats(m);
const [q,setQ]=useState('');
const [catFilter,setCatFilter]=useState('');
const [editId,setEditId]=useState<string|null>(null);
const [dupeItem,setDupeItem]=useState<{name:string;id?:string}|null>(null);
const [quickVal,setQuickVal]=useState('');
const inputRef=useRef<HTMLInputElement>(null);

const cats=[...new Set([...MKT_CATS,...m.shoppingItems.map(i=>i.category).filter(Boolean)])];

const filtered=m.shoppingItems.filter(i=>{
  if(q&&!i.name.toLowerCase().includes(q.toLowerCase()))return false;
  if(catFilter&&i.category!==catFilter)return false;
  return true;
});

const handleQuickAdd=(e:React.FormEvent)=>{
  e.preventDefault();
  const name=quickVal.trim();
  if(!name)return;
  const res=addShoppingItem(m,{name,quantity:null,unit:null,category:'',notes:'',period:'none'});
  if(res.dupe){
    setDupeItem({name:res.dupe.name,id:res.dupe.id});
  }else{
    set(st=>({...st,market:res.m}));
    toast(`"${name}" adicionado`);
    setQuickVal('');
  }
  inputRef.current?.focus();
};

return <>
<div className="phead">
<div><h1>Lista de Compras</h1><p className="sub">Adicione e organize rapidamente o que precisa comprar</p></div>
</div>

<div className="grid mktgrid">
<Stat icon={<ShoppingCart size={18}/>} label="Na lista" value={st.active}/>
<Stat icon={<CalendarDays size={18}/>} label="Este mês" value={st.thisMonth}/>
<Stat icon={<Repeat size={18}/>} label="Frequentes" value={st.frequent}/>
<Stat icon={<CheckCircle2 size={18}/>} label="Comprados (Mês)" value={st.boughtThisMonth}/>
</div>

{/* Cadastro rápido sempre acessível */}
<form className="card quick-form" onSubmit={handleQuickAdd}>
<div className="row" style={{margin:0,flexWrap:'nowrap'}}>
<div style={{position:'relative',flex:1,display:'flex',alignItems:'center'}}>
<Plus size={18} style={{position:'absolute',left:12,color:'var(--mut)'}}/>
<input ref={inputRef} placeholder="Adicionar produto rapidamente (ex: Arroz 5kg)…" value={quickVal} onChange={e=>setQuickVal(e.target.value)} style={{paddingLeft:38}}/>
</div>
<button className="btn"><Plus size={16}/>Adicionar</button>
</div>
</form>

<div className="row srch">
<Search size={16}/>
<input placeholder="Filtrar produtos na lista…" value={q} onChange={e=>setQ(e.target.value)}/>
<select value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
<option value="">Todas as categorias</option>
{cats.map(c=><option key={c} value={c}>{c}</option>)}
</select>
</div>

{filtered.length?(
<div style={{display:'grid',gap:8}}>
{filtered.map(i=>{
  const qtyStr=fmtQty(i.quantity,i.unit);
  const isMonth=i.period==='current_month';
  return <div key={i.id} className="card item m-item between" style={{padding:'10px 14px',margin:0}}>
<div className="row" style={{margin:0,flex:1,minWidth:0}}>
<button className="mchk" aria-label="Marcar como comprado" onClick={()=>{set(st=>({...st,market:purchaseItem(st.market,i.id)}));toast(`"${i.name}" movido para o histórico`)}}>
<div className="chk-circle"><Check size={14}/></div>
</button>
<div style={{display:'grid',minWidth:0,flex:1}} onClick={()=>setEditId(i.id)} role="button" tabIndex={0}>
<span className="m-name"><b>{i.name}</b>{qtyStr&&<small className="m-qty"> · {qtyStr}</small>}</span>
<div className="row" style={{margin:0,gap:6}}>
{i.category&&<span className="badge cat" style={catStyle(i.category)}>{i.category}</span>}
{isMonth&&<span className="badge" style={{color:'var(--aqua)'}}>Este mês</span>}
{i.notes&&<small className="m-note">{i.notes}</small>}
</div>
</div>
</div>
<div className="row" style={{margin:0,flex:'none'}}>
<button className="ib" title="Editar" onClick={()=>setEditId(i.id)}><Pencil size={16}/></button>
<button className="ib danger" title="Excluir" onClick={()=>{set(st=>({...st,market:removeItem(st.market,i.id)}));toast('Item removido')}}><Trash2 size={16}/></button>
</div>
</div>;
})}
</div>
):(
<Empty text={q||catFilter?'Nenhum produto encontrado com esses filtros.':'Sua lista de compras está vazia. Adicione acima!'}/>
)}

{editId&&<ItemModal id={editId} onClose={()=>setEditId(null)}/>}
{dupeItem&&<DupeModal name={dupeItem.name} onAddMore={()=>{const id=dupeItem.id;if(id){set(st=>({...st,market:bumpQuantity(st.market,id,1)}));toast('Quantidade aumentada');setQuickVal('')}}} onClose={()=>setDupeItem(null)}/>}
</>;
}
