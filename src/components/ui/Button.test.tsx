import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Sign In</Button>);
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Button disabled>Locked</Button>);
    expect(screen.getByRole("button", { name: "Locked" })).toBeDisabled();
  });

  it("is disabled while loading", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole("button", { name: "Loading" })).toBeDisabled();
  });

  it("shows a spinner while loading", () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument();
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        No-op
      </Button>
    );
    fireEvent.click(screen.getByRole("button", { name: "No-op" }));
    expect(handleClick).not.toHaveBeenCalled();
  });
});