import React from 'react';
import '../Library/Library.css';
export default function PriceSummary({ unitPrice=1499, quantity=1, currency='INR', style }) {
  const count=Math.max(0,Number(quantity)||0);
  const price=Math.max(0,Number(unitPrice)||0);
  const code=/^[A-Z]{3}$/.test(currency)?currency:'INR';
  const money=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:code,maximumFractionDigits:2}).format(value);
  return <section className="fw-library" aria-label="Price summary" style={{background:'var(--bg-surface,#f6f4fb)',padding:18,borderRadius:12,...style}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,fontSize:13}}><span>{count} × {money(price)}</span><span>{money(count*price)}</span></div>
    <hr style={{border:0,borderTop:'1px solid var(--border,#e5e1ee)',margin:'14px 0'}}/>
    <div style={{display:'flex',justifyContent:'space-between',fontWeight:700}}><span>Total</span><output aria-live="polite">{money(count*price)}</output></div>
  </section>;
}
