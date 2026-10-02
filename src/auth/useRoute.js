import { useEffect, useState } from 'react';
export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => { const update = () => setHash(window.location.hash); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  const [path, query] = hash.replace(/^#\/?/, '').split('?');
  return { path: path || '', params: new URLSearchParams(query) };
}
