import React from 'react';
import '../Library/Library.css';
import { readPath } from '../../runtime/engine.js';

export default function DataTable({ caption='Team members', columns=['Name','Role','Status'],
  fieldPaths=[], rows=['Alex Morgan | Designer | Active','Jordan Lee | Developer | Active','Taylor Kim | Product manager | Away'],
  striped=true, rowKey='id', loading=false, error='', emptyText='No records to display.', style }) {
  let records=rows, issue=error;
  if (typeof records==='string') {
    try { records=JSON.parse(records); } catch { records=[]; issue='Table rows must be a JSON array of records.'; }
  }
  if (records && !Array.isArray(records) && typeof records==='object') records=[records];
  if (!Array.isArray(records)) records=[];
  const headers=Array.isArray(columns)?columns:[];
  const cell=(row,index) => {
    let value;
    if (typeof row==='string') value=row.split('|')[index]?.trim();
    else if (Array.isArray(row)) value=row[index];
    else {
      const key=fieldPaths[index] || (typeof headers[index]==='object'?headers[index].field:headers[index]);
      try { value=readPath(row,key || ''); } catch { value=undefined; }
    }
    return value==null?'—':typeof value==='object'?JSON.stringify(value):String(value);
  };
  return <div className="fw-library fw-library-table" style={style} aria-busy={loading}>
    {issue && <p role="alert">{issue}</p>}
    <table data-striped={striped}><caption>{caption}</caption>
      <thead><tr>{headers.map((column,i)=><th key={i} scope="col">{typeof column==='object'?column.label:column}</th>)}</tr></thead>
      <tbody>{loading?<tr><td colSpan={Math.max(1,headers.length)} role="status">Loading records…</td></tr>:
        records.length?records.map((row,i)=><tr key={typeof row==='object' && row?.[rowKey]!=null?row[rowKey]:i}>{headers.map((_,j)=><td key={j}>{cell(row,j)}</td>)}</tr>):
        <tr><td colSpan={Math.max(1,headers.length)}>{emptyText}</td></tr>}</tbody>
    </table>
  </div>;
}
