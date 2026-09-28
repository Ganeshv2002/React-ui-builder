import { describe, expect, it } from "vitest";
import { validateLayout } from "../layoutSchema";
import { buildReactModule } from "../codeGenerator";

describe("non-empty component props", () => {
  it("validates strings, booleans and nested style records with Zod 4", () => {
    const layout = [
      {
        id: "button-1",
        type: "button",
        props: {
          children: "Start building",
          disabled: false,
          style: { padding: "12px", opacity: 0.8 },
        },
      },
    ];
    expect(validateLayout(layout)).toEqual(layout);
    expect(buildReactModule(layout).code).toContain("Start building");
  });
});
