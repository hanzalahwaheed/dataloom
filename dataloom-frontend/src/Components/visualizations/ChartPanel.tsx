import { useState } from "react";
import { getChart, type ChartParams, type ChartSpec } from "../../api/visualizations";
import { useProjectContext } from "../../context/ProjectContext";
import useChartSuggestions from "../../hooks/useChartSuggestions";
import ChartBuilder from "./ChartBuilder";
import ChartRenderer from "./ChartRenderer";
import SuggestionCard from "./SuggestionCard";

interface ChartPanelProps {
  projectId: string;
  onClose: () => void;
}

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
 * from the project's current (transformed) dataset. Mirrors the chrome of the
 * profiling panels (see DatasetSummaryPanel).
 */
export default function ChartPanel({ projectId, onClose }: ChartPanelProps) {
  const { columns, dtypes, dataVersion } = useProjectContext();
  const { suggestions, error, refetch } = useChartSuggestions(projectId, true, dataVersion);

  const [spec, setSpec] = useState<ChartSpec | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);
  const [chartError, setChartError] = useState(false);

  const renderParams = async (params: ChartParams) => {
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
    <div
      data-testid="chart-panel"
      className="group relative mx-auto border border-gray-200 bg-white p-4"
    >
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
      ) : suggestions && suggestions.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <SuggestionCard
              key={i}
              spec={suggestion}
              active={activeSuggestion === i}
              onSelect={() => {
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
        <ChartBuilder columns={columns} dtypes={dtypes} onSubmit={renderParams} />
      </div>

      {/* Chart area */}
      {chartError ? (
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
