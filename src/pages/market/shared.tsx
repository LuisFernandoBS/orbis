import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {useStore,set} from '../../store';
import {Modal,Confirm,toast,fd} from '../../components/ui';
import type {MarketPeriod} from '../../types';
import {MKT_CATS,MKT_UNITS,updateItem,removeItem,currentYM} from '../../services/market';

const CAT_COLORS:Record<string,string>={Alimentos:'#34D399',Bebidas:'#60A5FA',Limpeza:'#42D6D0','Higiene pessoal':'#F472B6','Cuidados com a casa':'#F0B86E',Outros:'#989AAF'};
export const catStyle=(c:string)=>{const col=CAT_COLORS[c]??'#989AAF';return{color:col,borderColor:col+'55',background:col+'1f'}};

export function DupeModal({name,onAddMore,onClose}:{name:string;onAddMore:()=>void;onClose:()=>void}){
return <Modal title="Produto já na lista" onClose={onClose}>
<div style={{display:'grid',gap:12}}>
<p style={{margin:0}}><b>"{name}"</b> já está presente na sua lista de compras ativa.</p>
<div className="row end" style={{margin:0}}>
<button className="btn ghost" onClick={onClose}>Manter como está</button>
<button className="btn" onClick={()=>{onAddMore();onClose()}}>Somar 1 à quantidade</button>
</div>
</div>
</Modal>;
}

export function ItemModal({id,onClose}:{id:string;onClose:()=>void}){
const s=useStore();
const it=s.market.shoppingItems.find(x=>x.id===id);
const [del,setDel]=useState(false);
if(!it)return null;
const allCats=[...new Set([...MKT_CATS,...s.market.shoppingItems.map(i=>i.category).filter(Boolean)])];

return <>
<Modal title="Editar item" onClose={onClose}>
<form className="form" onSubmit={e=>{
  const f=fd(e);
  const q=f.quantity?parseFloat(f.quantity.replace(',','.')):null;
  set(st=>({...st,market:updateItem(st.market,it.id,{
    name:f.name.trim(),
    quantity:q&&q>0?q:null,
    unit:f.unit||null,
    category:f.category,
    notes:f.notes,
    period:f.period as MarketPeriod,
    periodMonth:f.period==='current_month'?(it.periodMonth??currentYM()):null
  })}));
  toast('Item atualizado');
  onClose();
}}>
<label style={{gridColumn:'1/-1'}}>Nome *<input name="name" required defaultValue={it.name}/></label>
<label>Quantidade<input name="quantity" inputMode="decimal" defaultValue={it.quantity??''}/></label>
<label>Unidade<select name="unit" defaultValue={it.unit??''}><option value="">Nenhuma</option>{MKT_UNITS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
<label>Categoria<input name="category" list="mktcats" defaultValue={it.category}/><datalist id="mktcats">{allCats.map(c=><option key={c} value={c}/>)}</datalist></label>
<label>Período de compra<select name="period" defaultValue={it.period}><option value="none">Sem período definido</option><option value="current_month">Este mês</option></select></label>
<label style={{gridColumn:'1/-1'}}>Observações<textarea name="notes" defaultValue={it.notes}/></label>
<div className="between" style={{gridColumn:'1/-1',marginTop:6}}>
<button type="button" className="btn ghost danger" onClick={()=>setDel(true)}><Trash2 size={16}/>Excluir item</button>
<div className="row" style={{margin:0}}><button type="button" className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn">Salvar</button></div>
</div>
</form>
</Modal>
{del&&<Confirm title="Excluir item" msg={<>Deseja excluir <b>{it.name}</b> da lista de compras?</>} confirmLabel="Excluir" onCancel={()=>setDel(false)} onConfirm={()=>{set(st=>({...st,market:removeItem(st.market,it.id)}));toast('Item excluído');onClose()}}/>}
</>;
}
