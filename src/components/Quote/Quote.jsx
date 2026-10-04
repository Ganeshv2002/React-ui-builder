import React from 'react';
import '../Library/Library.css';
export default function Quote({ text='Great products begin with thoughtful design.', author='Alex Morgan', attribution='Product designer', style }) {
return <blockquote className="fw-library fw-library-quote" style={style}><p>{text}</p><footer><cite>{author}{attribution&&' — '+attribution}</cite></footer></blockquote>;
}
