export const ZOOM_LEVELS = [25, 33, 50, 67, 75, 90, 100, 125, 150, 200];
export const MIN_ZOOM_PERCENT = ZOOM_LEVELS[0];
export const MAX_ZOOM_PERCENT = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

export const ZOOM_LEVEL_STEPS = ZOOM_LEVELS.map((level) =>
  Number((level / 100).toFixed(4)),
);

export const MIN_ZOOM_STEP = Number((MIN_ZOOM_PERCENT / 100).toFixed(4));
export const MAX_ZOOM_STEP = Number((MAX_ZOOM_PERCENT / 100).toFixed(4));
