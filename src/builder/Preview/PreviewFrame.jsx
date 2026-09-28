import React, { useState } from "react";
import ReactDOM from "react-dom";
import Runtime from '../../runtime/Runtime';
import { registry } from '../../runtime/registry';
import { createProject } from '../../runtime/project';
import './PreviewFrame.css';
import themeStyles from '../../utils/theme.css?raw';
import artboardStyles from '../../runtime/artboard.css?raw';
const componentStyles = Object.values(import.meta.glob('../../components/*/*.css', { query: '?raw', import: 'default', eager: true })).join('\n');


const BASE_STYLES = `
  body {
    margin: 0;
    min-height: 100vh;
  }

  /* No padding: the canvas artboard has none, and Preview must match it. */
  .preview-container {
    min-height: 100vh;
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
    <style>${themeStyles}\n${componentStyles}\n${artboardStyles}\n${BASE_STYLES}</style>
  </head>
  <body class="fw-artboard">
    <div id="preview-root" class="preview-container"></div>
  </body>
</html>
`;

const PreviewFrame = ({
  layout,
  project,
  currentPageId,
  onNavigate,
  canvasDimensions = { width: 1440, height: 900 },
  canvasZoom = 1,
}) => {
  const [allowNetwork, setAllowNetwork] = useState(false);
  const [mountNode, setMountNode] = useState(null);
  const { width, height } = canvasDimensions;
  return (
    <div
      className="preview-frame"
      style={{ width: width * canvasZoom, height: height * canvasZoom }}
    >
      <label className="preview-network-control"><input type="checkbox" checked={allowNetwork} onChange={e => setAllowNetwork(e.target.checked)} />Enable API calls</label>
      <iframe
        title="Application Preview"
        className="preview-frame__iframe"
        style={{
          width,
          height,
          transform: `scale(${canvasZoom})`,
          transformOrigin: "top left",
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        srcDoc={PREVIEW_DOCUMENT}
        onLoad={(event) =>
          setMountNode(
            event.currentTarget.contentDocument?.getElementById("preview-root"),
          )
        }
      />
      {mountNode &&
        ReactDOM.createPortal(<Runtime project={project || createProject([{ id: "home", name: "Home", path: "/", layout }])} registry={registry} initialPageId={currentPageId} onNavigate={onNavigate} allowNetwork={allowNetwork} />, mountNode)}
    </div>
  );
};
export default PreviewFrame;
