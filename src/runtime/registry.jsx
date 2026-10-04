import React from 'react';
import { ButtonAdapter, InputAdapter, CheckboxAdapter, FormAdapter, NavigationAdapter } from './adapters.jsx';
import Card from '../components/Card/Card';
import Text from '../components/Text/Text';
import Container from '../components/Container/Container';
import Image from '../components/Image/Image';
import Link from '../components/Link/Link';
import Heading from '../components/Heading/Heading';
import Paragraph from '../components/Paragraph/Paragraph';
import List from '../components/List/List';
import Divider from '../components/Divider/Divider';
import TopBar from '../components/TopBar/TopBar';
import SideBar from '../components/SideBar/SideBar';
import Grid from '../components/Grid/Grid';
import NavBar from '../components/NavBar/NavBar';
import TaskBar from '../components/TaskBar/TaskBar';
import Badge from '../components/Badge/Badge';
import Alert from '../components/Alert/Alert';
import Avatar from '../components/Avatar/Avatar';
import Progress from '../components/Progress/Progress';
import StatCard from '../components/StatCard/StatCard';
import Select from '../components/Select/Select';
import Textarea from '../components/Textarea/Textarea';
import Switch from '../components/Switch/Switch';
import Slider from '../components/Slider/Slider';
import Accordion from '../components/Accordion/Accordion';
import Tabs from '../components/Tabs/Tabs';
import DataTable from '../components/DataTable/DataTable';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import Pagination from '../components/Pagination/Pagination';
import EmptyState from '../components/EmptyState/EmptyState';
import Skeleton from '../components/Skeleton/Skeleton';
import Quote from '../components/Quote/Quote';
import PriceSummary from '../components/PriceSummary/PriceSummary';
import Drawer from '../components/Drawer/Drawer';
import Modal from '../components/Modal/Modal';
import Footer from '../components/Footer/Footer';
import AppShell from '../components/AppShell/AppShell';
import Hero from '../components/Hero/Hero';
import EventGrid from '../components/EventGrid/EventGrid';

// IDs and public props are the durable contract. Replace an implementation here.
// To change a contract, increment version and provide migrate(props, fromVersion).
const plain = { card: Card, text: Text, container: Container, image: Image, link: Link, heading: Heading, paragraph: Paragraph, list: List, divider: Divider, topbar: TopBar, sidebar: SideBar, grid: Grid, navbar: NavBar, taskbar: TaskBar, badge: Badge, alert: Alert, avatar: Avatar, progress: Progress, statCard: StatCard };
Object.assign(plain, { footer: Footer, appShell: AppShell, hero: Hero, eventGrid: EventGrid });
plain.priceSummary = PriceSummary;
export const registry = Object.fromEntries(Object.entries(plain).map(([id, Component]) => [id, { version: 1, component: function Adapter({ runtime: RuntimeContext, ...props }) { void RuntimeContext; return React.createElement(Component, props); } }]));
for (const [id, Component] of Object.entries({ modal: Modal, drawer: Drawer })) {
  registry[id] = { version:1, component: function OverlayAdapter({runtime, ...props}) { return <Component {...props} editor={runtime?.editor} />; } };
}
Object.assign(registry, Object.fromEntries(Object.entries({ select: Select, textarea: Textarea, switch: Switch, slider: Slider, accordion: Accordion, tabs: Tabs, dataTable: DataTable, breadcrumbs: Breadcrumbs, pagination: Pagination, emptyState: EmptyState, skeleton: Skeleton, quote: Quote }).map(([id, Component]) => [id, { version: 1, component: function Adapter({ runtime, ...props }) { void runtime; return React.createElement(Component, props); } }])));
Object.assign(registry, Object.fromEntries(Object.entries({ button: ButtonAdapter, input: InputAdapter, checkbox: CheckboxAdapter, form: FormAdapter, navigationLink: NavigationAdapter }).map(([id, component]) => [id, { version: 1, component }])));
