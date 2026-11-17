import {createClient} from '@supabase/supabase-js';

export default async function handler(req:any,res:any){
if(req.method!=='GET'&&req.method!=='PUT')return res.status(405).json({error:'Método não permitido'});
const token=String(req.headers.authorization||'').replace('Bearer ','');
const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!serviceRoleKey)return res.status(500).json({error:'Configuração do Supabase ausente no servidor.'});
const supabase=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:{user},error}=await supabase.auth.getUser(token);
if(!token||error||!user)return res.status(401).json({error:'Sessão inválida ou expirada.'});

if(req.method==='GET'){
const {data,error:readError}=await supabase.from('orbis_state').select('data').eq('user_id',user.id).maybeSingle();
if(readError)return res.status(500).json({error:'Erro ao carregar dados da nuvem.'});
return res.status(200).json({data:data?.data??null});
}

const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body??{};
if(!body.data||typeof body.data!=='object')return res.status(400).json({error:'Dados inválidos.'});
const {error:writeError}=await supabase.from('orbis_state').upsert({
user_id:user.id,
data:body.data,
updated_at:new Date().toISOString()
},{onConflict:'user_id'});
if(writeError)return res.status(500).json({error:'Erro ao salvar dados na nuvem.'});
return res.status(200).json({ok:true});
}
