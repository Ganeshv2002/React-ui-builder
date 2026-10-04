// Pointer coordinates are screen pixels; JSON coordinates are unscaled parent pixels.
export function localPoint(point, rect, zoom, border = { x: 0, y: 0 }) {
  return { x: (point.x - rect.left) / zoom - border.x, y: (point.y - rect.top) / zoom - border.y };
}

export function snapBox(box, targets, tolerance = 6) {
  const next = { ...box }, guides = [];
  for (const [axis, size] of [['x', 'width'], ['y', 'height']]) {
    let best = tolerance + 1, adjustment = 0, guide;
    for (const target of targets) {
      for (const anchor of [target[axis], target[axis] + target[size] / 2, target[axis] + target[size]]) {
        for (const edge of [box[axis], box[axis] + box[size] / 2, box[axis] + box[size]]) {
          const delta = anchor - edge;
          if (Math.abs(delta) < best) { best = Math.abs(delta); adjustment = delta; guide = anchor; }
        }
      }
    }
    if (best <= tolerance) { next[axis] += adjustment; guides.push({ axis, value: guide }); }
  }
  return { box: next, guides };
}

export function resizeBox(box, dx, dy, handle) {
  const next = { ...box };
  if (handle.includes('e')) next.width = Math.max(16, box.width + dx);
  if (handle.includes('s')) next.height = Math.max(16, box.height + dy);
  if (handle.includes('w')) { next.width = Math.max(16, box.width - dx); next.x += box.width - next.width; }
  if (handle.includes('n')) { next.height = Math.max(16, box.height - dy); next.y += box.height - next.height; }
  return next;
}

export function freeStyle(style, box) {
  const base = { ...style }; delete base.inset;
  return { ...base, position: 'absolute', left: Math.round(box.x), top: Math.round(box.y),
    width: Math.round(box.width), height: Math.round(box.height), right: 'auto', bottom: 'auto',
    margin: 0, marginTop: 0, marginLeft: 0, marginRight: 0, marginBottom: 0, flex: 'none' };
}

export function placeInTree(layout, id, box) {
  return layout.map(node => {
    if (node.id === id) return { ...node, props: { ...node.props, style: freeStyle(node.props?.style, box) } };
    if (!node.children) return node;
    const contains = node.children.some(child => child.id === id);
    return { ...node, ...(contains ? { props: { ...node.props, style: { ...node.props?.style,
      position: node.props?.style?.position && node.props.style.position !== 'static' ? node.props.style.position : 'relative' } } } : {}),
      children: placeInTree(node.children, id, box) };
  });
}

export function paletteBox(type, point) {
  const dimensions = { container: [320, 240], grid: [320, 240], form: [320, 240], card: [300, 200],
    button: [140, 44], input: [240, 80], image: [240, 180], heading: [320, 64], divider: [240, 16],
    badge: [100, 32], avatar: [64, 64], checkbox: [180, 40],
    select: [260, 84], textarea: [300, 160], switch: [240, 44], slider: [260, 80],
    accordion: [360, 240], tabs: [360, 180], dataTable: [520, 260], breadcrumbs: [360, 40],
    pagination: [420, 90], emptyState: [360, 210], skeleton: [300, 80], quote: [360, 170],
    modal:[420,300], drawer:[360,440], footer:[700,160], hero:[900,350], appShell:[1000,700], eventGrid:[900,450] };
  const [width, height] = dimensions[type] || [240, 100];
  return { ...point, width, height };
}
