// Absolute children need a containing block and a non-collapsing page in preview/export.
export function pagePlacementStyle(layout = []) {
  const free = layout.filter(node => node.props?.style?.position === 'absolute');
  if (!free.length) return {};
  const pixels = value => typeof value === 'number' ? value : /^-?[\d.]+(?:px)?$/.test(value || '') ? parseFloat(value) : 0;
  const bottom = Math.max(0, ...free.map(node => pixels(node.props.style.top) + pixels(node.props.style.height)));
  return { position: 'relative', minHeight: `max(100vh, ${Math.ceil(bottom)}px)` };
}
