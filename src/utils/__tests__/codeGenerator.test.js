import { describe, expect, it } from "vitest";
import { buildReactModule } from "../codeGenerator";

const basicLayout = [
  {
    id: "root-button",
    type: "button",
    props: { children: "Click me" },
  },
];

describe("buildReactModule", () => {
  it("generates React code with component imports", () => {
    const result = buildReactModule(basicLayout);

    expect(result.code).toContain("<Button");
    expect(result.imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ exportName: "Button" }),
      ]),
    );
  });

  it("handles invalid layout input gracefully", () => {
    const result = buildReactModule([{ id: 1 }]);
    expect(result.code).toContain("generated-layout");
    expect(result.imports).toHaveLength(0);
  });
});

