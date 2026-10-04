import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Runtime from '../Runtime';
import { registry } from '../registry';
import { createProject, parseProject } from '../project';
import { runActions, resolveValue } from '../engine';
import seatwave from '../../demos/seatwave.json';
import { generateConfigApp } from '../../utils/configAppGenerator';
import Modal from '../../components/Modal/Modal';
import Drawer from '../../components/Drawer/Drawer';

afterEach(()=>vi.restoreAllMocks());
const formProject=()=>createProject([{id:'home',name:'Home',path:'/',logic:{
  state:{},resources:{save:{url:'/save',method:'POST'}},
  actions:{save:[{type:'request',resource:'save'},{type:'markClean',formId:'details'}]}
},layout:[
  {id:'form',type:'form',props:{trackDirty:true,formId:'details'},events:{submit:['save']},children:[
    {id:'name',type:'input',props:{label:'Name',name:'name',value:'Alex'}},
    {id:'save',type:'button',props:{children:'Save',type:'submit'}}
  ]},
  {id:'next',type:'navigationLink',props:{children:'Next page',targetPageId:'next'}}
]},{id:'next',name:'Next',path:'/next',layout:[{id:'done',type:'text',props:{children:'Destination'}}]}]);
describe('booking runtime capabilities',()=>{
  it('completes the demo login, dirty drawer, reservation modal and API-backed tickets flow',async()=>{
    HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
    HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
    const events=seatwave.pages[1].logic.state.events.items;
    let reservation;
    const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async(url,options)=>{
      expect(options.credentials).toBe('include');
      const path=new URL(url).pathname;
      let data;
      if(path==='/auth/login')data={user:{name:'Alex'}};
      else if(path==='/events')data={items:events};
      else if(path==='/bookings'&&options.method==='POST'){
        const body=JSON.parse(options.body);
        expect(body).toMatchObject({eventId:'midnight-sessions',quantity:'2',attendee:'Alex Demo'});
        reservation={id:'SW-DEMO123',event:{title:'Midnight Sessions',date:'24 OCT'},quantity:2,totalLabel:'₹2,998',status:'Confirmed'};
        data=reservation;
      }else if(path==='/bookings')data={items:[reservation]};
      else throw new Error('Unexpected API path '+path);
      return {ok:true,status:200,json:async()=>data};
    });
    render(<Runtime project={parseProject(seatwave)} registry={registry} initialPageId="login" onNavigate={()=>{}}/>);
    fireEvent.click(screen.getByRole('button',{name:'Sign in →'}));
    fireEvent.click(await screen.findByRole('button',{name:'Book Midnight Sessions'}));
    fireEvent.change(screen.getByRole('combobox'),{target:{value:'2'}});
    fireEvent.change(screen.getByLabelText(/Attendee name/),{target:{value:'Alex Demo'}});
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Close Make it a plan.'}));
    fireEvent.click(await screen.findByRole('button',{name:'Keep editing'}));
    fireEvent.click(screen.getByRole('button',{name:'Confirm booking →'}));
    expect(await screen.findByText('SW-DEMO123')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'View my tickets →'}));
    expect(await screen.findByRole('cell',{name:'SW-DEMO123'})).toBeTruthy();
    expect(screen.getByRole('cell',{name:'₹2,998'})).toBeTruthy();
    expect(fetch.mock.calls.filter(([url,options])=>url.endsWith('/bookings')&&options.method==='POST')).toHaveLength(1);
  });
  it('tracks edits, reversions, rejected navigation and successful saves',async()=>{
    vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,status:200,json:async()=>({ok:true})});
    const navigate=vi.fn();
    render(<Runtime project={formProject()} registry={registry} initialPageId="home" onNavigate={navigate}/>);
    fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Jamie'}});
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.click(screen.getByRole('link',{name:'Next page'}));
    expect(await screen.findByRole('dialog',{name:'Leave without saving?'})).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Keep editing'}));
    expect(navigate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Alex'}});
    expect(screen.getByText('All changes saved')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Jamie'}});
    fireEvent.click(screen.getByRole('button',{name:'Save'}));
    await waitFor(()=>expect(screen.getByText('All changes saved')).toBeTruthy());
    fireEvent.click(screen.getByRole('link',{name:'Next page'}));
    await waitFor(()=>expect(navigate).toHaveBeenCalledWith('next'));
  });
  it('keeps dirty state when saving fails',async()=>{
    vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:false,status:409,json:async()=>({error:{message:'Sold out'}})});
    render(<Runtime project={formProject()} registry={registry} initialPageId="home" onNavigate={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Jamie'}});
    fireEvent.click(screen.getByRole('button',{name:'Save'}));
    expect(await screen.findByText('Sold out')).toBeTruthy();
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
  });
  it('renders API record fields and live JSON entered in a form field',()=>{
    const project=createProject([{id:'home',name:'Home',path:'/',layout:[
      {id:'source',type:'textarea',props:{label:'Records',name:'records',value:'[{"guest":{"name":"Alex"},"tickets":2}]'}},
      {id:'table',type:'dataTable',props:{columns:['Guest','Tickets'],fieldPaths:['guest.name','tickets']},bindings:{rows:{$fields:'records'}}}
    ]}]);
    render(<Runtime project={project} registry={registry} initialPageId="home"/>);
    expect(screen.getByRole('cell',{name:'Alex'})).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Records'),{target:{value:'[{"guest":{"name":"Jamie"},"tickets":4}]'}});
    expect(screen.getByRole('cell',{name:'Jamie'})).toBeTruthy();
    expect(resolveValue({$dirty:true},{dirty:true})).toBe(true);
  });
  it('sends explicit credential policy for API calls',async()=>{
    const fetch=vi.fn(async()=>({ok:true,status:200,json:async()=>({items:[]})}));
    await runActions(['load'],{resources:{events:{url:'http://localhost:3003/events',credentials:'include'}},actions:{load:[{type:'request',resource:'events'}]}},
      {fetch,allowNetwork:true,getState:()=>({})});
    expect(fetch.mock.calls[0][1].credentials).toBe('include');
  });
  it('opens accessible overlays and keeps their content inline in the editor',()=>{
    HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
    HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
    const {rerender}=render(<Modal title="Confirm"><p>Modal content</p></Modal>);
    fireEvent.click(screen.getByRole('button',{name:'Open modal'}));
    expect(screen.getByRole('dialog',{name:'Confirm'})).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Close Confirm'}));
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<Drawer title="Details" editor><p>Editable content</p></Drawer>);
    expect(screen.getByText('Editable content')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('validates and exports the complete demo without missing implementations',()=>{
    const project=parseProject(seatwave);
    const visit=nodes=>nodes.forEach(node=>{expect(registry[node.type],node.type).toBeTruthy();visit(node.children||[]);});
    project.pages.forEach(page=>visit(page.layout));
    const files=generateConfigApp(project);
    expect(files['src/runtime/dirty.jsx']).toContain('beforeunload');
    expect(files['src/components/Overlay/Overlay.jsx']).toContain('showModal');
    expect(JSON.parse(files['src/app.config.json']).pages).toHaveLength(3);
  });
});
