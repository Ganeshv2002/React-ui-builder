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

// IDs and public props are the durable contract. Replace an implementation here.
// To change a contract, increment version and provide migrate(props, fromVersion).
const plain = { card: Card, text: Text, container: Container, image: Image, link: Link, heading: Heading, paragraph: Paragraph, list: List, divider: Divider, topbar: TopBar, sidebar: SideBar, grid: Grid, navbar: NavBar, taskbar: TaskBar, badge: Badge, alert: Alert, avatar: Avatar, progress: Progress, statCard: StatCard };
export const registry = Object.fromEntries(Object.entries(plain).map(([id, Component]) => [id, { version: 1, component: function Adapter({ runtime: RuntimeContext, ...props }) { void RuntimeContext; return React.createElement(Component, props); } }]));
Object.assign(registry, Object.fromEntries(Object.entries({ button: ButtonAdapter, input: InputAdapter, checkbox: CheckboxAdapter, form: FormAdapter, navigationLink: NavigationAdapter }).map(([id, component]) => [id, { version: 1, component }])));
