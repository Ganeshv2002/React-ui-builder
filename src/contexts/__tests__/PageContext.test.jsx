import React from "react";
import { renderHook, act } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { PageProvider, usePages } from "../PageContext";

describe("PageProvider history", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const wrapper = ({ children }) => <PageProvider>{children}</PageProvider>;

  it("tracks layout history and supports undo/redo", () => {
    const { result } = renderHook(() => usePages(), { wrapper });

    act(() => {
      result.current.updatePageLayout("home", [
        { id: "component-1", type: "button", props: {} },
      ]);
    });

    expect(result.current.layoutHistory.home.stack.length).toBe(2);
    expect(result.current.layoutHistory.home.pointer).toBe(1);

    act(() => {
      result.current.undoPageLayout("home");
    });

    expect(result.current.layoutHistory.home.pointer).toBe(0);
    expect(result.current.getCurrentPage().layout.length).toBe(0);

    act(() => {
      result.current.redoPageLayout("home");
    });

    expect(result.current.layoutHistory.home.pointer).toBe(1);
    expect(result.current.getCurrentPage().layout.length).toBe(1);
  });
});

