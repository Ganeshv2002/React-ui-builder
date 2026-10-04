import { describe, it, expect } from 'vitest';
import { localPoint, snapBox, resizeBox, placeInTree, freeStyle } from './geometry';
import { createProject, parseProject } from '../../runtime/project';
import { generateConfigApp } from '../../utils/configAppGenerator';
import { pagePlacementStyle } from '../../runtime/placement';

describe('free canvas coordinates and portable placement', () => {
  it('converts screen coordinates at multiple zooms with parent borders', () => {
    for (const zoom of [.25, .5, 1, 2]) expect(localPoint({ x: 100 + 42 * zoom, y: 80 + 65 * zoom }, { left: 100, top: 80 }, zoom, { x: 2, y: 5 })).toEqual({ x: 40, y: 60 });
  });
  it('snaps matching edges and centers only within tolerance', () => {
    const target = { x: 100, y: 200, width: 40, height: 40 };
    expect(snapBox({ x: 97, y: 198, width: 40, height: 40 }, [target]).box).toEqual(target);
    expect(snapBox({ x: 0, y: 0, width: 10, height: 10 }, [target]).guides).toEqual([]);
  });
  it('resizes from the west without moving the opposite edge or allowing inversion', () => {
    expect(resizeBox({ x: 20, y: 30, width: 100, height: 50 }, 200, 0, 'w')).toEqual({ x: 104, y: 30, width: 16, height: 50 });
  });
  it('preserves nested components and behavior through JSON and React export', () => {
    const original = [{ id: 'parent', type: 'container', props: {}, children: [{ id: 'child', type: 'button', props: { children: 'Save', style: { color: 'red', inset: 0 } }, events: { click: ['save'] } }] }];
    const next = placeInTree(original, 'child', { x: 41, y: 52, width: 140, height: 44 });
    expect(original[0].props).toEqual({});
    expect(next[0].props.style.position).toBe('relative');
    expect(next[0].children[0].props.style).toMatchObject({ position: 'absolute', left: 41, top: 52, color: 'red' });
    expect(next[0].children[0].props.style.inset).toBeUndefined();
    const project = createProject([{ id: 'home', path: '/', name: 'Home', layout: next, logic: { actions: { save: [{ type: 'setState', path: 'saved', value: true }] } } }]);
    const restored = parseProject(JSON.parse(JSON.stringify(project)));
    expect(restored.pages[0].layout[0].children[0].events.click).toEqual(['save']);
    const files = generateConfigApp(restored);
    expect(JSON.parse(files['src/app.config.json']).pages[0].layout[0].children[0].props.style.left).toBe(41);
    expect(files['src/runtime/placement.js']).toContain('pagePlacementStyle');
  });
  it('keeps free page contents visible in preview and exported apps', () => {
    expect(pagePlacementStyle([{ props: { style: freeStyle({}, { x: 50, y: 1000, width: 200, height: 120 }) } }])).toEqual({ position: 'relative', minHeight: 'max(100vh, 1120px)' });
    expect(pagePlacementStyle([])).toEqual({});
  });
});
