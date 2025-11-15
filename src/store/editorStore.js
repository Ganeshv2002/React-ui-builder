import { create } from 'zustand';
import { registerComponent } from '../builder/componentRegistry';
import { telemetry, TELEMETRY_EVENTS } from '../utils/telemetry';
import {
  ZOOM_LEVEL_STEPS,
  MIN_ZOOM_STEP,
  MAX_ZOOM_STEP,
} from '../builder/constants/zoomLevels';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toZoomPrecision = (value) => Number(value.toFixed(4));
const clampZoom = (value) => toZoomPrecision(clamp(value, MIN_ZOOM_STEP, MAX_ZOOM_STEP));

const composeZoomSteps = (value) => {
  const steps = new Set(ZOOM_LEVEL_STEPS);
  const normalized = clampZoom(value);
  if (Number.isFinite(normalized)) {
    steps.add(normalized);
  }
  return Array.from(steps).sort((a, b) => a - b);
};

const getNextZoomLevel = (value) => {
  const clamped = clampZoom(value);
  const steps = composeZoomSteps(clamped);
  const index = steps.findIndex((step) => Math.abs(step - clamped) < 0.0001);

  if (index === -1) {
    const next = steps.find((step) => step > clamped);
    return next ?? steps[steps.length - 1];
  }

  return steps[Math.min(index + 1, steps.length - 1)];
};

const getPreviousZoomLevel = (value) => {
  const clamped = clampZoom(value);
  const steps = composeZoomSteps(clamped);
  const index = steps.findIndex((step) => Math.abs(step - clamped) < 0.0001);

  if (index === -1) {
    const prev = [...steps].reverse().find((step) => step < clamped);
    return prev ?? steps[0];
  }

  return steps[Math.max(index - 1, 0)];
};
const normalizeDimension = (value, fallback) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.round(numeric);
  }
  return fallback;
};
const uniqueIds = (ids = []) => Array.from(new Set(ids.filter(Boolean)));

const useEditorStore = create((set, get) => {
  const setSelection = (ids) => {
    const nextIds = uniqueIds(ids);
    set({
      selectedComponentIds: nextIds,
      selectedComponentId: nextIds[0] ?? null,
    });
  };

  return {
    selectedComponentId: null,
    selectedComponentIds: [],
    isPreviewMode: false,
    isCodeViewerVisible: false,
    isHistoryPanelOpen: false,
    isCommandPaletteOpen: false,
    canvasDimensions: { width: 1440, height: 900 },
    canvasZoom: 1,
    customComponents: [],
    dragState: 'idle',

    selectComponent(componentId) {
      if (!componentId) {
        setSelection([]);
        return;
      }
      setSelection([componentId]);
    },

    selectComponents(componentIds = []) {
      setSelection(componentIds);
    },

    toggleComponentSelection(componentId) {
      if (!componentId) {
        setSelection([]);
        return;
      }
      const current = get().selectedComponentIds;
      if (current.includes(componentId)) {
        setSelection(current.filter((id) => id !== componentId));
      } else {
        setSelection([...current, componentId]);
      }
    },

    clearSelection() {
      setSelection([]);
    },

    setPreviewMode(isPreviewMode) {
      set({ isPreviewMode });
      telemetry.track(TELEMETRY_EVENTS.PREVIEW_TOGGLED, { isPreviewMode });
    },

    togglePreviewMode() {
      const { isPreviewMode } = get();
      const nextValue = !isPreviewMode;
      set({ isPreviewMode: nextValue });
      telemetry.track(TELEMETRY_EVENTS.PREVIEW_TOGGLED, { isPreviewMode: nextValue });
    },

    openCodeViewer() {
      set({ isCodeViewerVisible: true });
    },

    closeCodeViewer() {
      set({ isCodeViewerVisible: false });
    },

    trackDragState(state) {
      set({ dragState: state });
    },

    toggleHistoryPanel(forceValue) {
      set((state) => ({
        isHistoryPanelOpen: typeof forceValue === 'boolean' ? forceValue : !state.isHistoryPanelOpen,
      }));
    },

    toggleCommandPalette(forceValue) {
      set((state) => ({
        isCommandPaletteOpen: typeof forceValue === 'boolean' ? forceValue : !state.isCommandPaletteOpen,
      }));
    },

    setCanvasDimensions(dimensions = {}) {
      set((state) => ({
        canvasDimensions: {
          width: normalizeDimension(dimensions.width, state.canvasDimensions.width),
          height: normalizeDimension(dimensions.height, state.canvasDimensions.height),
        },
      }));
    },

    setCanvasZoom(value) {
      if (!Number.isFinite(value)) {
        return;
      }
      set({ canvasZoom: clampZoom(value) });
    },

    zoomCanvasIn() {
      set((state) => ({ canvasZoom: getNextZoomLevel(state.canvasZoom) }));
    },

    zoomCanvasOut() {
      set((state) => ({ canvasZoom: getPreviousZoomLevel(state.canvasZoom) }));
    },

    addCustomComponent(componentDefinition) {
      if (!componentDefinition?.id) {
        throw new Error('Custom component definition requires an id');
      }

      registerComponent(componentDefinition, null, { isCustom: true });

      set((state) => {
        const exists = state.customComponents.some((component) => component.id === componentDefinition.id);
        if (exists) {
          return state;
        }

        telemetry.track(TELEMETRY_EVENTS.COMPONENT_ADDED, {
          componentType: componentDefinition.id,
          isCustom: true,
        });

        return {
          customComponents: [...state.customComponents, componentDefinition],
        };
      });
    },
  };
});

export default useEditorStore;
