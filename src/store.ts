import {useSyncExternalStore} from 'react';import type {State,Prefs} from './types';import {seed} from './data/seed';import {load,save,queueRemote,saveRemote,loadRemote,clearLocal} from './services/storage';
const norm=(st?:Partial<State>|null):State=>{const base=seed();if(!st)return base;return{...base,...st,planning:{...base.planning,...(st.planning??{})},market:{...base.market,...(st.market??{})}}};
let state:State=norm({...seed(),...(load()??{})});const ls=new Set<()=>void>();
export const set=(fn:(s:State)=>State)=>{state=fn(state);if(state.prefs.autosave!==false){save(state);queueRemote(state)}ls.forEach(l=>l())};
export const useStore=()=>useSyncExternalStore(f=>{ls.add(f);return()=>{ls.delete(f)}},()=>state);
export const resetDemo=()=>set(()=>seed());export const getState=()=>state;
export const uid=()=>Math.random().toString(36).slice(2,10);

export const flush=()=>{save(state);return saveRemote(state)};
const notify=()=>ls.forEach(l=>l());
/** Após o login: usa os dados da nuvem; se ainda não existem, envia os dados locais (migração). */
export const hydrate=async()=>{const r=await loadRemote();if(r){state=norm(r);save(state);notify()}else await saveRemote(state)};
export const wipeLocal=()=>{clearLocal();state=seed();notify()};
export const usePrefs=()=>{const s=useStore();return{accent:'#8B5CF6',compact:false,anim:true,labels:true,notif:true,autosave:true,offerPreviews:true,name:'Usuário',email:'orbis@pessoal.com',...s.prefs} as Required<Prefs>};
