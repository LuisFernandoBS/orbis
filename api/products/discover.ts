import {createClient} from '@supabase/supabase-js';

export default async function handler(req:any,res:any){
if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
const tok=String(req.headers.authorization||'').replace('Bearer ','');
const url=process.env.SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!serviceRoleKey)return res.status(500).json({error:'Configuração do Supabase ausente no servidor.'});
const supabase=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:{user},error}=await supabase.auth.getUser(tok);
if(!tok||error||!user)return res.status(401).json({error:'Faça login para descobrir produtos.'});
const key=process.env.GEMINI_API_KEY;if(!key)return res.status(500).json({error:'GEMINI_API_KEY não configurada no servidor.'});
const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body??{};
const cut=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
const room=cut(b.room,80);
if(!room)return res.status(400).json({error:'Informe o nome do cômodo.'});
const count=Math.max(10,Math.min(25,typeof b.count==='number'?Math.round(b.count):18));
const existing=Array.isArray(b.existingProducts)?b.existingProducts.map((v:any)=>cut(v,80)).filter(Boolean).slice(0,150):[];
const avoid=Array.isArray(b.avoidNames)?b.avoidNames.map((v:any)=>cut(v,80)).filter(Boolean).slice(0,300):[];
const prompt=`Você é um assistente de compras práticas para casa.
Sugira ${count} produtos úteis e reais para o ambiente chamado "${room}".
Não seja planejador de decoração ou design de interiores. Sugira itens que resolvem necessidades práticas do cotidiano.
Use categorias dinâmicas adequadas ao ambiente. Não use uma lista fixa universal.
Evite repetir ou sugerir produtos muito semelhantes. Não sugira estes nomes já existentes ou apresentados nesta sessão: ${[...existing,...avoid].length?[...existing,...avoid].join('; '):'nenhum'}.
Para cada produto, escreva nome curto em português do Brasil, descrição breve de até 180 caracteres e um motivo prático curto.
Retorne somente JSON válido, em português do Brasil.`;
try{
const models=[model,'gemini-2.5-flash-lite','gemini-2.0-flash'].filter((v,i,a)=>v&&a.indexOf(v)===i);
const body=JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{
room:{type:'STRING'},categories:{type:'ARRAY',minItems:3,maxItems:7,items:{type:'OBJECT',properties:{name:{type:'STRING'},products:{type:'ARRAY',minItems:2,maxItems:8,items:{type:'OBJECT',properties:{name:{type:'STRING'},description:{type:'STRING'},reason:{type:'STRING'}},required:['name','description','reason']}}},required:['name','products']}}
},required:['room','categories']}}})
let j:any=null;
let lastError='';
for(const candidate of models){
const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent`,{
method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body
});
if(r.ok){j=await r.json();break}
const e:any=await r.json().catch(()=>null);
lastError=e?.error?.message??`Erro ${r.status}`;
const temporary=r.status===429||r.status===503||r.status===500;
if(!temporary)break;
}
if(!j)return res.status(502).json({error:lastError.includes('high demand')?'O Gemini está temporariamente com alta demanda. Tente novamente em alguns instantes.':'Gemini: '+(lastError||'indisponível no momento.')})
const text=j.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join('')||'';
const parsed=JSON.parse(text);
if(!Array.isArray(parsed.categories))throw new Error('categories');
const categories=parsed.categories.map((c:any)=>({name:String(c.name||'').trim().slice(0,60),products:Array.isArray(c.products)?c.products.map((p:any)=>({name:String(p.name||'').trim().slice(0,80),description:String(p.description||'').trim().slice(0,180),reason:String(p.reason||'').trim().slice(0,180)})).filter((p:any)=>p.name&&p.description).slice(0,8):[]})).filter((c:any)=>c.name&&c.products.length);
if(!categories.length)throw new Error('empty');
return res.status(200).json({room,categories});
}catch{return res.status(502).json({error:'Não foi possível interpretar a resposta da IA. Tente novamente.'})}}
