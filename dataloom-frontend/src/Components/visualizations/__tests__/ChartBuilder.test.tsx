import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChartBuilder from "../ChartBuilder";

const columns = ["region", "revenue", "cost"];
const dtypes = { region: "str", revenue: "int", cost: "float" };

// ColumnSelect reads columns/dtypes from context (for its dtype badges).
vi.mock("../../../context/ProjectContext", () => ({
  useProjectContext: () => ({ columns, dtypes }),
}));

function renderBuilder() {
  const onSubmit = vi.fn();
  render(<ChartBuilder columns={columns} dtypes={dtypes} onSubmit={onSubmit} />);
  return onSubmit;
}

const renderButton = () => screen.getByRole("button", { name: "Render" });

/** Open the popover trigger with the given testid and click an option by name.
 * Scopes to the open panel: a just-closed popover stays mounted (close
 * animation), so its options linger in the DOM and would match too. */
function pick(testid: string, name: RegExp | string) {
  fireEvent.click(screen.getByTestId(testid));
  const panel = document.querySelector('[data-state="open"]') as HTMLElement;
  fireEvent.click(within(panel).getByRole("option", { name }));
}

describe("ChartBuilder", () => {
  it("disables Render until a valid configuration is chosen", () => {
    const onSubmit = renderBuilder();
    // Histogram is the default and starts with no column selected.
    expect(renderButton()).toBeDisabled();

    pick("histogram-column", /revenue/);
    expect(renderButton()).toBeEnabled();

    fireEvent.click(renderButton());
    expect(onSubmit).toHaveBeenCalledWith({ chart_type: "histogram", column: "revenue", bins: 20 });
  });

  it("offers only numeric columns for a histogram", () => {
    renderBuilder();
    fireEvent.click(screen.getByTestId("histogram-column"));
    const names = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(names).toHaveLength(2);
    expect(names!.join(" ")).toContain("revenue");
    expect(names!.join(" ")).toContain("cost");
    expect(names!.join(" ")).not.toContain("region");
  });

  it("disables the value field when the bar aggregation is count", () => {
    renderBuilder();
    pick("chart-type-select", "Bar");

    pick("agg-select", "Count");
    expect(screen.getByTestId("value-select")).toBeDisabled();
    // Category alone is enough for a count bar chart.
    pick("category-select", /region/);
    expect(renderButton()).toBeEnabled();

    pick("agg-select", "Sum");
    // Sum needs a value column, so Render is blocked again until one is picked.
    expect(screen.getByTestId("value-select")).toBeEnabled();
    expect(renderButton()).toBeDisabled();
  });

  it("requires both axes for a scatter plot", () => {
    const onSubmit = renderBuilder();
    pick("chart-type-select", "Scatter");

    pick("x-select", /revenue/);
    expect(renderButton()).toBeDisabled();
    pick("y-select", /cost/);
    expect(renderButton()).toBeEnabled();

    fireEvent.click(renderButton());
    expect(onSubmit).toHaveBeenCalledWith({
      chart_type: "scatter",
      x: "revenue",
      y: ["cost"],
      color: undefined,
    });
  });
});
