import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "./Toast";

function Harness() {
  const { showToast } = useToast();
  return (
    <>
      <button onClick={() => showToast("Saved!", "success")}>success</button>
      <button onClick={() => showToast("Oops", "error")}>error</button>
    </>
  );
}

describe("ToastProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a toast when showToast is called", () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "success" }));
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("applies the type style", () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "error" }));
    expect(screen.getByText("Oops")).toHaveClass("bg-red-600");
  });

  it("auto-dismisses after 4 seconds", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "success" }));
    expect(screen.getByText("Saved!")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
  });

  it("handles multiple toasts at once", () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "success" }));
    fireEvent.click(screen.getByRole("button", { name: "error" }));
    expect(screen.getByText("Saved!")).toBeInTheDocument();
    expect(screen.getByText("Oops")).toBeInTheDocument();
  });
});