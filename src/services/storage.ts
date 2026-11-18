import type {State} from '../types';import {supabase} from './supabase';const K='orbis:v1';
// Cache local (offline/rápido) + APIs serverless como fonte da verdade.
export const load=():State|null=>{try{const s=localStorage.getItem(K);return s?JSON.parse(s):null}catch{return null}};
export const save=(d:State)=>{try{localStorage.setItem(K,JSON.stringify(d))}catch{}};
export const clearLocal=()=>{clearTimeout(t);try{localStorage.removeItem(K)}catch{}};
const fail=()=>window.dispatchEvent(new Event('orbis:sync-error'));
const token=async()=>{const {data:{session}}=await supabase.auth.getSession();return session?.access_token};
export const loadRemote=async():Promise<State|null>=>{
const accessToken=await token();if(!accessToken)return null;
const r=await fetch('/api/state',{headers:{Authorization:'Bearer '+accessToken}});const j=await r.json().catch(()=>null);
if(!r.ok)throw new Error(j?.error??'Erro ao carregar dados da nuvem.');
return (j?.data as State)??null;
};
export const saveRemote=async(d:State)=>{
const accessToken=await token();if(!accessToken)return;
const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+accessToken},body:JSON.stringify({data:d})});
if(!r.ok){const j=await r.json().catch(()=>null);throw new Error(j?.error??'Erro ao salvar dados na nuvem.')};
};
let t:ReturnType<typeof setTimeout>;export const queueRemote=(d:State)=>{clearTimeout(t);t=setTimeout(()=>{saveRemote(d).catch(fail)},800)};
