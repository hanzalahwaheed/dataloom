import { useEffect, useState } from "react";
import {
  LuArrowUpDown,
  LuBookmark,
  LuCode,
  LuCopyMinus,
  LuDownload,
  LuFilter,
  LuHistory,
  LuPanelRightClose,
  LuRefreshCw,
  LuSave,
  LuScissors,
  LuTable2,
} from "react-icons/lu";
import AdvQueryFilterForm from "../forms/AdvQueryFilterForm";
import CastDataTypeForm from "../forms/CastDataTypeForm";
import DropDuplicateForm from "../forms/DropDuplicateForm";
import FilterForm from "../forms/FilterForm";
import PivotTableForm from "../forms/PivotTableForm";
import SortForm from "../forms/SortForm";
import TrimWhitespaceForm from "../forms/TrimWhitespaceForm";
import WorkspaceVisualizePanel from "./WorkspaceVisualizePanel";

const TOOL_ITEMS = [
  { id: "filter", label: "Filter", icon: LuFilter },
  { id: "sort", label: "Sort", icon: LuArrowUpDown },
  { id: "dropDuplicate", label: "Drop Dup", icon: LuCopyMinus },
  { id: "advQueryFilter", label: "Adv Query", icon: LuCode },
  { id: "pivotTables", label: "Pivot", icon: LuTable2 },
  { id: "castDataType", label: "Cast Type", icon: LuRefreshCw },
  { id: "trimWhitespace", label: "Trim", icon: LuScissors },
];

function ToolButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
        active ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export default function WorkspaceRightPanel({
  projectId,
  onTransform,
  onResult,
  onSave,
  onExport,
  onShowLogs,
  onShowCheckpoints,
  onClose,
}) {
  const [panelMode, setPanelMode] = useState("transform");
  const [activeTool, setActiveTool] = useState("filter");

  useEffect(() => {
    setPanelMode("transform");
    setActiveTool("filter");
  }, [projectId]);

  const commonFormProps = {
    projectId,
    onClose: () => {},
    onResult,
  };

  return (
    <aside className="h-full border-l border-gray-200 bg-white min-h-0 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            title="Close panel"
          >
            <LuPanelRightClose className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="mt-2 inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
          <button
            onClick={() => setPanelMode("transform")}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              panelMode === "transform"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Transform
          </button>
          <button
            onClick={() => setPanelMode("visualize")}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              panelMode === "visualize"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Visualize
          </button>
        </div>

        {/* Quick actions */}
        <div className="mt-2 grid grid-cols-4 gap-1">
          <button
            onClick={onSave}
            className="flex flex-col items-center gap-0.5 rounded-md bg-blue-500 px-1 py-1.5 text-white hover:bg-blue-600"
            title="Save checkpoint"
          >
            <LuSave className="h-3.5 w-3.5" />
            <span className="text-[9px] font-medium">Save</span>
          </button>
          <button
            onClick={onExport}
            className="flex flex-col items-center gap-0.5 rounded-md border border-gray-200 px-1 py-1.5 text-gray-600 hover:bg-gray-50"
            title="Export CSV"
          >
            <LuDownload className="h-3.5 w-3.5" />
            <span className="text-[9px] font-medium">Export</span>
          </button>
          <button
            onClick={onShowLogs}
            className="flex flex-col items-center gap-0.5 rounded-md border border-gray-200 px-1 py-1.5 text-gray-600 hover:bg-gray-50"
            title="View logs"
          >
            <LuHistory className="h-3.5 w-3.5" />
            <span className="text-[9px] font-medium">Logs</span>
          </button>
          <button
            onClick={onShowCheckpoints}
            className="flex flex-col items-center gap-0.5 rounded-md border border-gray-200 px-1 py-1.5 text-gray-600 hover:bg-gray-50"
            title="View checkpoints"
          >
            <LuBookmark className="h-3.5 w-3.5" />
            <span className="text-[9px] font-medium">Revert</span>
          </button>
        </div>
      </div>

      {/* Tool selector */}
      {panelMode === "transform" && (
        <div className="border-b border-gray-200 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {TOOL_ITEMS.map((tool) => (
              <ToolButton
                key={tool.id}
                active={activeTool === tool.id}
                icon={tool.icon}
                label={tool.label}
                onClick={() => setActiveTool(tool.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active form — forms only, results go to bottom panel */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 bg-gray-50/40">
        {panelMode === "visualize" && <WorkspaceVisualizePanel />}

        {panelMode === "transform" && (
          <>
            {activeTool === "filter" && <FilterForm {...commonFormProps} />}
            {activeTool === "sort" && <SortForm {...commonFormProps} />}
            {activeTool === "dropDuplicate" && (
              <DropDuplicateForm {...commonFormProps} onTransform={onTransform} />
            )}
            {activeTool === "advQueryFilter" && <AdvQueryFilterForm {...commonFormProps} />}
            {activeTool === "pivotTables" && <PivotTableForm {...commonFormProps} />}
            {activeTool === "castDataType" && (
              <CastDataTypeForm {...commonFormProps} onTransform={onTransform} />
            )}
            {activeTool === "trimWhitespace" && (
              <TrimWhitespaceForm {...commonFormProps} onTransform={onTransform} />
            )}
          </>
        )}
      </div>
    </aside>
  );
}
