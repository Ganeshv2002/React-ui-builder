import React from 'react';
import Overlay from '../Overlay/Overlay';
export default function Modal(props) { return <Overlay title="Modal" triggerLabel="Open modal" {...props} kind="modal" />; }
