import { useEffect } from 'react';

export default function usePanelFocus(ref, open, close) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const panel = ref.current, previous = document.activeElement;
    const controls = () => [...panel.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')]
      .filter(node => !node.disabled && node.getClientRects().length);
    controls()[0]?.focus();
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const items = controls(), first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    panel.addEventListener('keydown', key);
    return () => { panel.removeEventListener('keydown', key); if (previous?.isConnected) previous.focus(); };
  }, [ref, open, close]);
}
