import { useEffect, useRef } from 'react';
import { localPoint, placeInTree, resizeBox, snapBox } from './geometry';

// Keep high-frequency motion out of project state. Commit once on release for one undo step.
export default function useFreeTransform({ component, elementRef, enabled, zoom, layout, onLayoutChange, onSelect }) {
  const cleanupRef = useRef(null);
  useEffect(() => () => cleanupRef.current?.(), [enabled, zoom]);
  const measure = () => {
    const element = elementRef.current, parent = element.parentElement;
    const rect = element.getBoundingClientRect(), parentRect = parent.getBoundingClientRect();
    const origin = { left: parentRect.left + parent.clientLeft * zoom, top: parentRect.top + parent.clientTop * zoom };
    const position = localPoint({ x: rect.left, y: rect.top }, origin, zoom);
    return { element, parent, origin, box: { ...position, width: rect.width / zoom, height: rect.height / zoom } };
  };
  const begin = (event, handle = '') => {
    if (!enabled || event.button !== 0 || event.target.closest('.component-controls')) return;
    if (event.target.closest('[data-component-id]') !== elementRef.current) return;
    event.stopPropagation(); event.preventDefault();
    cleanupRef.current?.();
    onSelect();
    const { element, parent, origin, box } = measure();
    element.focus({ preventScroll: true });
    const originalStyle = element.getAttribute('style');
    const start = { x: event.clientX, y: event.clientY }, pointerId = event.pointerId;
    const targets = [{ x: 0, y: 0, width: parent.clientWidth, height: parent.clientHeight },
      ...Array.from(parent.children).filter(el => el !== element && el.hasAttribute('data-component-id')).map(el => {
        const rect = el.getBoundingClientRect();
        return { ...localPoint({ x: rect.left, y: rect.top }, origin, zoom), width: rect.width / zoom, height: rect.height / zoom };
      })];
    let next = box, moved = false, frame, guides = [];
    const guideLayer = document.createElement('div');
    guideLayer.className = 'canvas-snap-guides';
    parent.appendChild(guideLayer);
    const paint = () => {
      element.style.transition = 'none';
      element.style.transform = `translate(${next.x - box.x}px, ${next.y - box.y}px)`;
      if (handle) { element.style.width = `${next.width}px`; element.style.height = `${next.height}px`; }
      guideLayer.replaceChildren(...guides.map(guide => {
        const line = document.createElement('div');
        line.className = `canvas-snap-guide canvas-snap-guide--${guide.axis}`;
        line.style[guide.axis === 'x' ? 'left' : 'top'] = `${guide.value}px`;
        return line;
      }));
      frame = null;
    };
    const move = e => {
      if (e.pointerId !== pointerId) return;
      let dx = (e.clientX - start.x) / zoom, dy = (e.clientY - start.y) / zoom;
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 3) return;
      moved = true;
      element.classList.add('free-transform-active');
      if (!handle && e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      next = handle ? resizeBox(box, dx, dy, handle) : { ...box, x: box.x + dx, y: box.y + dy };
      guides = [];
      if (!handle && !e.altKey) ({ box: next, guides } = snapBox(next, targets, 6 / zoom));
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const cleanup = () => {
      if (frame) cancelAnimationFrame(frame);
      element.classList.remove('free-transform-active');
      if (originalStyle === null) element.removeAttribute('style'); else element.setAttribute('style', originalStyle);
      guideLayer.remove();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
      window.removeEventListener('blur', cancel);
      if (element.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId);
      cleanupRef.current = null;
    };
    const finish = e => { if (e.pointerId !== pointerId) return; move(e); cleanup(); if (moved) onLayoutChange(placeInTree(layout, component.id, next)); };
    const cancel = () => cleanup();
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); cancel(); } };
    cleanupRef.current = cleanup;
    element.setPointerCapture?.(pointerId);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    window.addEventListener('blur', cancel);
  };
  const onKeyDown = event => {
    if (!enabled || event.target !== elementRef.current || event.ctrlKey || event.metaKey || event.altKey) return;
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault(); event.stopPropagation();
    const { box } = measure(), step = event.shiftKey ? 10 : 1;
    onLayoutChange(placeInTree(layout, component.id, { ...box, x: box.x + direction[0] * step, y: box.y + direction[1] * step }));
  };
  return { begin, onKeyDown };
}
