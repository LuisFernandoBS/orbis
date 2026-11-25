import {createClient} from '@supabase/supabase-js';

const allowedStoreHosts=['shopee.com.br','shopee.com','shopee.sg','shp.ee','shope.ee','mercadolivre.com.br','mercadolivre.com','mercadolibre.com','meli.la','amazon.com.br','amazon.com','amzn.to'];
const allowedImageHosts=['susercontent.com','mlstatic.com','media-amazon.com','ssl-images-amazon.com','images-amazon.com','amazon.com'];
const isAllowedHost=(host:string,domains:string[])=>domains.some(domain=>host===domain||host.endsWith('.'+domain));
const isStoreHost=(host:string)=>isAllowedHost(host,allowedStoreHosts);
const isImageHost=(host:string)=>isAllowedHost(host,allowedImageHosts);
const isPublicHost=(host:string)=>!(/^(localhost|.*\.local)$/i.test(host)||/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)||host==='::1'||host.startsWith('fc')||host.startsWith('fe80'));
const safeUrl=(value:string,store=false)=>{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!isPublicHost(u.hostname)||!(store?isStoreHost(u.hostname):isImageHost(u.hostname)))throw new Error('URL nao permitida');return u};

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
    if(typeof body.imageUrl==='string'){
      const sourceUrl=safeUrl(body.imageUrl);const imageController=new AbortController();const imageTimer=setTimeout(()=>imageController.abort(),8000);
      try{
        let response=await fetch(sourceUrl,{redirect:'manual',signal:imageController.signal});
        if(response.status>=300&&response.status<400){const location=response.headers.get('location');if(!location)return res.status(422).json({error:'Link da imagem indisponível.'});const redirected=safeUrl(new URL(location,sourceUrl).toString());response=await fetch(redirected,{redirect:'manual',signal:imageController.signal})}
        if(!response.ok)return res.status(422).json({error:'Nao foi possivel baixar essa imagem.'});const type=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();if(!['image/jpeg','image/png','image/webp'].includes(type))return res.status(415).json({error:'O link precisa apontar para uma imagem JPG, PNG ou WebP.'});
        const bytes=new Uint8Array(await response.arrayBuffer());if(!bytes.length||bytes.length>5_000_000)return res.status(413).json({error:'A imagem deve ter até 5 MB.'});const ext=type==='image/webp'?'webp':type==='image/png'?'png':'jpg';const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from('offer-images').upload(path,bytes,{contentType:type,upsert:false});if(uploadError)return res.status(500).json({error:'Não foi possível salvar a imagem no Storage.'});
        return res.status(200).json({imageUrl:supabase.storage.from('offer-images').getPublicUrl(path).data.publicUrl});
      }finally{clearTimeout(imageTimer)}
    }
    if(typeof body.url!=='string')return res.status(400).json({error:'Informe um link de marketplace suportado.'});
    let pageUrl=safeUrl(body.url,true);
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
    let page:Response;let redirects=0;
    while(true){page=await fetch(pageUrl,{redirect:'manual',signal:controller.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; OrbisOfferPreview/1.0)','Accept':'text/html,application/xhtml+xml'}});if(page.status<300||page.status>=400)break;const location=page.headers.get('location');if(!location||redirects++>=4)return res.status(422).json({error:'Link do marketplace indisponivel.'});pageUrl=safeUrl(new URL(location,pageUrl).toString(),true)}
    clearTimeout(timer);
    if(!page.ok)return res.status(422).json({error:'O marketplace nao disponibilizou os dados deste produto.'});
    const html=(await page.text()).slice(0,2_000_000);
    const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
    const attr=(tag:string,name:string)=>tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,'i'))?.slice(1).find(Boolean);
    const decode=(value:string)=>value.replace(/&amp;/gi,'&').replace(/&#x2f;/gi,'/').replace(/&#47;/g,'/').replace(/\\\//g,'/').replace(/\\u002f/gi,'/');
    const textValue=(value:string)=>value.replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim();
    const meta=(...names:string[])=>{for(const name of names){const tag=tags.find(t=>[attr(t,'property'),attr(t,'name'),attr(t,'itemprop')].some(v=>v?.toLowerCase()===name));const value=tag&&attr(tag,'content');if(value)return textValue(value)}return undefined};
    const parsePrice=(value:string|undefined):number|undefined=>{if(!value)return undefined;let normalized=value.replace(/[^\d.,-]/g,'');if(!normalized)return undefined;if(/,\d{1,2}$/.test(normalized))normalized=normalized.replace(/\./g,'').replace(',','.');else normalized=normalized.replace(/,/g,'');const price=Number(normalized);return Number.isFinite(price)&&price>0?price:undefined};
    const metaCurrency=meta('product:price:currency','og:price:currency')?.toUpperCase();const brazilStore=/\.(com\.br|br)$/.test(pageUrl.hostname)||['shopee.com.br','mercadolivre.com.br'].some(domain=>pageUrl.hostname.endsWith(domain));
    let productName=meta('og:title','twitter:title','product:name','name');let productPrice=(metaCurrency==='BRL'||(!metaCurrency&&brazilStore))?parsePrice(meta('product:price:amount','og:price:amount')):undefined;
    const isBrl=(currency?:string)=>currency?.toUpperCase()==='BRL'||(!currency&&brazilStore);
    const candidates:string[]=[];
    for(const tag of tags){const key=(attr(tag,'property')||attr(tag,'name')||attr(tag,'itemprop')||'').toLowerCase();if(['og:image','og:image:secure_url','twitter:image','image'].includes(key)){const value=attr(tag,'content');if(value)candidates.push(decode(value))}}
    for(const tag of html.match(/<link\b[^>]*>/gi)||[]){if((attr(tag,'rel')||'').toLowerCase().split(/\s+/).includes('image_src')){const value=attr(tag,'href');if(value)candidates.push(decode(value))}}
    const imageValue=(value:any):string[]=>Array.isArray(value)?value.flatMap(imageValue):typeof value==='string'?[decode(value)]:value&&typeof value==='object'?['url','contentUrl'].flatMap(key=>imageValue(value[key])):[];
    const visit=(value:any):string[]=>{if(Array.isArray(value))return value.flatMap(visit);if(!value||typeof value!=='object')return[];const type=String(value['@type']||'').toLowerCase();const found=type.includes('product')?imageValue(value.image):[];return [...found,...Object.entries(value).flatMap(([key,child])=>['mainImage','main_image','imageUrl','image_url','cover_image_url'].includes(key)?imageValue(child):visit(child))]};
    const findProduct=(value:any)=>{if(Array.isArray(value)){value.forEach(findProduct);return}if(!value||typeof value!=='object')return;const type=String(value['@type']||'').toLowerCase();if(type.includes('product')){if(!productName&&typeof value.name==='string')productName=textValue(value.name);const offers=Array.isArray(value.offers)?value.offers:[value.offers];for(const offer of offers){if(!offer||typeof offer!=='object'||productPrice)continue;const currency=offer.priceCurrency||value.priceCurrency;const price=offer.price??offer.priceSpecification?.price;if(isBrl(currency))productPrice=parsePrice(String(price??''))}}Object.values(value).forEach(findProduct)};
    for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const data=JSON.parse(match[1]);candidates.push(...visit(data));findProduct(data)}catch{}}
    for(const match of html.matchAll(/"(?:mainImage|main_image|imageUrl|image_url|cover_image_url)"\s*:\s*"((?:https?:\\?\/\\?\/)[^"]+)"/gi))candidates.push(decode(match[1]));
    const image=candidates.find(value=>{try{safeUrl(new URL(value,pageUrl).toString());return true}catch{return false}});
    if(!productName){const title=html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1];if(title)productName=textValue(title)}
    if(productName)productName=productName.replace(' | Amazon.com.br','').replace(' | Amazon','').replace(' | Mercado Livre','').replace(' | Shopee Brasil','').trim().slice(0,180);
    let storedImageUrl:string|undefined;
    if(image){const imageUrl=safeUrl(new URL(image,pageUrl).toString());const imageController=new AbortController();const imageTimer=setTimeout(()=>imageController.abort(),8000);try{
      let response=await fetch(imageUrl,{redirect:'manual',signal:imageController.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; OrbisOfferPreview/1.0)','Accept':'image/avif,image/webp,image/*,*/*;q=0.8','Referer':pageUrl.origin+'/'}});
      if(response.status>=300&&response.status<400){const loc=response.headers.get('location');if(!loc)throw new Error('redirect');const redirected=safeUrl(new URL(loc,imageUrl).toString());response=await fetch(redirected,{redirect:'manual',signal:imageController.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; OrbisOfferPreview/1.0)','Accept':'image/*,*/*;q=0.8','Referer':pageUrl.origin+'/'}})}
      if(!response.ok)throw new Error('image');const type=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();if(!['image/jpeg','image/png','image/webp'].includes(type))throw new Error('format');const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>5_000_000)throw new Error('size');const ext=type==='image/webp'?'webp':type==='image/png'?'png':'jpg';const path=user.id+'/'+crypto.randomUUID()+'.'+ext;const {error:uploadError}=await supabase.storage.from('offer-images').upload(path,bytes,{contentType:type,upsert:false});if(uploadError)throw uploadError;storedImageUrl=supabase.storage.from('offer-images').getPublicUrl(path).data.publicUrl;
    }catch{storedImageUrl=undefined}finally{clearTimeout(imageTimer)}}
    return res.status(200).json({imageUrl:storedImageUrl,productName,price:productPrice});
  }catch{return res.status(422).json({error:'Não foi possível obter a imagem. Você pode adicioná-la manualmente.'})}
}
