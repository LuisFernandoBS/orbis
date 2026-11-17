import type {State} from '../types';
const d=(ago:number)=>{const t=new Date();t.setDate(t.getDate()-ago);return t.toISOString().slice(0,10)};
const o=(id:string,name:string,features:string,price:number,store:string,sel=true)=>({id,name,features,price,store,url:'',used:false,date:d(5),selected:sel});
export const seed=():State=>({prefs:{theme:'dark'},
materials:[{id:'m1',name:'RAG from scratch',url:'https://www.youtube.com/results?search_query=rag+from+scratch',type:'video',status:'estudado',links:['a','b']},{id:'m2',name:'Effective Java — Joshua Bloch',url:'https://www.google.com/search?q=effective+java+pdf',type:'pdf',status:'estudando',links:['s2']},{id:'m3',name:'LangChain GitHub',url:'https://github.com/langchain-ai/langchain',type:'github',status:'pendente',links:['g1','s1']}],
rooms:[{id:'sala',name:'Sala'},{id:'quarto',name:'Quarto'},{id:'cozinha',name:'Cozinha'},{id:'banheiro',name:'Banheiro'}],
items:[
{id:'i1',name:'Smart TV 55"',desc:'Para a sala de estar',qty:1,priority:'alta',status:'pesquisando',roomId:'sala',offers:[o('o1','Samsung QLED 55" Q70C','4K, HDR, 120Hz',2899,'Magazine Luiza'),o('o2','LG OLED 55" C3','4K, 120Hz, webOS',3499,'Americanas'),o('o3','TCL 55" P755','4K, QLED, Google TV',1899,'Shopee',false)]},
{id:'i2',name:'Sofá 3 Lugares',desc:'Retrátil e reclinável',qty:1,priority:'alta',status:'desejado',roomId:'sala',offers:[o('o4','Sofá Retrátil Tecido','3 lugares',1525,'Mobly')]},
{id:'i3',name:'Mesa de Centro',desc:'',qty:1,priority:'media',status:'desejado',roomId:'sala',offers:[]},
{id:'i4',name:'Guarda-roupa',desc:'',qty:1,priority:'alta',status:'pesquisando',roomId:'quarto',offers:[o('o5','Guarda-roupa 6 portas','',1825,'Casas Bahia')]},
{id:'i5',name:'Cama Box Casal',desc:'',qty:1,priority:'alta',status:'comprado',roomId:'quarto',offers:[],purchase:{price:1620,store:'Ortobom',date:d(11),notes:'Desconto de 10%'}},
{id:'i6',name:'Geladeira Frost Free',desc:'',qty:1,priority:'alta',status:'comprado',roomId:'cozinha',offers:[],purchase:{price:2890,store:'Magazine Luiza',date:d(40),notes:'Black Friday'}},
{id:'i7',name:'Notebook Gamer',desc:'RTX 4060, 16GB',qty:1,priority:'media',status:'pesquisando',roomId:null,offers:[o('o6','Notebook RTX 4060','i7, 16GB',5249,'Kabum')]}],
expenses:[
{id:'e1',name:'Aluguel',value:2800,category:'Moradia',kind:'fixa',date:d(120),desc:'',rec:'monthly'},
{id:'e2',name:'Condomínio',value:450,category:'Moradia',kind:'fixa',date:d(120),desc:'',rec:'monthly'},
{id:'e3',name:'Internet',value:110,category:'Utilities',kind:'fixa',date:d(120),desc:'',rec:'monthly'},
{id:'e4',name:'Mercado',value:420,category:'Alimentação',kind:'variavel',date:d(7),desc:'',rec:'weekly'},
{id:'e5',name:'Cama Box',value:1620,category:'Móveis',kind:'eventual',date:d(11),desc:'',rec:'none'}],
subjects:[
{id:'s1',name:'Inteligência Artificial',goals:[{id:'g1',name:'RAG',done:false,subs:[{id:'a',name:'Embeddings',done:true},{id:'b',name:'Vector Databases',done:true},{id:'c',name:'Chunking',done:false},{id:'d',name:'Retrieval e Reranking',done:false}]},{id:'g2',name:'LLMs',done:false,subs:[]}]},
{id:'s2',name:'Java e Spring Boot',goals:[{id:'g3',name:'Spring Core',done:false,subs:[{id:'e',name:'Injeção de dependência',done:true},{id:'f',name:'Spring Data',done:false}]}]},
{id:'s3',name:'AWS',goals:[{id:'g4',name:'Fundamentos',done:true,subs:[]}]}]});
