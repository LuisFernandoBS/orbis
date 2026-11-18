import {useState} from 'react';import {createPortal} from 'react-dom';import {X} from 'lucide-react';import type {ReactNode,FormEvent} from 'react';
export const fd=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();return Object.fromEntries(new FormData(e.currentTarget)) as Record<string,string>};
export const Modal=({title,onClose,children,full,footer}:{title:string;onClose:()=>void;children:ReactNode;full?:boolean;footer?:ReactNode})=>createPortal(
<div className={'overlay'+(full?' ofull':'')} onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className={'modal'+(full?' full':'')} role="dialog" aria-modal><div className="mh"><h3>{title}</h3><button className="ib" onClick={onClose} aria-label="Fechar"><X size={18}/></button></div><div className="mb">{children}</div>{footer&&<div className="mf">{footer}</div>}</div></div>,document.body);
export const Progress=({v}:{v:number})=><div className="bar"><i style={{width:v+'%'}}/></div>;
export const Stat=({icon,label,value,hint}:{icon:ReactNode;label:string;value:string|number;hint?:string})=><div className="card stat"><span className="ico">{icon}</span><b>{value}</b><span>{label}</span>{hint&&<small>{hint}</small>}</div>;
export const AddInline=({ph,onAdd}:{ph:string;onAdd:(v:string)=>void})=><form className="row" onSubmit={e=>{const form=e.currentTarget;const f=fd(e);if(f.v.trim())onAdd(f.v.trim());form.reset()}}><input name="v" placeholder={ph}/><button className="btn sm">Adicionar</button></form>;
export const Empty=({text}:{text:string})=><div className="empty">{text}</div>;
import {getState} from '../store';
export const toast=(m:string)=>{if(getState().prefs.notif===false)return;const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.append(d);setTimeout(()=>d.remove(),2200)};
/** Campo de valor com máscara R$ (digita-se os centavos). Envia o número no FormData via input oculto. */
export function Money({name,defaultValue,required}:{name:string;defaultValue?:number|string;required?:boolean}){
const [c,setC]=useState(Math.round((+(defaultValue??0)||0)*100));
return <><input inputMode="numeric" autoComplete="off" placeholder="0,00" required={required} value={c?(c/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):''} onChange={e=>setC(parseInt(e.target.value.replace(/\D/g,'').slice(0,12)||'0',10))}/><input type="hidden" name={name} value={c/100}/></>}
