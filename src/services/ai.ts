import {supabase} from './supabase';
export interface Trail{goals:{name:string;subs:string[]}[]}
export interface ProductSuggestion{ name:string; description:string; reason:string }
export interface ProductCategory{ name:string; products:ProductSuggestion[] }
export interface ProductDiscovery{ room:string; categories:ProductCategory[] }
/** Chama /api/trail (função serverless na Vercel), que usa a GEMINI_API_KEY do ambiente. */
export async function generateTrail(p:{topic:string;mode:'auto'|'custom';level?:string;objective?:string}):Promise<Trail>{
const {data:{session}}=await supabase.auth.getSession();
let r:Response;try{r=await fetch('/api/trail',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(session?.access_token??'')},body:JSON.stringify(p)})}catch{throw new Error('Sem conexão com o servidor.')}
const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.error??'Erro ao gerar a trilha ('+r.status+'). Em dev local, use "npx vercel dev".');return j as Trail}

/** Gera produtos práticos para um cômodo sem enviar a chave Gemini ao navegador. */
export async function discoverProducts(p:{room:string;roomId:string;existingProducts:string[];avoidNames:string[];count?:number}):Promise<ProductDiscovery>{
const {data:{session}}=await supabase.auth.getSession();
let r:Response;try{r=await fetch('/api/products/discover',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(session?.access_token??'')},body:JSON.stringify(p)})}catch{throw new Error('Sem conexão com o servidor.')}
const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.error??'Erro ao consultar a IA ('+r.status+'). Em dev local, use "npx vercel dev".');return j as ProductDiscovery}
