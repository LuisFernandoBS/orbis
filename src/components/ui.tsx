import {createPortal} from 'react-dom';import {X} from 'lucide-react';import type {ReactNode,FormEvent} from 'react';
export const fd=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();return Object.fromEntries(new FormData(e.currentTarget)) as Record<string,string>};
export const Modal=({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode})=>createPortal(
<div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal" role="dialog" aria-modal><div className="mh"><h3>{title}</h3><button className="ib" onClick={onClose} aria-label="Fechar"><X size={18}/></button></div><div className="mb">{children}</div></div></div>,document.body);
export const Progress=({v}:{v:number})=><div className="bar"><i style={{width:v+'%'}}/></div>;
export const Stat=({icon,label,value,hint}:{icon:ReactNode;label:string;value:string|number;hint?:string})=><div className="card stat"><span className="ico">{icon}</span><b>{value}</b><span>{label}</span>{hint&&<small>{hint}</small>}</div>;
export const AddInline=({ph,onAdd}:{ph:string;onAdd:(v:string)=>void})=><form className="row" onSubmit={e=>{const form=e.currentTarget;const f=fd(e);if(f.v.trim())onAdd(f.v.trim());form.reset()}}><input name="v" placeholder={ph}/><button className="btn sm">Adicionar</button></form>;
export const Empty=({text}:{text:string})=><div className="empty">{text}</div>;
