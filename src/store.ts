import {useSyncExternalStore} from 'react';import type {State} from './types';import {seed} from './data/seed';import {load,save} from './services/storage';
let state:State={...seed(),...(load()??{})};const ls=new Set<()=>void>();
export const set=(fn:(s:State)=>State)=>{state=fn(state);save(state);ls.forEach(l=>l())};
export const useStore=()=>useSyncExternalStore(f=>{ls.add(f);return()=>{ls.delete(f)}},()=>state);
export const resetDemo=()=>set(()=>seed());export const getState=()=>state;
export const uid=()=>Math.random().toString(36).slice(2,10);
