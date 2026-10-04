import React from 'react';
import '../Library/Library.css';
export default function Skeleton({ lines=3, lineHeight=16, label='Loading content', style }) {
return <div className="fw-library fw-library-skeleton" role="status" aria-label={label} style={style}>{Array.from({length:Math.max(1,Math.min(20,Number(lines)||3))},(_,i)=><span aria-hidden="true" key={i} style={{height:Math.max(4,Number(lineHeight)||16),width:i===Number(lines)-1?'65%':'100%'}}/>)}</div>;
}
