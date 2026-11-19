import {useState} from 'react';
import {Search,Clock,Trash2,Eye} from 'lucide-react';
import {useStore,set} from '../../store';
import {Modal,Confirm,toast} from '../../components/ui';
import {purchasesThisMonth,purchasesLast30Days,removePurchase,fmtDateTime,fmtQty} from '../../services/market';
import {catStyle} from './shared';

type PeriodFilter='all'|'month'|'30d';

export default function MarketHistory(){
  const s=useStore();
  const m=s.market;
  const [q,setQ]=useState('');
  const [period,setPeriod]=useState<PeriodFilter>('all');
  const [detailItem,setDetailItem]=useState<string|null>(null);
  const [delId,setDelId]=useState<string|null>(null);

  let filtered=m.purchaseHistory;
  if(period==='month') filtered=purchasesThisMonth(m);
  else if(period==='30d') filtered=purchasesLast30Days(m);

  if(q){
    const query=q.toLowerCase();
    filtered=filtered.filter(i=>i.name.toLowerCase().includes(query));
  }

  // Group items by local date string (YYYY-MM-DD)
  const groups:Record<string,typeof filtered>={};
  for(const item of filtered){
    const d=new Date(item.purchasedAt);
    const dayKey=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if(!groups[dayKey]) groups[dayKey]=[];
    groups[dayKey].push(item);
  }
  const sortedDays=Object.keys(groups).sort((a,b)=>b.localeCompare(a));

  const todayStr=new Date();
  const todayKey=`${todayStr.getFullYear()}-${String(todayStr.getMonth()+1).padStart(2,'0')}-${String(todayStr.getDate()).padStart(2,'0')}`;
  const yesterdayStr=new Date(Date.now()-864e5);
  const yesterdayKey=`${yesterdayStr.getFullYear()}-${String(yesterdayStr.getMonth()+1).padStart(2,'0')}-${String(yesterdayStr.getDate()).padStart(2,'0')}`;

  const formatDayHeader=(dayKey:string)=>{
    if(dayKey===todayKey) return 'Hoje';
    if(dayKey===yesterdayKey) return 'Ontem';
    const [y,m,d]=dayKey.split('-');
    return `${d}/${m}/${y}`;
  };

  const selectedDetail=detailItem?m.purchaseHistory.find(p=>p.id===detailItem):null;
  const targetDelete=delId?m.purchaseHistory.find(p=>p.id===delId):null;

  return <>
    <div className="phead">
      <div>
        <h1>Histórico de Compras</h1>
        <p className="sub">Registro de todos os produtos adquiridos</p>
      </div>
    </div>

    <div className="row srch" style={{flexWrap:'wrap',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:200}}>
        <Search size={16}/>
        <input placeholder="Buscar no histórico…" value={q} onChange={e=>setQ(e.target.value)}/>
      </div>
      <div className="tabs">
        <button className={'tab'+(period==='all'?' on':'')} onClick={()=>setPeriod('all')}>Todas</button>
        <button className={'tab'+(period==='month'?' on':'')} onClick={()=>setPeriod('month')}>Este mês</button>
        <button className={'tab'+(period==='30d'?' on':'')} onClick={()=>setPeriod('30d')}>Últimos 30 dias</button>
      </div>
    </div>

    {sortedDays.length?(
      <div style={{display:'grid',gap:16}}>
        {sortedDays.map(day=>(
          <div key={day}>
            <h3 style={{margin:'0 0 8px 4px',fontSize:'0.95rem',color:'var(--lav)',display:'flex',alignItems:'center',gap:8}}>
              <Clock size={14}/>{formatDayHeader(day)}
            </h3>
            <div style={{display:'grid',gap:8}}>
              {groups[day].map(item=>{
                const qtyStr=fmtQty(item.quantity,item.unit);
                return <div key={item.id} className="card between" style={{padding:'10px 14px',margin:0}}>
                  <div style={{display:'grid',gap:4,flex:1,minWidth:0}}>
                    <div className="row" style={{margin:0,gap:8}}>
                      <b>{item.name}</b>
                      {qtyStr&&<small className="m-qty">· {qtyStr}</small>}
                      {item.category&&<span className="badge cat" style={catStyle(item.category)}>{item.category}</span>}
                    </div>
                    <small style={{color:'var(--mut)',fontSize:'0.8rem'}}>{fmtDateTime(item.purchasedAt)}</small>
                  </div>
                  <div className="row" style={{margin:0}}>
                    <button className="ib" title="Ver detalhes" onClick={()=>setDetailItem(item.id)}><Eye size={16}/></button>
                    <button className="ib danger" title="Excluir registro" onClick={()=>setDelId(item.id)}><Trash2 size={16}/></button>
                  </div>
                </div>;
              })}
            </div>
          </div>
        ))}
      </div>
    ):(
      <div className="empty">
        <p>{q||period!=='all'?'Nenhuma compra encontrada com esses filtros.':'Nenhuma compra registrada no histórico.'}</p>
      </div>
    )}

    {selectedDetail&&<Modal title="Detalhes da compra" onClose={()=>setDetailItem(null)}>
      <div style={{display:'grid',gap:12}}>
        <div>
          <label style={{color:'var(--mut)',fontSize:'0.8rem'}}>Produto</label>
          <p style={{margin:0,fontSize:'1.1rem',fontWeight:600}}>{selectedDetail.name}</p>
        </div>
        {fmtQty(selectedDetail.quantity,selectedDetail.unit)&&<div>
          <label style={{color:'var(--mut)',fontSize:'0.8rem'}}>Quantidade / Unidade</label>
          <p style={{margin:0}}>{fmtQty(selectedDetail.quantity,selectedDetail.unit)}</p>
        </div>}
        {selectedDetail.category&&<div>
          <label style={{color:'var(--mut)',fontSize:'0.8rem'}}>Categoria</label>
          <p style={{margin:0}}><span className="badge cat" style={catStyle(selectedDetail.category)}>{selectedDetail.category}</span></p>
        </div>}
        <div>
          <label style={{color:'var(--mut)',fontSize:'0.8rem'}}>Data e hora da compra</label>
          <p style={{margin:0}}>{fmtDateTime(selectedDetail.purchasedAt)}</p>
        </div>
        <div className="row end" style={{margin:0,marginTop:8}}>
          <button className="btn" onClick={()=>setDetailItem(null)}>Fechar</button>
        </div>
      </div>
    </Modal>}

    {targetDelete&&<Confirm title="Excluir registro" msg={<>Deseja remover o registro de compra de <b>{targetDelete.name}</b>?</>} confirmLabel="Excluir" onCancel={()=>setDelId(null)} onConfirm={()=>{set(st=>({...st,market:removePurchase(st.market,targetDelete.id)}));toast('Registro excluído');setDelId(null)}}/>}
  </>;
}
