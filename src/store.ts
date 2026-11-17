import {useSyncExternalStore} from 'react';import type {State,Prefs} from './types';import {seed} from './data/seed';import {load,save} from './services/storage';
let state:State={...seed(),...(load()??{})};const ls=new Set<()=>void>();
export const set=(fn:(s:State)=>State)=>{state=fn(state);if(state.prefs.autosave!==false)save(state);ls.forEach(l=>l())};
export const useStore=()=>useSyncExternalStore(f=>{ls.add(f);return()=>{ls.delete(f)}},()=>state);
export const resetDemo=()=>set(()=>seed());export const getState=()=>state;
export const uid=()=>Math.random().toString(36).slice(2,10);

export const flush=()=>save(state);
export const usePrefs=()=>{const s=useStore();return{accent:'#8B5CF6',compact:false,anim:true,labels:true,notif:true,autosave:true,name:'Usuário',email:'orbis@pessoal.com',...s.prefs} as Required<Prefs>};
