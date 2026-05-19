import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm } from "../useForm";

describe("useForm", () => {
  it("should initialize with default null activeForm", () => {
    const { result } = renderHook(() => useForm());
    expect(result.current.activeForm).toBeNull();
    expect(result.current.isActive("SomeForm")).toBe(false);
  });

  it("should initialize with custom initialForm", () => {
    const { result } = renderHook(() => useForm("MyForm"));
    expect(result.current.activeForm).toBe("MyForm");
    expect(result.current.isActive("MyForm")).toBe(true);
  });

  it("should open form and set activeForm", () => {
    const { result } = renderHook(() => useForm());
    act(() => {
      result.current.openForm("TestForm");
    });
    expect(result.current.activeForm).toBe("TestForm");
    expect(result.current.isActive("TestForm")).toBe(true);
  });

  it("should close form and reset activeForm to null", () => {
    const { result } = renderHook(() => useForm("TestForm"));
    act(() => {
      result.current.closeForm();
    });
    expect(result.current.activeForm).toBeNull();
    expect(result.current.isActive("TestForm")).toBe(false);
  });
});
