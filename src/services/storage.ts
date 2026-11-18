import type {State} from '../types';import {supabase} from './supabase';const K='orbis:v1';
// Cache local (offline/rápido) + Supabase como fonte da verdade (1 linha jsonb por usuário, protegida por RLS).
export const load=():State|null=>{try{const s=localStorage.getItem(K);return s?JSON.parse(s):null}catch{return null}};
export const save=(d:State)=>{try{localStorage.setItem(K,JSON.stringify(d))}catch{}};
export const clearLocal=()=>{clearTimeout(t);try{localStorage.removeItem(K)}catch{}};
const fail=()=>window.dispatchEvent(new Event('orbis:sync-error'));
export const loadRemote=async():Promise<State|null>=>{const {data,error}=await supabase.from('orbis_state').select('data').maybeSingle();if(error)throw error;return (data?.data as State)??null};
export const saveRemote=async(d:State)=>{const {data:{session}}=await supabase.auth.getSession();if(!session)return;
const {error}=await supabase.from('orbis_state').upsert({user_id:session.user.id,data:d,updated_at:new Date().toISOString()});if(error)fail()};
let t:ReturnType<typeof setTimeout>;export const queueRemote=(d:State)=>{clearTimeout(t);t=setTimeout(()=>{saveRemote(d).catch(fail)},800)};
