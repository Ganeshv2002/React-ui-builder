import React, { useState } from 'react';
import '../Library/Library.css';
export default function Pagination({ totalPages=10, initialPage=1, onChange, style }) {
const total=Math.max(1,Math.floor(Number(totalPages)||1)); const [page,setPage]=useState(initialPage); const current=Math.min(total,Math.max(1,Number(page)||1));
const change=next=>{setPage(next);onChange?.({target:{value:next}});};
const first=Math.max(1,Math.min(current-2,total-4)); const pages=Array.from({length:Math.min(5,total)},(_,i)=>first+i);
return <nav className="fw-library fw-library-pagination" style={style} aria-label="Pagination"><button type="button" disabled={current===1} onClick={()=>change(current-1)}>Previous</button>{pages.map(n=><button key={n} type="button" aria-label={'Page '+n} aria-current={n===current?'page':undefined} onClick={()=>change(n)}>{n}</button>)}<button type="button" disabled={current===total} onClick={()=>change(current+1)}>Next</button><span aria-live="polite">{current} of {total}</span></nav>;
}
