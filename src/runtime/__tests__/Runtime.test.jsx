import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Runtime from '../Runtime';
import { registry } from '../registry';
import { createProject } from '../project';

describe('shared editor/export runtime', () => {
  it('runs events and effects, binds state and navigates configured routes', async () => {
    const project = createProject([{ id: 'home', name: 'Home', path: '/', logic: {
      state: { message: 'Initial', email: '' },
      actions: { mount: [{ type: 'setState', path: 'message', value: 'Mounted' }], edit: [{ type: 'setState', path: 'email', value: { $event: 'value' } }], changed: [{ type: 'setState', path: 'message', value: { $state: 'email' } }], next: [{ type: 'navigate', pageId: 'done' }] },
      effects: [{ id: 'load', on: 'mount', actions: ['mount'] }, { id: 'watch', on: 'change', watch: ['email'], actions: ['changed'] }],
    }, layout: [
      { id: 'message', type: 'text', bindings: { children: { $state: 'message' } } },
      { id: 'email', type: 'input', props: { label: 'Email' }, bindings: { value: { $state: 'email' } }, events: { change: ['edit'] } },
      { id: 'next', type: 'button', props: { children: 'Continue' }, events: { click: ['next'] } },
    ] }, { id: 'done', name: 'Done', path: '/done', layout: [{ id: 'doneText', type: 'text', props: { children: 'Finished' } }] }]);
    render(<Runtime project={project} registry={registry} />);
    await screen.findByText('Mounted');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'Ada' } });
    await screen.findByText('Ada');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Finished');
    expect(window.location.hash).toBe('#/done');
  });
  it('lets users edit an input that only has a default value, and renders editor heading levels', () => {
    const project = createProject([{ id: 'home', name: 'Home', path: '/', layout: [
      { id: 'title', type: 'heading', props: { text: 'Sign up', level: 'h2' } },
      { id: 'name', type: 'input', props: { label: 'Name', value: 'prefilled' } },
    ] }]);
    render(<Runtime project={project} initialPageId="home" registry={registry} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Sign up' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    expect(screen.getByLabelText('Name').value).toBe('Ada');
  });
  it('replaces a React implementation through a versioned adapter without editing JSON', async () => {
    const project = createProject([{ id: 'home', name: 'Home', path: '/', layout: [{ id: 'title', type: 'title', contractVersion: 1, props: { text: 'Durable config' } }] }]);
    const Adapter = ({ label }) => <h1>{label}</h1>;
    render(<Runtime project={project} initialPageId="home" registry={{ title: { version: 2, component: Adapter, migrate: props => ({ label: props.text }) } }} />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Durable config' })).toBeTruthy());
    expect(project.pages[0].layout[0].props).toEqual({ text: 'Durable config' });
  });
});
