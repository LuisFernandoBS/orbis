import {useState,useRef} from 'react';
import {Plus,Search,ShoppingBag,Trash2,Pencil,Check} from 'lucide-react';
import {useStore,set} from '../../store';
import {Modal,Confirm,toast,fd} from '../../components/ui';
import {MKT_CATS,MKT_UNITS,fmtQty,addFrequent,updateFrequent,removeFrequent,addFromFrequent,bumpQuantity} from '../../services/market';
import {catStyle,DupeModal} from './shared';

export default function MarketFrequent(){
  const s=useStore();
  const m=s.market;
  const [q,setQ]=useState('');
  const [catFilter,setCatFilter]=useState('');
  const [modalOpen,setModalOpen]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [dupeItem,setDupeItem]=useState<{name:string;id?:string}|null>(null);
  const inputRef=useRef<HTMLInputElement>(null);

  const cats=[...new Set([...MKT_CATS,...m.frequentItems.map(i=>i.category).filter(Boolean)])];
  const filtered=m.frequentItems.filter(i=>{
    if(q&&!i.name.toLowerCase().includes(q.toLowerCase()))return false;
    if(catFilter&&i.category!==catFilter)return false;
    return true;
  });

  return <>
    <div className="phead between" style={{alignItems:'flex-start'}}>
      <div>
        <h1>Itens Frequentes</h1>
        <p className="sub">Produtos recorrentes que você compra com mais frequência</p>
      </div>
      <button className="btn" onClick={()=>setModalOpen(true)}><Plus size={16}/>Novo item frequente</button>
    </div>

    <div className="row srch">
      <Search size={16}/>
      <input placeholder="Filtrar catálogo de frequentes…" value={q} onChange={e=>setQ(e.target.value)}/>
      <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
        <option value="">Todas as categorias</option>
        {cats.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
    </div>

    {filtered.length?(
      <div style={{display:'grid',gap:8}}>
        {filtered.map(i=>{
          const qtyStr=fmtQty(i.defaultQuantity,i.defaultUnit);
          return <div key={i.id} className="card item between" style={{padding:'12px 14px',margin:0}}>
            <div style={{display:'grid',gap:4,flex:1,minWidth:0}}>
              <div className="row" style={{margin:0,gap:8}}>
                <span className="m-name" style={{fontSize:'1.05rem'}}><b>{i.name}</b></span>
                {i.category&&<span className="badge cat" style={catStyle(i.category)}>{i.category}</span>}
              </div>
              {qtyStr&&<small className="m-qty" style={{color:'var(--mut)'}}>Padrão: {qtyStr}</small>}
            </div>
            <div className="row" style={{margin:0,gap:8}}>
              <button className="btn sm ghost" title="Adicionar à lista de compras" onClick={()=>{
                const res=addFromFrequent(m,i.id);
                if(res.dupe){
                  setDupeItem({name:res.dupe.name,id:res.dupe.id});
                }else{
                  set(st=>({...st,market:res.m}));
                  toast(`"${i.name}" adicionado à lista`);
                }
              }}>
                <ShoppingBag size={14}/>Adicionar
              </button>
              <button className="ib" title="Editar" onClick={()=>setEditId(i.id)}><Pencil size={16}/></button>
              <button className="ib danger" title="Excluir" onClick={()=>{
                set(st=>({...st,market:removeFrequent(st.market,i.id)}));
                toast('Item removido do catálogo');
              }}><Trash2 size={16}/></button>
            </div>
          </div>;
        })}
      </div>
    ):(
      <div className="empty">
        <p>{q||catFilter?'Nenhum item frequente encontrado.':'Seu catálogo de frequentes está vazio. Adicione produtos que você compra sempre!'}</p>
      </div>
    )}

    {(modalOpen||editId)&&<FrequentModal id={editId} onClose={()=>{setModalOpen(false);setEditId(null)}}/>}
    {dupeItem&&<DupeModal name={dupeItem.name} onAddMore={()=>{const id=dupeItem.id;if(id){set(st=>({...st,market:bumpQuantity(st.market,id,1)}));toast('Quantidade aumentada');}}} onClose={()=>setDupeItem(null)}/>}
  </>;
}

function FrequentModal({id,onClose}:{id:string|null;onClose:()=>void}){
  const s=useStore();
  const it=id?s.market.frequentItems.find(x=>x.id===id):null;
  const [del,setDel]=useState(false);
  const allCats=[...new Set([...MKT_CATS,...s.market.frequentItems.map(i=>i.category).filter(Boolean)])];

  return <>
    <Modal title={it?'Editar item frequente':'Novo item frequente'} onClose={onClose}>
      <form className="form" onSubmit={e=>{
        const f=fd(e);
        const q=f.defaultQuantity?parseFloat(f.defaultQuantity.replace(',','.')):null;
        const name=f.name.trim();
        if(!name)return;
        if(it){
          set(st=>({...st,market:updateFrequent(st.market,it.id,{name,category:f.category,defaultQuantity:q&&q>0?q:null,defaultUnit:f.defaultUnit||null})}));
          toast('Item frequente atualizado');
        }else{
          const res=addFrequent(s.market,{name,category:(f.category as string)||'',defaultQuantity:q&&q>0?q:null,defaultUnit:(f.defaultUnit as string)||null});
          if(res.dupe){
            toast('Este produto já existe no catálogo');
          }else{
            set(st=>({...st,market:res.m}));
            toast('Item adicionado ao catálogo');
          }
        }
        onClose();
      }}>
        <label style={{gridColumn:'1/-1'}}>Nome *<input name="name" required defaultValue={it?.name??''}/></label>
        <label>Quantidade padrão<input name="defaultQuantity" inputMode="decimal" defaultValue={it?.defaultQuantity??''}/></label>
        <label>Unidade padrão<select name="defaultUnit" defaultValue={it?.defaultUnit??''}><option value="">Nenhuma</option>{MKT_UNITS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label style={{gridColumn:'1/-1'}}>Categoria<input name="category" list="mktcats" defaultValue={it?.category??''}/><datalist id="mktcats">{allCats.map(c=><option key={c} value={c}/>)}</datalist></label>
        <div className="between" style={{gridColumn:'1/-1',marginTop:6}}>
          {it?<button type="button" className="btn ghost danger" onClick={()=>setDel(true)}><Trash2 size={16}/>Excluir</button>:<div/>}
          <div className="row" style={{margin:0}}><button type="button" className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn">Salvar</button></div>
        </div>
      </form>
    </Modal>
    {del&&it&&<Confirm title="Excluir item frequente" msg={<>Deseja excluir <b>{it.name}</b> do catálogo de frequentes?</>} confirmLabel="Excluir" onCancel={()=>setDel(false)} onConfirm={()=>{set(st=>({...st,market:removeFrequent(st.market,it.id)}));toast('Item excluído');onClose()}}/>}
  </>;
}
