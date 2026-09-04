import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

const setup = (overrides = {}) =>
  render(
    <ConfirmDialog
      open
      title="Delete destination"
      message="This cannot be undone."
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />
  );

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="T"
        message="M"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the title and message when open", () => {
    setup();
    expect(screen.getByText("Delete destination")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm is clicked", () => {
    const onConfirm = vi.fn();
    setup({ onConfirm, confirmLabel: "Delete" });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel is clicked", () => {
    const onCancel = vi.fn();
    setup({ onCancel });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the backdrop is clicked", () => {
    const onCancel = vi.fn();
    const { container } = setup({ onCancel });
    const backdrop = container.querySelector(".bg-black\\/50");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("has dialog semantics", () => {
    setup();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});