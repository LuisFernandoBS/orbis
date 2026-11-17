import type {Session, User} from '@supabase/supabase-js';

type AuthEvent='SIGNED_IN'|'SIGNED_OUT'|'TOKEN_REFRESHED';
type AuthError={message:string};
type AuthResult<T>={data:T;error:AuthError|null};
const SESSION_KEY='orbis:auth';
const listeners=new Set<(event:AuthEvent,session:Session|null)=>void>();
let refreshTimer:ReturnType<typeof setTimeout>|undefined;
let refreshInFlight:Promise<Session|null>|undefined;

const emit=(event:AuthEvent,session:Session|null)=>listeners.forEach(listener=>listener(event,session));
const readStoredSession=():Session|null=>{
try{const raw=localStorage.getItem(SESSION_KEY);return raw?JSON.parse(raw) as Session:null}catch{return null}
};
const storeSession=(session:Session|null,event:AuthEvent)=>{
clearTimeout(refreshTimer);
if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));else localStorage.removeItem(SESSION_KEY);
emit(event,session);
if(session?.expires_at)refreshTimer=setTimeout(()=>{refreshSession().catch(()=>{storeSession(null,'SIGNED_OUT')})},Math.max(0,session.expires_at*1000-Date.now()-60_000));
};
const request=async<T>(body:Record<string,string>):Promise<T>=>{
const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const result=await response.json().catch(()=>null);
if(!response.ok)throw new Error(result?.error??'Erro ao autenticar com o servidor.');
return result as T;
};
const refreshSession=():Promise<Session|null>=>{
if(refreshInFlight)return refreshInFlight;
const current=readStoredSession();
if(!current?.refresh_token)return Promise.resolve(null);
refreshInFlight=request<{session:Session|null}>({action:'refresh',refresh_token:current.refresh_token})
.then(({session})=>{storeSession(session,'TOKEN_REFRESHED');return session})
.catch(error=>{storeSession(null,'SIGNED_OUT');throw error})
.finally(()=>{refreshInFlight=undefined});
return refreshInFlight;
};
const currentSession=async():Promise<Session|null>=>{
const session=readStoredSession();
if(!session)return null;
if(session.expires_at&&session.expires_at*1000<Date.now()+60_000)return refreshSession();
return session;
};

export const supabase={auth:{
getSession:async():Promise<AuthResult<{session:Session|null}>>=>{
try{return{data:{session:await currentSession()},error:null}}catch(error){return{data:{session:null},error:{message:error instanceof Error?error.message:'Erro ao renovar a sessão.'}}}
},
onAuthStateChange:(callback:(event:AuthEvent,session:Session|null)=>void)=>{
listeners.add(callback);
return{data:{subscription:{unsubscribe:()=>{listeners.delete(callback)}}}};
},
signInWithPassword:async(credentials:{email:string;password:string}):Promise<AuthResult<{session:Session|null;user:User|null}>>=>{
try{
const result=await request<{session:Session|null;user:User|null}>({action:'signIn',email:credentials.email,password:credentials.password});
if(result.session)storeSession(result.session,'SIGNED_IN');
return{data:result,error:null};
}catch(error){return{data:{session:null,user:null},error:{message:error instanceof Error?error.message:'Erro ao entrar.'}}}
},
signUp:async(credentials:{email:string;password:string}):Promise<AuthResult<{session:Session|null;user:User|null}>>=>{
try{
const result=await request<{session:Session|null;user:User|null}>({action:'signUp',email:credentials.email,password:credentials.password});
if(result.session)storeSession(result.session,'SIGNED_IN');
return{data:result,error:null};
}catch(error){return{data:{session:null,user:null},error:{message:error instanceof Error?error.message:'Erro ao criar conta.'}}}
},
signOut:async():Promise<{error:AuthError|null}>=>{
const session=readStoredSession();
let error:AuthError|null=null;
try{if(session?.access_token)await request({action:'signOut',access_token:session.access_token})}
catch(reason){error={message:reason instanceof Error?reason.message:'Erro ao encerrar a sessão no servidor.'}}
storeSession(null,'SIGNED_OUT');
return{error};
}
}};
