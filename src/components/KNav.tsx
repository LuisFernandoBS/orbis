import {NavLink} from 'react-router-dom';
export default function KNav(){return <div className="tabs">{[['/conhecimento','Assuntos'],['/conhecimento/mapa','Mapa neural'],['/conhecimento/trilha','Trilha com IA'],['/conhecimento/biblioteca','Biblioteca']].map(([to,l])=><NavLink key={to} to={to} end className="tab">{l}</NavLink>)}</div>}
