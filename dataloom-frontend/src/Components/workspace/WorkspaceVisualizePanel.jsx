import { useMemo, useState } from "react";
import { useProjectContext } from "../../context/ProjectContext";

const CHART_TYPES = [
  { id: "histogram", label: "Histogram" },
  { id: "bar", label: "Bar" },
  { id: "scatter", label: "Scatter" },
  { id: "timeseries", label: "Time Series" },
];

export default function WorkspaceVisualizePanel() {
  const { columns, rows } = useProjectContext();
  const [chartType, setChartType] = useState("histogram");
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [aggregation, setAggregation] = useState("count");

  const isYColumnRequired = chartType === "scatter" || chartType === "timeseries";

  const canConfigure = useMemo(() => {
    if (!xColumn) return false;
    if (isYColumnRequired && !yColumn) return false;
    return true;
  }, [xColumn, yColumn, isYColumnRequired]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Visualize</h4>
        <p className="mt-1 text-xs text-gray-500">
          UX scaffold for charts is ready. Rendering logic can be plugged in next.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CHART_TYPES.map((item) => (
          <button
            key={item.id}
            onClick={() => setChartType(item.id)}
            className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
              chartType === item.id
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">X Column</label>
          <select
            value={xColumn}
            onChange={(e) => setXColumn(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select column...</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Y Column {isYColumnRequired ? "" : "(Optional)"}
          </label>
          <select
            value={yColumn}
            onChange={(e) => setYColumn(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{isYColumnRequired ? "Select column..." : "None"}</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Aggregation</label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="count">Count</option>
            <option value="sum">Sum</option>
            <option value="mean">Mean</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
          </select>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Chart canvas</span>
          <span>
            {rows.length} rows · {columns.length} columns
          </span>
        </div>
        <div className="mt-2 h-40 rounded-md border border-gray-200 bg-white flex items-center justify-center text-center text-xs text-gray-400 px-4">
          {canConfigure
            ? "Preview placeholder. Chart rendering will be connected in the next step."
            : "Select chart inputs to prepare the preview configuration."}
        </div>
      </div>

      <button
        disabled
        className="mt-3 w-full rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
      >
        Render Chart (Coming Soon)
      </button>
    </div>
  );
}

