import React from 'react';
import '../Library/Library.css';
export default function Accordion({ titles=['What is included?','Can I customize it?','How do I get started?'], descriptions=['Reusable components for your next project.','Adjust content and styles to match your brand.','Choose a component and add it to your page.'], style }) {
return <section className="fw-library" style={style}>{titles.map((title,i)=><details key={i}><summary>{title}</summary><p>{descriptions[i]||''}</p></details>)}</section>;
}
