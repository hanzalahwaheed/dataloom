import { LuX, LuChevronDown, LuChevronUp, LuTable2, LuHistory, LuBookmark } from "react-icons/lu";
import PropTypes from "prop-types";

const TABS = [
  { id: "results", label: "Results", icon: LuTable2 },
  { id: "logs", label: "Logs", icon: LuHistory },
  { id: "checkpoints", label: "Checkpoints", icon: LuBookmark },
];

function ResultsTable({ data }) {
  if (!data || !data.columns || !data.rows) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Run a transformation to see results here.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full text-xs">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              #
            </th>
            {data.columns.map((col, i) => (
              <th
                key={i}
                className="px-3 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-100 hover:bg-blue-50/40">
              <td className="px-3 py-1 text-gray-400 tabular-nums">{ri + 1}</td>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1 text-gray-700 whitespace-nowrap">
                  {cell === null || cell === undefined ? <span className="text-gray-300 italic">NULL</span> : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsTable({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        No transformation logs yet.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full text-xs">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Action
            </th>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Timestamp
            </th>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Checkpoint
            </th>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Applied
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-gray-100 hover:bg-blue-50/40">
              <td className="px-3 py-1.5 text-gray-700 font-medium">{log.action_type}</td>
              <td className="px-3 py-1.5 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="px-3 py-1.5 text-gray-500 font-mono text-[10px]">{log.checkpoint_id || "—"}</td>
              <td className="px-3 py-1.5">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    log.applied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {log.applied ? "Yes" : "No"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CheckpointsTable({ checkpoints, onRevert }) {
  const hasCheckpoints =
    checkpoints && (Array.isArray(checkpoints) ? checkpoints.length > 0 : checkpoints.id);

  if (!hasCheckpoints) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        No checkpoints saved yet. Use Save to create one.
      </div>
    );
  }

  const items = Array.isArray(checkpoints) ? checkpoints : [checkpoints];

  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full text-xs">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Message
            </th>
            <th className="px-3 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Created
            </th>
            <th className="px-3 py-1.5 text-center font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((cp) => (
            <tr key={cp.id} className="border-b border-gray-100 hover:bg-blue-50/40">
              <td className="px-3 py-1.5 text-gray-700">{cp.message}</td>
              <td className="px-3 py-1.5 text-gray-500">{new Date(cp.created_at).toLocaleString()}</td>
              <td className="px-3 py-1.5 text-center">
                <button
                  onClick={() => onRevert(cp.id)}
                  className="rounded bg-blue-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-600"
                >
                  Revert
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BottomPanel({
  activeTab,
  onTabChange,
  onClose,
  onToggleSize,
  isMaximized,
  resultData,
  logs,
  checkpoints,
  onRevert,
}) {
  return (
    <div className="flex flex-col h-full border-t border-gray-200 bg-white">
      <div className="flex items-center border-b border-gray-200 bg-gray-50/80 px-1">
        <div className="flex items-center gap-0 flex-1 min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === "results" && resultData?.row_count != null && (
                <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0 text-[10px] text-gray-600">
                  {resultData.row_count}
                </span>
              )}
              {tab.id === "logs" && logs?.length > 0 && (
                <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0 text-[10px] text-gray-600">
                  {logs.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 pr-1">
          <button
            onClick={onToggleSize}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            title={isMaximized ? "Restore panel" : "Maximize panel"}
          >
            {isMaximized ? <LuChevronDown className="h-3.5 w-3.5" /> : <LuChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            title="Close panel"
          >
            <LuX className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === "results" && <ResultsTable data={resultData} />}
        {activeTab === "logs" && <LogsTable logs={logs} />}
        {activeTab === "checkpoints" && (
          <CheckpointsTable checkpoints={checkpoints} onRevert={onRevert} />
        )}
      </div>
    </div>
  );
}

BottomPanel.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onToggleSize: PropTypes.func.isRequired,
  isMaximized: PropTypes.bool.isRequired,
  resultData: PropTypes.object,
  logs: PropTypes.array,
  checkpoints: PropTypes.object,
  onRevert: PropTypes.func.isRequired,
};
