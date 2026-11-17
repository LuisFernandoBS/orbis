import {createClient} from '@supabase/supabase-js';

// Funções serverless da Vercel: credenciais privadas ficam em process.env e nunca vão para o navegador.
export default async function handler(req:any,res:any){
if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
const tok=String(req.headers.authorization||'').replace('Bearer ','');
const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!serviceRoleKey)return res.status(500).json({error:'Configuração do Supabase ausente no servidor.'});
const supabase=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:{user},error}=await supabase.auth.getUser(tok);
if(!tok||error||!user)return res.status(401).json({error:'Faça login para gerar trilhas.'});
const key=process.env.GEMINI_API_KEY;if(!key)return res.status(500).json({error:'GEMINI_API_KEY não configurada no servidor.'});
const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body??{};
const cut=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
const topic=cut(b.topic,150),level=cut(b.level,40),objective=cut(b.objective,300);
if(!topic)return res.status(400).json({error:'Informe o assunto.'});
const ctx=b.mode==='custom'?` O aluno está no nível "${level}" e quer: "${objective||'aprender bem o assunto'}". Adapte a trilha a isso.`:' Cubra dos fundamentos ao avançado.';
const prompt=`Crie uma trilha de estudos em português do Brasil sobre "${topic}".${ctx} Retorne de 4 a 7 metas em ordem de aprendizado, cada uma com 3 a 5 subtemas curtos e objetivos.`;
try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{goals:{type:'ARRAY',items:{type:'OBJECT',properties:{name:{type:'STRING'},subs:{type:'ARRAY',items:{type:'STRING'}}},required:['name','subs']}}},required:['goals']}}})});
if(!r.ok){const e:any=await r.json().catch(()=>null);return res.status(502).json({error:'Gemini: '+(e?.error?.message??r.status)})}
const j:any=await r.json();const t=JSON.parse(j.candidates[0].content.parts[0].text);if(!Array.isArray(t.goals))throw 0;return res.status(200).json(t)}
catch{return res.status(502).json({error:'Resposta da IA em formato inesperado. Tente novamente.'})}}
