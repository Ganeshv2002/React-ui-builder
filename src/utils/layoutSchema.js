import { z } from "zod";

const propsSchema = z.record(z.any()).default({});

export const layoutComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: propsSchema,
  children: z.array(z.any()).optional(),
});

export const layoutSchema = z.array(layoutComponentSchema);

export const validateLayout = (layout) => layoutSchema.parse(layout ?? []);

