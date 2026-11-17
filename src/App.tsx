import {NavLink,Route,Routes,Navigate} from 'react-router-dom';import {useEffect,useState} from 'react';
import {LayoutDashboard,ShoppingCart,Wallet,Brain,Settings as Cfg,PanelLeftClose,PanelLeft,Orbit} from 'lucide-react';
import {useStore} from './store';import Dashboard from './pages/Dashboard';import Compras from './pages/Compras';import Despesas from './pages/Despesas';import Conhecimento from './pages/Conhecimento';import Neural from './pages/Neural';import Trilha from './pages/Trilha';import Biblioteca from './pages/Biblioteca';import Settings from './pages/Settings';
const nav=[{to:'/',l:'Dashboard',i:LayoutDashboard,g:''},{to:'/compras',l:'Compras',i:ShoppingCart,g:'Casa'},{to:'/despesas',l:'Despesas',i:Wallet,g:''},{to:'/conhecimento',l:'Conhecimento',i:Brain,g:'Conhecimento'},{to:'/config',l:'Configurações',i:Cfg,g:''}];
export default function App(){const {prefs}=useStore();const [col,setCol]=useState(false);
useEffect(()=>{document.documentElement.dataset.theme=prefs.theme},[prefs.theme]);
return <div className={'app'+(col?' col':'')}>
<aside className="side"><div className="brand"><span className="logo"><Orbit size={18}/></span><b>ORBIS</b><button className="ib" onClick={()=>setCol(!col)} aria-label="Recolher menu">{col?<PanelLeft size={18}/>:<PanelLeftClose size={18}/>}</button></div>
{nav.map(n=><div key={n.to}>{n.g==='Casa'&&<div className="grp">Casa</div>}<NavLink to={n.to} end={n.to==='/'} className="link"><n.i size={18}/><span>{n.l}</span></NavLink></div>)}</aside>
<main><Routes><Route path="/" element={<Dashboard/>}/><Route path="/compras" element={<Compras/>}/><Route path="/despesas" element={<Despesas/>}/><Route path="/conhecimento" element={<Conhecimento/>}/><Route path="/conhecimento/mapa" element={<Neural/>}/><Route path="/conhecimento/trilha" element={<Trilha/>}/><Route path="/conhecimento/biblioteca" element={<Biblioteca/>}/><Route path="/config" element={<Settings/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></main>
<nav className="bottom">{nav.map(n=><NavLink key={n.to} to={n.to} end={n.to==='/'} className="link"><n.i size={20}/><span>{n.l.slice(0,11)}</span></NavLink>)}</nav></div>}
