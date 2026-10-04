import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ComponentPalette from '../../builder/ComponentPalette/ComponentPalette';
import { libraryDefinitions } from '../../data/libraryDefinitions';
import { getComponentEntry } from '../../builder/componentRegistry';
import { registry } from '../../runtime/registry';
import { createProject, parseProject } from '../../runtime/project';
import Runtime from '../../runtime/Runtime';
import { generateConfigApp } from '../../utils/configAppGenerator';
import { buildReactModule } from '../../utils/codeGenerator';
import Tabs from '../Tabs/Tabs';
import Pagination from '../Pagination/Pagination';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';

describe('reusable component library', () => {
  it('includes every new component in editor, portable JSON and exported source', () => {
    const layout = libraryDefinitions.map(d => ({ id: d.id, type: d.id, props: d.defaultProps }));
    const project = createProject([{ id:'home', name:'Home', path:'/', layout }]);
    expect(parseProject(JSON.parse(JSON.stringify(project))).pages[0].layout).toHaveLength(12);
    const files = generateConfigApp(project);
    for (const d of libraryDefinitions) {
      const entry = getComponentEntry(d.id);
      expect(entry.renderer).toBeTypeOf('function');
      expect(registry[d.id].component).toBeTypeOf('function');
      expect(files[`src/components/${entry.options.sourcePath}.jsx`]).toBeTruthy();
      expect(buildReactModule(layout).code).toContain(entry.options.sourcePath);
    }
    expect(files).toHaveProperty('src/components/Library/Library.css');
    expect(Object.keys(files).some(path => path.includes('.test.'))).toBe(false);
    render(<Runtime project={project} registry={registry} initialPageId="home" />);
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByRole('switch')).toBeTruthy();
  });
  it('supports keyboard tabs and bounded pagination', () => {
    render(<><Tabs/><Pagination totalPages={3}/></>);
    fireEvent.keyDown(screen.getByRole('tab', {name:'Overview'}), {key:'ArrowRight'});
    expect(screen.getByRole('tab', {name:'Details'}).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('Everything you need to know.');
    expect(screen.getByRole('button', {name:'Previous'}).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', {name:'Page 3'}));
    expect(screen.getByRole('button', {name:'Next'}).disabled).toBe(true);
  });
  it('tracks new form values and runs JSON change actions', async () => {
    const project=createProject([{id:'home',name:'Home',path:'/',logic:{state:{choice:''},actions:{choose:[{type:'setState',path:'choice',value:{$event:'value'}}]}},layout:[
      {id:'select',type:'select',props:{label:'Plan',name:'plan',options:['Basic','Pro'],required:true},events:{change:['choose']}},
      {id:'message',type:'textarea',props:{label:'Notes',name:'notes'}},
      {id:'switch',type:'switch',props:{label:'Notifications',name:'notify'}},
      {id:'slider',type:'slider',props:{label:'Volume',value:50},events:{change:['choose']}},
      {id:'result',type:'text',bindings:{children:{$state:'choice'}}},
    ]}]);
    render(<Runtime project={project} registry={registry} initialPageId="home"/>);
    fireEvent.change(screen.getByRole('combobox'),{target:{value:'Pro'}});
    expect(await screen.findByText('Pro', {selector:'p'})).toBeTruthy();
    expect(screen.getByRole('combobox').value).toBe('Pro');
    fireEvent.change(screen.getByLabelText('Notes'),{target:{value:'Hello'}});
    expect(screen.getByLabelText('Notes').value).toBe('Hello');
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch').checked).toBe(true);
    fireEvent.change(screen.getByRole('slider'),{target:{value:'75'}});
    expect(await screen.findByText('75', {selector:'p'})).toBeTruthy();
    expect(screen.getByRole('slider').value).toBe('75');
  });
  it('disables AI creation while retaining insertion of library components', () => {
    const insert=vi.fn();
    render(<DndProvider backend={HTML5Backend}><ComponentPalette components={libraryDefinitions} onComponentClick={insert}/></DndProvider>);
    expect(screen.getByRole('button',{name:'Create with AI'}).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button',{name:'Add Data table'}));
    expect(insert).toHaveBeenCalledWith('dataTable');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('does not render executable breadcrumb links from imported props', () => {
    render(<Breadcrumbs labels={['Unsafe','Current']} links={['javascript:alert(1)']}/>);
    expect(screen.getByRole('link').getAttribute('href')).toBe('#');
  });
});
