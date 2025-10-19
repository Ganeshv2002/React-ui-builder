import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import CustomComponentRenderer from '../../components/CustomComponentRenderer/CustomComponentRenderer';
import { ensureComponentRegistry, getComponentRenderer } from '../componentRegistry';
import { validateLayout } from '../../utils/layoutSchema';
import './PreviewFrame.css';

ensureComponentRegistry();

const BASE_STYLES = `
  :root {
    color-scheme: light;
    font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
    background-color: #f8fafc;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background-color: #f8fafc;
  }

  .preview-container {
    min-height: 100vh;
    padding: 32px;
    box-sizing: border-box;
    background-color: #fff;
  }

  .preview-empty {
    display: grid;
    place-content: center;
    min-height: 60vh;
    font-size: 1rem;
    color: #64748b;
    border: 2px dashed #cbd5f5;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(14, 165, 233, 0.05));
  }
`;

const PREVIEW_DOCUMENT = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Preview</title>
    <base target="_blank" />
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div id="preview-root" class="preview-container"></div>
  </body>
</html>
`;

const PreviewNode = ({ component }) => {
  const Component = getComponentRenderer(component.type);
  const isCustomComponent = !Component && component.jsx && component.css;
  const props = component.props || {};
  const childNodes = Array.isArray(component.children) ? component.children : [];
  const { children: propsChildren, ...restProps } = props;

  const renderedChildren =
    childNodes.length > 0
      ? childNodes.map((child) => <PreviewNode key={child.id} component={child} />)
      : propsChildren;

  if (isCustomComponent) {
    return (
      <CustomComponentRenderer component={component} props={restProps}>
        {renderedChildren}
      </CustomComponentRenderer>
    );
  }

  if (!Component) {
    return (
      <div className="preview-unknown-component">
        Unknown component: <code>{component.type}</code>
      </div>
    );
  }

  return (
    <Component {...restProps}>
      {renderedChildren}
    </Component>
  );
};

const PreviewSurface = ({ layout }) => {
  const { nodes, error } = useMemo(() => {
    try {
      return { nodes: validateLayout(layout), error: null };
    } catch (validationError) {
      console.warn('Preview validation failed', validationError);
      const message =
        validationError instanceof Error ? validationError.message : 'Unknown layout error';
      return { nodes: [], error: message };
    }
  }, [layout]);

  if (error) {
    return (
      <div className="preview-empty">
        Unable to render preview.
        <br />
        <small>{error}</small>
      </div>
    );
  }

  if (nodes.length === 0) {
    return <div className="preview-empty">Add components to preview your page.</div>;
  }

  return nodes.map((component) => <PreviewNode key={component.id} component={component} />);
};

const PreviewFrame = ({ layout }) => {
  const iframeRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return undefined;
    }

    const attach = () => {
      const node = iframe.contentDocument?.getElementById('preview-root');
      setMountNode(node);
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      attach();
    } else {
      iframe.addEventListener('load', attach);
      return () => {
        iframe.removeEventListener('load', attach);
      };
    }

    return undefined;
  }, []);

  return (
    <div className="preview-frame">
      <iframe
        ref={iframeRef}
        title="Application Preview"
        className="preview-frame__iframe"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        srcDoc={PREVIEW_DOCUMENT}
      />
      {mountNode &&
        ReactDOM.createPortal(
          <PreviewSurface layout={layout} />,
          mountNode,
        )}
    </div>
  );
};

export default PreviewFrame;
