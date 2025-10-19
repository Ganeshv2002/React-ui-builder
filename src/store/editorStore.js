import { create } from 'zustand';
import { registerComponent } from '../builder/componentRegistry';
import { telemetry, TELEMETRY_EVENTS } from '../utils/telemetry';

const useEditorStore = create((set, get) => ({
  selectedComponentId: null,
  isPreviewMode: false,
  isCodeViewerVisible: false,
  customComponents: [],
  dragState: 'idle',

  selectComponent(componentId) {
    set({ selectedComponentId: componentId ?? null });
  },

  clearSelection() {
    set({ selectedComponentId: null });
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
}));

export default useEditorStore;
