import {createClient} from '@supabase/supabase-js';

const allowedStoreHosts=['shopee.com.br','shopee.com','shopee.sg'];
const isStoreHost=(host:string)=>allowedStoreHosts.some(domain=>host===domain||host.endsWith('.'+domain));
const isPublicHost=(host:string)=>!(/^(localhost|.*\.local)$/i.test(host)||/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)||host==='::1'||host.startsWith('fc')||host.startsWith('fe80'));
const safeUrl=(value:string,store=false)=>{const u=new URL(value);if(u.protocol!=='https:'||!isPublicHost(u.hostname)||(store?!isStoreHost(u.hostname):!(isStoreHost(u.hostname)||u.hostname==='susercontent.com'||u.hostname.endsWith('.susercontent.com'))))throw new Error('URL não permitida');return u};

export default async function handler(req:any,res:any){
  if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const supabaseUrl=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabaseUrl||!key)return res.status(500).json({error:'Configuração do Supabase ausente.'});
  const supabase=createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await supabase.auth.getUser(token);
  if(!token||error||!user)return res.status(401).json({error:'Sessão inválida ou expirada.'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body??{};
    if(typeof body.imageDataUrl==='string'){
      if(body.imageDataUrl.length>4_100_000)return res.status(413).json({error:'A imagem deve ter até 3 MB.'});
      const match=body.imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
      if(!match)return res.status(400).json({error:'Formato de imagem inválido.'});
      const decoded=atob(match[2]);const bytes=Uint8Array.from(decoded,char=>char.charCodeAt(0));if(!bytes.length||bytes.length>5_000_000)return res.status(413).json({error:'A imagem deve ter até 5 MB.'});
      const type=match[1],ext=type==='image/webp'?'webp':type==='image/png'?'png':'jpg';const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
      const {error:uploadError}=await supabase.storage.from('offer-images').upload(path,bytes,{contentType:type,upsert:false});if(uploadError)return res.status(500).json({error:'Não foi possível salvar a imagem.'});
      return res.status(200).json({imageUrl:supabase.storage.from('offer-images').getPublicUrl(path).data.publicUrl});
    }
    if(typeof body.url!=='string')return res.status(400).json({error:'Informe um link da Shopee.'});
    let pageUrl=safeUrl(body.url,true);
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
    let page=await fetch(pageUrl,{redirect:'manual',signal:controller.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; OrbisOfferPreview/1.0)','Accept':'text/html,application/xhtml+xml'}});
    if(page.status>=300&&page.status<400){const location=page.headers.get('location');if(!location)return res.status(422).json({error:'Link da Shopee indisponível.'});pageUrl=safeUrl(new URL(location,pageUrl).toString(),true);page=await fetch(pageUrl,{redirect:'manual',signal:controller.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; OrbisOfferPreview/1.0)','Accept':'text/html,application/xhtml+xml'}})}
    if(!page.ok)return res.status(422).json({error:'A Shopee não disponibilizou os dados deste produto.'});
    const html=(await page.text()).slice(0,2_000_000);
    const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
    const attr=(tag:string,name:string)=>tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,'i'))?.slice(1).find(Boolean);
    const decode=(value:string)=>value.replace(/&amp;/gi,'&').replace(/&#x2f;/gi,'/').replace(/&#47;/g,'/').replace(/\\\//g,'/').replace(/\\u002f/gi,'/');
    const candidates:string[]=[];
    for(const tag of tags){const key=(attr(tag,'property')||attr(tag,'name')||attr(tag,'itemprop')||'').toLowerCase();if(['og:image','og:image:secure_url','twitter:image','image'].includes(key)){const value=attr(tag,'content');if(value)candidates.push(decode(value))}}
    for(const tag of html.match(/<link\b[^>]*>/gi)||[]){if((attr(tag,'rel')||'').toLowerCase().split(/\s+/).includes('image_src')){const value=attr(tag,'href');if(value)candidates.push(decode(value))}}
    const imageValue=(value:any):string[]=>Array.isArray(value)?value.flatMap(imageValue):typeof value==='string'?[decode(value)]:value&&typeof value==='object'?['url','contentUrl'].flatMap(key=>imageValue(value[key])):[];
    const visit=(value:any):string[]=>{if(Array.isArray(value))return value.flatMap(visit);if(!value||typeof value!=='object')return[];const type=String(value['@type']||'').toLowerCase();const found=type.includes('product')?imageValue(value.image):[];return [...found,...Object.entries(value).flatMap(([key,child])=>['mainImage','main_image','imageUrl','image_url','cover_image_url'].includes(key)?imageValue(child):visit(child))]};
    for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{candidates.push(...visit(JSON.parse(match[1])))}catch{}}
    for(const match of html.matchAll(/"(?:mainImage|main_image|imageUrl|image_url|cover_image_url)"\s*:\s*"((?:https?:\\?\/\\?\/)[^"]+)"/gi))candidates.push(decode(match[1]));
    const image=candidates.find(value=>{try{safeUrl(new URL(value,pageUrl).toString());return true}catch{return false}});
    if(!image)return res.status(404).json({error:'Não foi possível localizar a imagem. Você pode adicioná-la manualmente.'});
    const imageUrl=safeUrl(new URL(image,pageUrl).toString());
    const imageController=new AbortController();const imageTimer=setTimeout(()=>imageController.abort(),8000);
    try{
      const response=await fetch(imageUrl,{redirect:'manual',signal:imageController.signal});
      if(response.status>=300&&response.status<400){const loc=response.headers.get('location');if(!loc)throw new Error('redirection');const redirected=safeUrl(new URL(loc,imageUrl).toString());const second=await fetch(redirected,{redirect:'manual',signal:imageController.signal});if(!second.ok)throw new Error('image');const type=second.headers.get('content-type')||'';if(!type.startsWith('image/'))throw new Error('format');const bytes=new Uint8Array(await second.arrayBuffer());if(bytes.length>5_000_000)throw new Error('size');const ext=type.includes('webp')?'webp':type.includes('png')?'png':'jpg';const path=`${user.id}/${crypto.randomUUID()}.${ext}`;const {error:uploadError}=await supabase.storage.from('offer-images').upload(path,bytes,{contentType:type,upsert:false});if(uploadError)throw uploadError;return res.status(200).json({imageUrl:supabase.storage.from('offer-images').getPublicUrl(path).data.publicUrl})}
      if(!response.ok)throw new Error('image');const type=response.headers.get('content-type')||'';if(!type.startsWith('image/'))throw new Error('format');const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>5_000_000)throw new Error('size');const ext=type.includes('webp')?'webp':type.includes('png')?'png':'jpg';const path=`${user.id}/${crypto.randomUUID()}.${ext}`;const {error:uploadError}=await supabase.storage.from('offer-images').upload(path,bytes,{contentType:type,upsert:false});if(uploadError)throw uploadError;return res.status(200).json({imageUrl:supabase.storage.from('offer-images').getPublicUrl(path).data.publicUrl});
    }finally{clearTimeout(imageTimer)}
  }catch{return res.status(422).json({error:'Não foi possível obter a imagem. Você pode adicioná-la manualmente.'})}
}
