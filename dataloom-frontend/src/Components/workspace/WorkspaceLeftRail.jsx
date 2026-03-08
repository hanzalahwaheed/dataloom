import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuArrowLeft,
  LuColumns3,
  LuDatabase,
  LuHash,
  LuSearch,
  LuRows3,
  LuTable2,
} from "react-icons/lu";
import { useProjectContext } from "../../context/ProjectContext";

const DTYPE_ICON_COLORS = {
  int: "text-blue-500",
  float: "text-teal-500",
  str: "text-green-500",
  datetime: "text-purple-500",
  bool: "text-orange-500",
};

const DTYPE_LABELS = {
  int: "integer",
  float: "float",
  str: "string",
  datetime: "datetime",
  bool: "boolean",
};

export default function WorkspaceLeftRail() {
  const navigate = useNavigate();
  const { projectName, columns, rows, dtypes } = useProjectContext();
  const [query, setQuery] = useState("");

  const filteredColumns = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return columns;
    return columns.filter((col) => col.toLowerCase().includes(q));
  }, [columns, query]);

  return (
    <aside className="h-full border-r border-gray-200 bg-gray-50/70 flex min-h-0">
      {/* Activity bar */}
      <div className="w-10 border-r border-gray-200 bg-white flex flex-col items-center py-3 gap-1 text-gray-400">
        <button
          onClick={() => navigate("/")}
          className="rounded-md p-2 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Back to projects"
        >
          <LuArrowLeft className="h-4 w-4" />
        </button>
        <div className="w-5 border-t border-gray-200 my-1" />
        <button
          className="rounded-md p-2 bg-gray-100 text-gray-900"
          title="Schema"
        >
          <LuDatabase className="h-4 w-4" />
        </button>
      </div>

      {/* Schema panel */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* Project header */}
        <div className="px-3 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <LuTable2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <h2 className="text-xs font-semibold text-gray-900 truncate">
              {projectName || "Untitled"}
            </h2>
          </div>

          {/* Quick stats */}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <LuRows3 className="h-3 w-3" />
              {rows.length} rows
            </span>
            <span className="inline-flex items-center gap-1">
              <LuColumns3 className="h-3 w-3" />
              {columns.length} cols
            </span>
          </div>
        </div>

        {/* Column heading + search */}
        <div className="px-3 pt-3 pb-2">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Columns
          </h3>
          <label className="flex items-center rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-500">
            <LuSearch className="mr-1.5 h-3 w-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter columns…"
              className="w-full bg-transparent text-xs text-gray-700 outline-none"
            />
          </label>
        </div>

        {/* Column list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredColumns.map((col) => {
            const dtype = dtypes[col];
            const colorClass = DTYPE_ICON_COLORS[dtype] || "text-gray-400";
            const label = DTYPE_LABELS[dtype] || dtype || "unknown";

            return (
              <div
                key={col}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white hover:shadow-sm transition-all group"
              >
                <LuHash className={`h-3 w-3 shrink-0 ${colorClass}`} />
                <span className="flex-1 min-w-0 truncate text-gray-700 font-medium">
                  {col}
                </span>
                <span className={`shrink-0 text-[10px] ${colorClass}`}>
                  {label}
                </span>
              </div>
            );
          })}

          {filteredColumns.length === 0 && columns.length > 0 && (
            <div className="px-2 py-3 text-[11px] text-gray-400 text-center">
              No columns match "{query}"
            </div>
          )}

          {columns.length === 0 && (
            <div className="px-2 py-3 text-[11px] text-gray-400 text-center">
              Loading schema…
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
