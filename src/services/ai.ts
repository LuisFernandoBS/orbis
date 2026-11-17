const K='orbis:ai';export interface AiCfg{key:string;model:string}
export const getAi=():AiCfg=>{try{return{key:'',model:'gemini-2.5-flash',...JSON.parse(localStorage.getItem(K)||'{}')}}catch{return{key:'',model:'gemini-2.5-flash'}}};
export const setAi=(c:AiCfg)=>localStorage.setItem(K,JSON.stringify(c));
export interface Trail{goals:{name:string;subs:string[]}[]}
/** Chama o Gemini direto do navegador. Para produção, mova esta função para um backend (a chave não deve ficar no cliente). */
export async function generateTrail(p:{topic:string;mode:'auto'|'custom';level?:string;objective?:string}):Promise<Trail>{
const {key,model}=getAi();if(!key)throw new Error('Configure sua chave do Gemini em Configurações.');
const ctx=p.mode==='custom'?` O aluno está no nível "${p.level}" e quer: "${p.objective||'aprender bem o assunto'}". Adapte a trilha a isso.`:' Cubra dos fundamentos ao avançado.';
const prompt=`Crie uma trilha de estudos em português do Brasil sobre "${p.topic}".${ctx} Retorne de 4 a 7 metas em ordem de aprendizado, cada uma com 3 a 5 subtemas curtos e objetivos.`;
const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{goals:{type:'ARRAY',items:{type:'OBJECT',properties:{name:{type:'STRING'},subs:{type:'ARRAY',items:{type:'STRING'}}},required:['name','subs']}}},required:['goals']}}})});
if(!r.ok){const e=await r.json().catch(()=>null);throw new Error('Gemini: '+(e?.error?.message??r.status))}
const j=await r.json();try{const t:Trail=JSON.parse(j.candidates[0].content.parts[0].text);if(!Array.isArray(t.goals))throw 0;return t}catch{throw new Error('Resposta da IA em formato inesperado. Tente novamente.')}}
