import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, Badge, Skeleton, EmptyState, DataStatusBadge } from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies extra className", () => {
    const { container } = render(<Card className="border-red-500">X</Card>);
    expect(container.firstChild).toHaveClass("border-red-500");
  });

  it("applies elevated variant shadow", () => {
    const { container } = render(<Card variant="elevated">X</Card>);
    expect(container.firstChild).toHaveClass("shadow-lg");
  });
});

describe("Badge", () => {
  it("renders its text", () => {
    render(<Badge>traveller</Badge>);
    expect(screen.getByText("traveller")).toBeInTheDocument();
  });

  it("applies error variant styles", () => {
    render(<Badge variant="error">admin</Badge>);
    expect(screen.getByText("admin")).toHaveClass("bg-red-100");
  });
});

describe("Skeleton", () => {
  it("renders the requested number of lines", () => {
    const { container } = render(<Skeleton lines={4} />);
    expect(container.querySelectorAll(".animate-pulse > div")).toHaveLength(4);
  });

  it("defaults to one line", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelectorAll(".animate-pulse > div")).toHaveLength(1);
  });
});

describe("EmptyState", () => {
  it("shows title and description", () => {
    render(<EmptyState title="No trips" description="Plan one to get started" />);
    expect(screen.getByText("No trips")).toBeInTheDocument();
    expect(screen.getByText("Plan one to get started")).toBeInTheDocument();
  });

  it("renders an optional action", () => {
    render(<EmptyState title="Empty" action={<button>Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});

describe("DataStatusBadge", () => {
  it.each([
    ["LIVE", "LIVE"],
    ["ESTIMATED", "ESTIMATED"],
    ["VERIFIED", "VERIFIED"],
    ["LAST_UPDATED", "LAST UPDATED"],
  ] as const)('renders "%s" as "%s"', (status, label) => {
    render(<DataStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});