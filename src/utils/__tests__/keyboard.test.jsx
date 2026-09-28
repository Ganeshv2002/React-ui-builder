import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useKeyboardShortcuts } from "../keyboard";

afterEach(cleanup);
function Harness({ undo, redo }) {
  useKeyboardShortcuts([
    { key: "z", ctrlKey: true, action: undo, description: "Undo" },
    {
      key: "z",
      ctrlKey: true,
      shiftKey: true,
      action: redo,
      description: "Redo",
    },
  ]);
  return <input aria-label="Content" />;
}
describe("editor keyboard shortcuts", () => {
  it("runs redo without also running undo", () => {
    const undo = vi.fn(),
      redo = vi.fn();
    render(<Harness undo={undo} redo={redo} />);
    fireEvent.keyDown(document, { key: "z", ctrlKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledOnce();
    expect(undo).not.toHaveBeenCalled();
  });
  it("preserves native undo inside fields and supports Command outside fields", () => {
    const undo = vi.fn(),
      redo = vi.fn();
    const { getByLabelText } = render(<Harness undo={undo} redo={redo} />);
    fireEvent.keyDown(getByLabelText("Content"), { key: "z", ctrlKey: true });
    expect(undo).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "z", metaKey: true });
    expect(undo).toHaveBeenCalledOnce();
  });
});
