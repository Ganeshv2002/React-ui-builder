import React from 'react';
import '../Library/Library.css';
const safeHref=value=>typeof value==='string'&&/^(https?:\/\/|#|\/(?!\/))/.test(value)?value:'#';
export default function Breadcrumbs({ labels=['Home','Projects','Current project'], links=['#/','#/projects'], style }) {
return <nav className="fw-library fw-library-breadcrumbs" style={style} aria-label="Breadcrumb"><ol>{labels.map((label,i)=><li key={i}>{i>0&&<span aria-hidden="true">/</span>}{i===labels.length-1?<span aria-current="page">{label}</span>:<a href={safeHref(links[i])}>{label}</a>}</li>)}</ol></nav>;
}
