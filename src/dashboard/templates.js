import { v4 as uuid } from 'uuid';
import { createProject } from '../runtime/project';

export const templates = [
  { id: 'landing', name: 'Landing page', description: 'A home for your next idea', kind: 'landing' },
  { id: 'dashboard', name: 'Dashboard', description: 'Metrics, cards and insights', kind: 'dashboard' },
  { id: 'portfolio', name: 'Portfolio', description: 'Put your work in the spotlight', kind: 'portfolio' },
  { id: 'contact', name: 'Contact form', description: 'Start a conversation', kind: 'contact' },
];

const node = (type, props, children) => ({ id: uuid(), type, props, ...(children ? { children } : {}) });
const heading = (text, level = 1) => node('heading', { text, level });
const paragraph = text => node('paragraph', { text });
const container = (children, style = {}) => node('container', { gap: 'large', padding: 'large', style }, children);
const row = children => node('container', { direction: 'horizontal', gap: 'large', flexWrap: 'wrap', padding: 'none' }, children);
const card = (title, text) => container([heading(title, 3), paragraph(text)], { flex: '1 1 220px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#ffffff' });

// Templates use the existing public component contracts and portable JSON format.
export function makeTemplate(id = 'blank', name = 'Untitled project') {
  let layout = [];
  if (id === 'landing') layout = [container([
    node('badge', { children: 'YOUR NEXT BIG IDEA', variant: 'success' }),
    heading('Make room for what comes next.'),
    paragraph('A thoughtful starting point for your product. Make it yours in the visual editor.'),
    node('button', { children: 'Get in touch', targetPageId: 'contact' }),
    row([card('Built around you', 'Give your audience something worth exploring.'), card('Simple by design', 'A clear story, from the first impression to the next step.'), card('Ready to grow', 'Start small and build on your own terms.')]),
  ], { padding: '64px', minHeight: '700px', background: '#f6faf9' })];
  if (id === 'dashboard') layout = [container([
    heading('Overview'), paragraph('Your workspace at a glance. Replace these sample values with your data.'),
    row(['Projects', 'Tasks completed', 'Team members'].map((title, i) => node('statCard', { title, value: ['12', '48', '6'][i], change: '', helperText: 'Sample data', style: { flex: '1 1 220px' } }))),
    row([card('Recent activity', 'Use this space for your latest updates.'), card('Your next milestone', 'Bring your most important work into focus.')]),
  ], { padding: '40px', minHeight: '700px', background: '#f8fafc' })];
  if (id === 'portfolio') layout = [container([
    paragraph('DESIGNER · MAKER · BUILDER'), heading('Good ideas deserve to be made.'),
    paragraph('A selection of work, experiments and things I care about.'),
    row([card('Project one', 'Tell the story behind your work.'), card('Project two', 'Share the details that make it different.')]),
    heading('Let’s build something together.', 2), node('link', { text: 'Say hello', href: 'mailto:hello@example.com' }),
  ], { padding: '64px', minHeight: '700px', background: '#faf8f5' })];
  const contactPage = {
    id: 'contact', name: 'Contact', path: '/contact', isHome: false,
    layout: [container([heading('Let’s talk.'), paragraph('Leave a message and tell us what you have in mind.'),
      node('form', {}, [
        node('input', { name: 'name', label: 'Your name', placeholder: 'Alex Morgan', required: true }),
        node('input', { name: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com', required: true }),
        node('input', { name: 'message', label: 'Your message', placeholder: 'What are you working on?', required: true }),
        node('button', { children: 'Send message', type: 'submit' }),
      ]), paragraph('Connect a submit action in Page behavior to deliver messages.')],
    { padding: '48px', maxWidth: '680px', margin: '0 auto' })],
  };
  const pages = id === 'contact' ? [{ ...contactPage, path: '/', isHome: true }]
    : [{ id: 'home', name: 'Home', path: '/', isHome: true, layout }, ...(id === 'landing' ? [contactPage] : [])];
  return createProject(pages, undefined, { name });
}
