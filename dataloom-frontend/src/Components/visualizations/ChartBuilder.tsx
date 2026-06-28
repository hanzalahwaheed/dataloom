import { useMemo, useState } from "react";
import type { AggFunc, ChartParams, ChartType } from "../../api/visualizations";
import ColumnSelect from "../common/ColumnSelect";
import Select, { type SelectOption } from "../common/Select";
import { columnsFor, usesAgg, usesBins, type Dtypes } from "./chartFields";

// "heatmap" is a frontend-only builder option: correlation has its own data shape
// and CSS renderer (CorrelationHeatmap), so it doesn't go through the chart endpoint.
type BuilderType = ChartType | "heatmap";

interface ChartBuilderProps {
  columns: string[];
  dtypes: Dtypes;
  onSubmit: (params: ChartParams) => void;
  /** Invoked when the correlation-heatmap option is rendered. */
  onSelectHeatmap: () => void;
}

const BASE_TYPES: SelectOption[] = [
  { value: "histogram", label: "Histogram" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "scatter", label: "Scatter" },
  { value: "pie", label: "Pie" },
];

const AGG_OPTIONS: SelectOption[] = (["sum", "mean", "median", "min", "max", "count"] as AggFunc[]).map(
  (a) => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) }),
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-44 flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </div>
  );
}

/**
 * No-code chart builder. Column dropdowns are filtered to the dtypes each chart
 * type accepts, and controls (aggregation, bins) appear only when relevant, so an
 * invalid configuration cannot be assembled or submitted. Built from the shared
 * Select / ColumnSelect components used across the transform forms.
 */
export default function ChartBuilder({
  columns,
  dtypes,
  onSubmit,
  onSelectHeatmap,
}: ChartBuilderProps) {
  const [chartType, setChartType] = useState<BuilderType>("histogram");
  const [column, setColumn] = useState("");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [color, setColor] = useState("");
  const [agg, setAgg] = useState<AggFunc>("sum");
  const [bins, setBins] = useState(20);

  const numericCols = useMemo(() => columnsFor("value", columns, dtypes), [columns, dtypes]);
  const xCols = useMemo(() => columnsFor("x", columns, dtypes), [columns, dtypes]);

  // Correlation needs two numeric columns; only offer it when that's possible.
  const typeOptions = useMemo<SelectOption[]>(
    () =>
      numericCols.length >= 2
        ? [...BASE_TYPES, { value: "heatmap", label: "Correlation heatmap" }]
        : BASE_TYPES,
    [numericCols.length],
  );

  const params = useMemo<ChartParams | null>(() => {
    switch (chartType) {
      case "histogram":
        return column ? { chart_type: "histogram", column, bins } : null;
      case "bar":
        if (!category) return null;
        if (agg !== "count" && !value) return null;
        return { chart_type: "bar", category, value: agg === "count" ? undefined : value, agg };
      case "pie":
        return category ? { chart_type: "pie", category, value: value || undefined } : null;
      case "line":
      case "area":
        return x && y ? { chart_type: chartType, x, y: [y] } : null;
      case "scatter":
        return x && y ? { chart_type: "scatter", x, y: [y], color: color || undefined } : null;
      default:
        return null;
    }
  }, [chartType, column, category, value, x, y, color, agg, bins]);

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Chart type">
          <Select
            data-testid="chart-type-select"
            value={chartType}
            onChange={(v) => setChartType(v as BuilderType)}
            options={typeOptions}
          />
        </Field>

        {chartType === "histogram" && (
          <Field label="Column">
            <ColumnSelect
              data-testid="histogram-column"
              value={column}
              onChange={setColumn}
              options={numericCols}
            />
          </Field>
        )}

        {(chartType === "bar" || chartType === "pie") && (
          <Field label="Category">
            <ColumnSelect
              data-testid="category-select"
              value={category}
              onChange={setCategory}
              options={columns}
            />
          </Field>
        )}

        {usesAgg(chartType) && (
          <Field label="Aggregation">
            <Select
              data-testid="agg-select"
              value={agg}
              onChange={(v) => setAgg(v as AggFunc)}
              options={AGG_OPTIONS}
            />
          </Field>
        )}

        {(chartType === "bar" || chartType === "pie") && (
          <Field label={chartType === "pie" ? "Value (optional)" : "Value"}>
            <ColumnSelect
              data-testid="value-select"
              value={value}
              onChange={setValue}
              options={numericCols}
              disabled={chartType === "bar" && agg === "count"}
              includeEmptyOption={chartType === "pie"}
              emptyLabel="Count"
            />
          </Field>
        )}

        {(chartType === "line" || chartType === "area" || chartType === "scatter") && (
          <>
            <Field label="X axis">
              <ColumnSelect
                data-testid="x-select"
                value={x}
                onChange={setX}
                options={chartType === "scatter" ? numericCols : xCols}
              />
            </Field>
            <Field label="Y axis">
              <ColumnSelect data-testid="y-select" value={y} onChange={setY} options={numericCols} />
            </Field>
          </>
        )}

        {chartType === "scatter" && (
          <Field label="Color (optional)">
            <ColumnSelect
              data-testid="color-select"
              value={color}
              onChange={setColor}
              options={columns}
              includeEmptyOption
              emptyLabel="None"
            />
          </Field>
        )}

        {usesBins(chartType) && (
          <Field label={`Bins: ${bins}`}>
            <input
              type="range"
              min={2}
              max={60}
              value={bins}
              onChange={(e) => setBins(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </Field>
        )}

        <button
          type="button"
          onClick={() => {
            if (chartType === "heatmap") onSelectHeatmap();
            else if (params) onSubmit(params);
          }}
          disabled={chartType !== "heatmap" && !params}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Render
        </button>
      </div>
    </div>
  );
}
