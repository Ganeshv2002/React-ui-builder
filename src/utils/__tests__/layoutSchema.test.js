import { describe, expect, it } from "vitest";
import { validateLayout } from "../layoutSchema";

describe("layoutSchema", () => {
  it("accepts a valid layout structure", () => {
    const layout = [
      {
        id: "container",
        type: "container",
        props: {},
        children: [
          {
            id: "child",
            type: "text",
            props: { children: "Hello" },
          },
        ],
      },
    ];

    expect(() => validateLayout(layout)).not.toThrow();
  });

  it("rejects layouts with invalid nodes", () => {
    expect(() => validateLayout([{ id: "x" }])).toThrow();
  });
});

