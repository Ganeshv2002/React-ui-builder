import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Card from '../../components/Card/Card';
import Text from '../../components/Text/Text';
import Container from '../../components/Container/Container';
import Form from '../../components/Form/Form';
import Image from '../../components/Image/Image';
import Link from '../../components/Link/Link';
import Heading from '../../components/Heading/Heading';
import Paragraph from '../../components/Paragraph/Paragraph';
import List from '../../components/List/List';
import Divider from '../../components/Divider/Divider';
import Checkbox from '../../components/Checkbox/Checkbox';
import NavigationLink from '../../components/NavigationLink/NavigationLink';
import TopBar from '../../components/TopBar/TopBar';
import SideBar from '../../components/SideBar/SideBar';
import Grid from '../../components/Grid/Grid';
import NavBar from '../../components/NavBar/NavBar';
import TaskBar from '../../components/TaskBar/TaskBar';
import Badge from '../../components/Badge/Badge';
import Alert from '../../components/Alert/Alert';
import Avatar from '../../components/Avatar/Avatar';
import Progress from '../../components/Progress/Progress';
import StatCard from '../../components/StatCard/StatCard';
import { componentDefinitions } from '../../data/componentDefinitions';
import PriceSummary from '../../components/PriceSummary/PriceSummary';
import Drawer from '../../components/Drawer/Drawer';
import Modal from '../../components/Modal/Modal';
import Footer from '../../components/Footer/Footer';
import AppShell from '../../components/AppShell/AppShell';
import Hero from '../../components/Hero/Hero';
import EventGrid from '../../components/EventGrid/EventGrid';
import Select from '../../components/Select/Select';
import Textarea from '../../components/Textarea/Textarea';
import Switch from '../../components/Switch/Switch';
import Slider from '../../components/Slider/Slider';
import Accordion from '../../components/Accordion/Accordion';
import Tabs from '../../components/Tabs/Tabs';
import DataTable from '../../components/DataTable/DataTable';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs';
import Pagination from '../../components/Pagination/Pagination';
import EmptyState from '../../components/EmptyState/EmptyState';
import Skeleton from '../../components/Skeleton/Skeleton';
import Quote from '../../components/Quote/Quote';

const componentRenderers = {
  priceSummary: PriceSummary,
  drawer: Drawer,
  modal: Modal,
  footer: Footer,
  appShell: AppShell,
  hero: Hero,
  eventGrid: EventGrid,
  select: Select,
  textarea: Textarea,
  switch: Switch,
  slider: Slider,
  accordion: Accordion,
  tabs: Tabs,
  dataTable: DataTable,
  breadcrumbs: Breadcrumbs,
  pagination: Pagination,
  emptyState: EmptyState,
  skeleton: Skeleton,
  quote: Quote,
  button: Button,
  input: Input,
  card: Card,
  text: Text,
  container: Container,
  form: Form,
  image: Image,
  link: Link,
  heading: Heading,
  paragraph: Paragraph,
  list: List,
  divider: Divider,
  checkbox: Checkbox,
  navigationLink: NavigationLink,
  topbar: TopBar,
  sidebar: SideBar,
  grid: Grid,
  navbar: NavBar,
  taskbar: TaskBar,
  badge: Badge,
  alert: Alert,
  avatar: Avatar,
  progress: Progress,
  statCard: StatCard,
};

const componentSourcePaths = {
  priceSummary: 'PriceSummary/PriceSummary',
  drawer: 'Drawer/Drawer',
  modal: 'Modal/Modal',
  footer: 'Footer/Footer',
  appShell: 'AppShell/AppShell',
  hero: 'Hero/Hero',
  eventGrid: 'EventGrid/EventGrid',
  select: 'Select/Select',
  textarea: 'Textarea/Textarea',
  switch: 'Switch/Switch',
  slider: 'Slider/Slider',
  accordion: 'Accordion/Accordion',
  tabs: 'Tabs/Tabs',
  dataTable: 'DataTable/DataTable',
  breadcrumbs: 'Breadcrumbs/Breadcrumbs',
  pagination: 'Pagination/Pagination',
  emptyState: 'EmptyState/EmptyState',
  skeleton: 'Skeleton/Skeleton',
  quote: 'Quote/Quote',
  button: 'Button/Button',
  input: 'Input/Input',
  card: 'Card/Card',
  text: 'Text/Text',
  container: 'Container/Container',
  form: 'Form/Form',
  image: 'Image/Image',
  link: 'Link/Link',
  heading: 'Heading/Heading',
  paragraph: 'Paragraph/Paragraph',
  list: 'List/List',
  divider: 'Divider/Divider',
  checkbox: 'Checkbox/Checkbox',
  navigationLink: 'NavigationLink/NavigationLink',
  topbar: 'TopBar/TopBar',
  sidebar: 'SideBar/SideBar',
  grid: 'Grid/Grid',
  navbar: 'NavBar/NavBar',
  taskbar: 'TaskBar/TaskBar',
  badge: 'Badge/Badge',
  alert: 'Alert/Alert',
  avatar: 'Avatar/Avatar',
  progress: 'Progress/Progress',
  statCard: 'StatCard/StatCard',
};

const registry = new Map();
let isInitialized = false;

const cloneDefinition = (definition) => JSON.parse(JSON.stringify(definition));

export const registerComponent = (definition, renderer, options = {}) => {
  if (!definition?.id) {
    throw new Error('Component definition must include a stable id');
  }

  const existingEntry = registry.get(definition.id);

  const entry = existingEntry
    ? {
        definition: { ...existingEntry.definition, ...cloneDefinition(definition) },
        renderer: renderer ?? existingEntry.renderer ?? null,
        options: { ...existingEntry.options, ...options },
      }
    : {
        definition: cloneDefinition(definition),
        renderer: renderer ?? null,
        options: { ...options },
      };

  registry.set(definition.id, entry);
  return entry;
};

export const ensureComponentRegistry = () => {
  if (isInitialized) {
    return;
  }

  componentDefinitions.forEach((definition) => {
    const renderer = componentRenderers[definition.id] ?? null;

    if (!renderer && !definition.isCustom) {
      // eslint-disable-next-line no-console
      console.warn(`Component renderer missing for id "${definition.id}". Component will render as custom.`);
    }

    const rendererName = renderer?.displayName || renderer?.name || definition.name?.replace(/\s+/g, '') || definition.id;

    registerComponent(definition, renderer, {
      isDefault: true,
      sourcePath: componentSourcePaths[definition.id] ?? null,
      exportName: rendererName,
    });
  });

  isInitialized = true;
};

export const getComponentRenderer = (id) => {
  ensureComponentRegistry();
  return registry.get(id)?.renderer ?? null;
};

export const getComponentDefinition = (id) => {
  ensureComponentRegistry();
  const entry = registry.get(id);
  return entry ? { ...entry.definition } : null;
};

export const getComponentDefinitions = (predicate = () => true) => {
  ensureComponentRegistry();
  return Array.from(registry.values())
    .map((entry) => ({ ...entry.definition }))
    .filter(predicate)
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const listRegisteredComponents = () => {
  ensureComponentRegistry();
  return Array.from(registry.entries()).map(([id, entry]) => ({
    id,
    definition: { ...entry.definition },
    hasRenderer: Boolean(entry.renderer),
    options: { ...entry.options },
  }));
};

export const getComponentEntry = (id) => {
  ensureComponentRegistry();
  const entry = registry.get(id);
  if (!entry) {
    return null;
  }

  return {
    definition: { ...entry.definition },
    renderer: entry.renderer,
    options: { ...entry.options },
  };
};
