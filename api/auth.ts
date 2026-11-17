import {createClient} from '@supabase/supabase-js';

export default async function handler(req:any,res:any){
if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
const url=process.env.SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!serviceRoleKey)return res.status(500).json({error:'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.'});
const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body??{};
const supabase=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});

if(body.action==='signUp'||body.action==='signIn'){
if(typeof body.email!=='string'||typeof body.password!=='string')return res.status(400).json({error:'Informe email e senha.'});
const result=body.action==='signUp'
?await supabase.auth.signUp({email:body.email,password:body.password})
:await supabase.auth.signInWithPassword({email:body.email,password:body.password});
if(result.error)return res.status(400).json({error:result.error.message});
return res.status(200).json({session:result.data.session,user:result.data.user});
}

if(body.action==='refresh'){
if(typeof body.refresh_token!=='string'||!body.refresh_token)return res.status(400).json({error:'Token de renovação ausente.'});
const {data,error}=await supabase.auth.refreshSession({refresh_token:body.refresh_token});
if(error)return res.status(401).json({error:'Sua sessão expirou. Entre novamente.'});
return res.status(200).json({session:data.session});
}

if(body.action==='signOut'){
if(typeof body.access_token!=='string'||!body.access_token)return res.status(400).json({error:'Token de sessão ausente.'});
const {error}=await supabase.auth.signOut(body.access_token);
if(error)return res.status(400).json({error:error.message});
return res.status(200).json({ok:true});
}

return res.status(400).json({error:'Ação de autenticação inválida.'});
}
