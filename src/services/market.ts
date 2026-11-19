import type {FrequentItem,MarketState,PurchaseHistory,ShoppingItem,MarketPeriod} from '../types';
import {today} from '../utils';
import {uid} from '../store';

export const nowIso=()=>new Date().toISOString();
export const stamp=()=>today()+'T'+new Date().toTimeString().slice(0,8);
export const currentYM=()=>today().slice(0,7);
export const ymKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

export const emptyMarket=():MarketState=>({frequentItems:[],shoppingItems:[],purchaseHistory:[]});

export const MKT_CATS=['Alimentos','Bebidas','Limpeza','Higiene pessoal','Cuidados com a casa','Outros'];
export const MKT_UNITS=[['un','un'],['kg','kg'],['g','g'],['L','L'],['ml','ml'],['pct','pacote'],['cx','caixa'],['dz','dúzia']] as const;
export const MKT_UNITS_LABEL:Record<string,string>=Object.fromEntries(MKT_UNITS);

export const normName=(n:string)=>n.trim().replace(/\s+/g,' ').toLowerCase();

export const fmtQty=(q:number|null,u:string|null)=>{
  const qs=q!=null?(Number.isInteger(q)?String(q):q.toLocaleString('pt-BR',{maximumFractionDigits:2})):null;
  return [qs,u].filter(Boolean).join(' ');
};

/** Compras registradas no mês informado (por padrão, o mês atual em horário local). */
export const purchasesThisMonth=(m:MarketState,ym=currentYM())=>m.purchaseHistory.filter(p=>{const d=new Date(p.purchasedAt);return ymKey(d)===ym});
export const purchasesLast30Days=(m:MarketState)=>{const cutoff=Date.now()-30*864e5;return m.purchaseHistory.filter(p=>new Date(p.purchasedAt).getTime()>=cutoff)};

export const mktStats=(m:MarketState)=>({
  active:m.shoppingItems.length,
  thisMonth:m.shoppingItems.filter(i=>i.period==='current_month'&&i.periodMonth===currentYM()).length,
  frequent:m.frequentItems.length,
  boughtThisMonth:purchasesThisMonth(m).length,
});

/** Encontra produto na lista ativa ignorando maiúsculas/espaços extras. */
export const findDupe=(m:MarketState,name:string,excludeId?:string)=>m.shoppingItems.find(i=>i.id!==excludeId&&normName(i.name)===normName(name))??null;
export const findDupeFrequent=(m:MarketState,name:string,excludeId?:string)=>m.frequentItems.find(i=>i.id!==excludeId&&normName(i.name)===normName(name))??null;

/* ---------- Lista de compras ---------- */
export type AddResult={m:MarketState;dupe:ShoppingItem|null};
export const addShoppingItem=(m:MarketState,input:{name:string;quantity:number|null;unit:string|null;category:string;notes:string;period:MarketPeriod;frequentItemId?:string|null}):AddResult=>{
  const name=input.name.trim().replace(/\s+/g,' ');
  if(!name)return{m,dupe:null};
  const dupe=findDupe(m,name);
  if(dupe)return{m,dupe};
  const now=stamp();
  const item:ShoppingItem={id:uid(),name,quantity:input.quantity&&input.quantity>0?input.quantity:null,unit:input.unit||null,category:input.category||'',notes:input.notes||'',period:input.period,periodMonth:input.period==='current_month'?currentYM():null,frequentItemId:input.frequentItemId??null,createdAt:now,updatedAt:now};
  return{m:{...m,shoppingItems:[item,...m.shoppingItems]},dupe:null};
};
export const addFromFrequent=(m:MarketState,freqId:string):AddResult=>{
  const f=m.frequentItems.find(x=>x.id===freqId);
  if(!f)return{m,dupe:null};
  const dupe=findDupe(m,f.name);
  if(dupe)return{m,dupe};
  const now=stamp();
  const item:ShoppingItem={id:uid(),name:f.name,quantity:f.defaultQuantity,unit:f.defaultUnit,category:f.category,notes:'',period:'none',periodMonth:null,frequentItemId:f.id,createdAt:now,updatedAt:now};
  return{m:{...m,shoppingItems:[item,...m.shoppingItems]},dupe:null};
};
/** Em caso de duplicata, soma 1 à quantidade (ou define 1 quando ausente). */
export const bumpQuantity=(m:MarketState,id:string,by=1):MarketState=>({...m,shoppingItems:m.shoppingItems.map(i=>i.id===id?{...i,quantity:(i.quantity??0)+by,updatedAt:stamp()}:i)});
export const updateItem=(m:MarketState,id:string,patch:Partial<ShoppingItem>):MarketState=>({...m,shoppingItems:m.shoppingItems.map(i=>i.id===id?{...i,...patch,updatedAt:stamp()}:i)});
/** Ao mudar o período, o mês de referência é sempre o atual; ao remover o período, limpa o mês. */
export const setPeriod=(m:MarketState,id:string,period:MarketPeriod):MarketState=>updateItem(m,id,{period,periodMonth:period==='current_month'?currentYM():null});
export const removeItem=(m:MarketState,id:string):MarketState=>({...m,shoppingItems:m.shoppingItems.filter(i=>i.id!==id)});
/** Traz para o mês atual os itens "Este mês" marcados em meses anteriores (nada é apagado). */
export const bringMonthBacklog=(m:MarketState):MarketState=>{const ym=currentYM();return{...m,shoppingItems:m.shoppingItems.map(i=>i.period==='current_month'&&i.periodMonth!==ym?{...i,periodMonth:ym,updatedAt:stamp()}:i)}};

/** Compra: sai da lista ativa, entra no histórico com cópia dos dados. */
export const purchaseItem=(m:MarketState,id:string):MarketState=>{
  const it=m.shoppingItems.find(i=>i.id===id);if(!it)return m;
  const rec:PurchaseHistory={id:uid(),name:it.name,quantity:it.quantity,unit:it.unit,category:it.category,frequentItemId:it.frequentItemId,originalItemId:it.id,purchasedAt:nowIso()};
  return{...m,shoppingItems:m.shoppingItems.filter(i=>i.id!==id),purchaseHistory:[rec,...m.purchaseHistory]};
};

/* ---------- Itens frequentes ---------- */
export const addFrequent=(m:MarketState,input:{name:string;category:string;defaultQuantity:number|null;defaultUnit:string|null}):{m:MarketState;dupe:FrequentItem|null}=>{
  const name=input.name.trim().replace(/\s+/g,' ');
  if(!name)return{m,dupe:null};
  const dupe=findDupeFrequent(m,name);
  if(dupe)return{m,dupe};
  const f:FrequentItem={id:uid(),name,category:input.category||'',defaultQuantity:input.defaultQuantity&&input.defaultQuantity>0?input.defaultQuantity:null,defaultUnit:input.defaultUnit||null,createdAt:stamp(),updatedAt:stamp()};
  return{m:{...m,frequentItems:[f,...m.frequentItems]},dupe:null};
};
export const updateFrequent=(m:MarketState,id:string,patch:Partial<FrequentItem>):MarketState=>({...m,frequentItems:m.frequentItems.map(i=>i.id===id?{...i,...patch,updatedAt:stamp()}:i)});
export const removeFrequent=(m:MarketState,id:string):MarketState=>({...m,frequentItems:m.frequentItems.filter(i=>i.id!==id)});

/* ---------- Histórico ---------- */
export const removePurchase=(m:MarketState,id:string):MarketState=>({...m,purchaseHistory:m.purchaseHistory.filter(p=>p.id!==id)});
export const fmtDateTime=(iso:string)=>new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
