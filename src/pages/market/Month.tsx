import {useState,useRef} from 'react';
import {Plus,Search,CalendarDays,Check,Trash2,Pencil,ArrowDownToLine} from 'lucide-react';
import {useStore,set} from '../../store';
import {toast} from '../../components/ui';
import {addShoppingItem,bumpQuantity,purchaseItem,removeItem,bringMonthBacklog,fmtQty,currentYM} from '../../services/market';
import {catStyle,DupeModal,ItemModal} from './shared';

export default function MarketMonth(){
  const s=useStore();
  const m=s.market;
  const ym=currentYM();
  const [q,setQ]=useState('');
  const [editId,setEditId]=useState<string|null>(null);
  const [dupeItem,setDupeItem]=useState<{name:string;id?:string}|null>(null);
  const [quickVal,setQuickVal]=useState('');
  const inputRef=useRef<HTMLInputElement>(null);

  const monthItems=m.shoppingItems.filter(i=>i.period==='current_month'&&i.periodMonth===ym);
  const backlogItems=m.shoppingItems.filter(i=>i.period==='current_month'&&i.periodMonth&&i.periodMonth!==ym);

  const filtered=monthItems.filter(i=>{
    if(q&&!i.name.toLowerCase().includes(q.toLowerCase()))return false;
    return true;
  });

  const handleQuickAdd=(e:React.FormEvent)=>{
    e.preventDefault();
    const name=quickVal.trim();
    if(!name)return;
    const res=addShoppingItem(m,{name,quantity:null,unit:null,category:'',notes:'',period:'current_month'});
    if(res.dupe){
      setDupeItem({name:res.dupe.name,id:res.dupe.id});
    }else{
      set(st=>({...st,market:res.m}));
      toast(`"${name}" adicionado à lista do mês`);
      setQuickVal('');
    }
    inputRef.current?.focus();
  };

  return <>
    <div className="phead">
      <div>
        <h1>Compras do Mês</h1>
        <p className="sub">Produtos planejados especificamente para o mês atual ({ym})</p>
      </div>
    </div>

    {backlogItems.length>0&&(
      <div className="card" style={{background:'rgba(139, 92, 246, 0.1)',borderColor:'var(--pri)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <b>Itens pendentes de meses anteriores ({backlogItems.length})</b>
          <p style={{margin:0,fontSize:'0.9rem',color:'var(--mut)'}}>Há produtos de meses passados marcados para este mês.</p>
        </div>
        <button className="btn sm" onClick={()=>{
          set(st=>({...st,market:bringMonthBacklog(st.market)}));
          toast('Itens trazidos para o mês atual');
        }}>
          <ArrowDownToLine size={14}/>Trazer para este mês
        </button>
      </div>
    )}

    <form className="card quick-form" onSubmit={handleQuickAdd}>
      <div className="row" style={{margin:0,flexWrap:'nowrap'}}>
        <div style={{position:'relative',flex:1,display:'flex',alignItems:'center'}}>
          <Plus size={18} style={{position:'absolute',left:12,color:'var(--mut)'}}/>
          <input ref={inputRef} placeholder="Adicionar produto para este mês (ex: Azeite, Vinho)…" value={quickVal} onChange={e=>setQuickVal(e.target.value)} style={{paddingLeft:38}}/>
        </div>
        <button className="btn"><Plus size={16}/>Adicionar</button>
      </div>
    </form>

    <div className="row srch">
      <Search size={16}/>
      <input placeholder="Filtrar produtos do mês…" value={q} onChange={e=>setQ(e.target.value)}/>
    </div>

    {filtered.length?(
      <div style={{display:'grid',gap:8}}>
        {filtered.map(i=>{
          const qtyStr=fmtQty(i.quantity,i.unit);
          return <div key={i.id} className="card item m-item between" style={{padding:'10px 14px',margin:0}}>
            <div className="row" style={{margin:0,flex:1,minWidth:0}}>
              <button className="mchk" aria-label="Marcar como comprado" onClick={()=>{set(st=>({...st,market:purchaseItem(st.market,i.id)}));toast(`"${i.name}" comprado`)}}>
                <div className="chk-circle"><Check size={14}/></div>
              </button>
              <div style={{display:'grid',minWidth:0,flex:1}} onClick={()=>setEditId(i.id)} role="button" tabIndex={0}>
                <span className="m-name"><b>{i.name}</b>{qtyStr&&<small className="m-qty"> · {qtyStr}</small>}</span>
                <div className="row" style={{margin:0,gap:6}}>
                  {i.category&&<span className="badge cat" style={catStyle(i.category)}>{i.category}</span>}
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
      <div className="empty">
        <p>{q?'Nenhum produto do mês encontrado com esse filtro.':'Nenhum produto planejado para este mês. Adicione acima!'}</p>
      </div>
    )}

    {editId&&<ItemModal id={editId} onClose={()=>setEditId(null)}/>}
    {dupeItem&&<DupeModal name={dupeItem.name} onAddMore={()=>{const id=dupeItem.id;if(id){set(st=>({...st,market:bumpQuantity(st.market,id,1)}));toast('Quantidade aumentada');setQuickVal('')}}} onClose={()=>setDupeItem(null)}/>}
  </>;
}
