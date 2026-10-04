import React from 'react';
import './EventGrid.css';
export default function EventGrid({ items=[], emptyText='No events match your search.', onChange, style }) {
  return <div className="fw-event-grid" style={style}>{Array.isArray(items) && items.length ? items.map((event,index) => <article className="fw-event-card" key={event.id || index}>
    <div className={'fw-event-poster fw-event-poster-'+index%3}><span>{event.category}</span><strong>{event.poster || event.title}</strong><small>{event.date}</small><i aria-hidden="true"/></div>
    <div className="fw-event-copy"><span>{event.venue} · {event.city}</span><h3>{event.title}</h3><p>{event.description}</p><div><strong>{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(event.price)||0)}<small> / person</small></strong><button type="button" onClick={() => onChange?.({target:{value:event.id},detail:{record:event}})} aria-label={'Book '+event.title}>Book tickets ↗</button></div></div>
  </article>) : <p role="status">{emptyText}</p>}</div>;
}
