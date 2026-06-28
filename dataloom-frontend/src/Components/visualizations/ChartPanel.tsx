import { useState } from "react";
import { getChart, type ChartParams, type ChartSpec, type ChartType } from "../../api/visualizations";
import { useProjectContext } from "../../context/ProjectContext";
import useChartSuggestions from "../../hooks/useChartSuggestions";
import useCorrelation from "../../hooks/useCorrelation";
import CorrelationHeatmap from "../profiling/CorrelationHeatmap";
import ChartBuilder from "./ChartBuilder";
import ChartRenderer from "./ChartRenderer";
import { isNumeric } from "./chartFields";
import SuggestionCard from "./SuggestionCard";

interface ChartPanelProps {
  projectId: string;
  onClose: () => void;
}

const TYPE_LABEL: Record<ChartType, string> = {
  histogram: "Histogram",
  bar: "Bar",
  line: "Line",
  area: "Area",
  scatter: "Scatter",
  pie: "Pie",
};

/** Short, honest note about how the data was reduced for rendering. */
function MetaNote({ spec }: { spec: ChartSpec }) {
  const notes: string[] = [];
  if (spec.meta?.sampled) notes.push("showing a sample of the data");
  if (spec.meta?.truncated) notes.push("less frequent values grouped");
  if (notes.length === 0) return null;
  return <p className="mt-2 text-xs italic text-gray-400">{notes.join(" · ")}</p>;
}

/**
 * Visualization panel: auto-suggested charts plus a no-code builder, rendered
 * from the project's current (transformed) dataset. The correlation heatmap is
 * one of the visualizations here, not a separate panel. Mirrors the chrome of
 * the profiling panels (see DatasetSummaryPanel).
 */
export default function ChartPanel({ projectId, onClose }: ChartPanelProps) {
  const { columns, dtypes, dataVersion } = useProjectContext();
  const { suggestions, error, refetch } = useChartSuggestions(projectId, true, dataVersion);

  // "chart" shows a built/suggested Recharts chart; "heatmap" shows correlation.
  const [mode, setMode] = useState<"chart" | "heatmap">("chart");
  const [spec, setSpec] = useState<ChartSpec | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<number | "heatmap" | null>(null);
  const [chartError, setChartError] = useState(false);

  // Correlation only fetches once the heatmap is actually shown.
  const correlation = useCorrelation(projectId, mode === "heatmap", dataVersion);
  const hasCorrelation = columns.filter((c) => isNumeric(dtypes[c])).length >= 2;

  const showHeatmap = () => {
    setMode("heatmap");
    setSpec(null);
    setChartError(false);
    setActiveSuggestion("heatmap");
  };

  const renderParams = async (params: ChartParams) => {
    setMode("chart");
    setActiveSuggestion(null);
    setChartError(false);
    try {
      setSpec(await getChart(projectId, params));
    } catch (err) {
      console.error("Error building chart:", err);
      setChartError(true);
      setSpec(null);
    }
  };

  return (
    <div data-testid="chart-panel" className="group relative mx-auto border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Charts</h3>
        <button
          type="button"
          onClick={onClose}
          className="font-medium text-gray-400 opacity-0 hover:text-gray-600 focus-visible:opacity-100 group-hover:opacity-100"
          style={{
            transition: "opacity 0.3s",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      {/* Suggestions */}
      {error ? (
        <div className="py-2 text-sm text-gray-500">
          Couldn’t load suggestions.{" "}
          <button
            type="button"
            onClick={refetch}
            className="font-medium text-blue-600 hover:text-blue-800"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      ) : (hasCorrelation || (suggestions && suggestions.length > 0)) ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {hasCorrelation && (
            <SuggestionCard
              typeLabel="Heatmap"
              title="Correlation between numeric columns"
              active={activeSuggestion === "heatmap"}
              onSelect={showHeatmap}
            />
          )}
          {suggestions?.map((suggestion, i) => (
            <SuggestionCard
              key={i}
              typeLabel={TYPE_LABEL[suggestion.chart_type]}
              title={suggestion.title}
              active={activeSuggestion === i}
              onSelect={() => {
                setMode("chart");
                setSpec(suggestion);
                setActiveSuggestion(i);
                setChartError(false);
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Builder */}
      <div className="mb-4">
        <ChartBuilder
          columns={columns}
          dtypes={dtypes}
          onSubmit={renderParams}
          onSelectHeatmap={showHeatmap}
        />
      </div>

      {/* Visualization area */}
      {mode === "heatmap" ? (
        <CorrelationHeatmap
          correlation={correlation.correlation}
          error={correlation.error}
          onRetry={correlation.refetch}
        />
      ) : chartError ? (
        <div className="py-10 text-center text-sm text-gray-500">Couldn’t build that chart.</div>
      ) : spec ? (
        <div>
          <h4 className="mb-1 text-center text-sm font-medium text-gray-700">{spec.title}</h4>
          <ChartRenderer spec={spec} />
          <MetaNote spec={spec} />
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-gray-400">
          Pick a suggestion or build a chart to get started.
        </div>
      )}
    </div>
  );
}
