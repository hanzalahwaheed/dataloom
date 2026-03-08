import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useProjectContext } from "../context/ProjectContext";
import {
  exportProject,
  getCheckpoints,
  getLogs,
  revertToCheckpoint,
  saveProject,
} from "../api";
import Table from "./Table";
import WorkspaceLeftRail from "./workspace/WorkspaceLeftRail";
import WorkspaceRightPanel from "./workspace/WorkspaceRightPanel";
import BottomPanel from "./workspace/BottomPanel";
import InputDialog from "./common/InputDialog";
import ConfirmDialog from "./common/ConfirmDialog";
import Toast from "./common/Toast";
import { LuExternalLink, LuPanelRight, LuPanelBottom } from "react-icons/lu";

export default function DataScreen() {
  const { projectId } = useParams();
  const { setProjectInfo, refreshProject, projectName, rows } = useProjectContext();

  // Table data from transform operations that modify the working copy
  const [tableData, setTableData] = useState(null);

  // Bottom panel state
  const [bottomOpen, setBottomOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState("results");
  const [bottomMaximized, setBottomMaximized] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [checkpoints, setCheckpoints] = useState(null);

  // Right panel state
  const [rightOpen, setRightOpen] = useState(true);

  // Dialogs
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (projectId) {
      setProjectInfo(projectId);
      refreshProject(projectId);
    }
  }, [projectId, setProjectInfo, refreshProject]);

  // --- Action handlers (lifted from old WorkspaceRightPanel) ---

  const handleTransform = (data) => {
    setTableData(data);
  };

  const handleResult = useCallback((data) => {
    setResultData(data);
    setBottomTab("results");
    setBottomOpen(true);
  }, []);

  const handleSave = () => setIsInputOpen(true);

  const handleSubmitCommit = async (message) => {
    setIsInputOpen(false);
    if (!message?.trim()) return;
    try {
      const response = await saveProject(projectId, message);
      handleTransform(response);
      setToast({ message: "Project saved.", type: "success" });
    } catch (error) {
      console.error("Save failed", error);
      setToast({ message: "Save failed.", type: "error" });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportProject(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
      setToast({ message: "Export failed.", type: "error" });
    }
  };

  const handleShowLogs = useCallback(async () => {
    try {
      const data = await getLogs(projectId);
      setLogs(data);
      setBottomTab("logs");
      setBottomOpen(true);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setToast({ message: "Failed to fetch logs.", type: "error" });
    }
  }, [projectId]);

  const handleShowCheckpoints = useCallback(async () => {
    try {
      const data = await getCheckpoints(projectId);
      setCheckpoints(data);
      setBottomTab("checkpoints");
      setBottomOpen(true);
    } catch (error) {
      console.error("Error fetching checkpoints:", error);
      setCheckpoints(null);
      setBottomTab("checkpoints");
      setBottomOpen(true);
    }
  }, [projectId]);

  const handleRevert = (checkpointId) => {
    setConfirmData({
      message: "Revert working copy to this checkpoint?",
      onConfirm: async () => {
        try {
          const response = await revertToCheckpoint(projectId, checkpointId);
          handleTransform(response);
          setToast({ message: "Reverted successfully.", type: "success" });
        } catch (error) {
          console.error("Revert failed", error);
          setToast({ message: "Revert failed.", type: "error" });
        } finally {
          setConfirmData(null);
        }
      },
    });
  };

  const openPlainCsv = () => {
    if (!projectId) return;
    window.open(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4200"}/projects/${projectId}/export`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // --- Layout grid ---
  // Columns: left-rail | center+bottom | right-panel(optional)
  // Center is split vertically: table on top, bottom panel below

  const gridCols = rightOpen ? "grid-cols-[280px_1fr_320px]" : "grid-cols-[280px_1fr]";

  return (
    <div className={`h-[calc(100vh-3rem)] min-h-0 grid ${gridCols} bg-white`}>
      {/* === Left Rail === */}
      <WorkspaceLeftRail />

      {/* === Center: tab bar + table + bottom panel + status bar === */}
      <section className="min-h-0 flex flex-col">
        {/* Tab bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-gray-50/60">
          <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {projectName || "Active Table"}
          </div>
          <button
            onClick={openPlainCsv}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          >
            Open CSV
            <LuExternalLink className="h-3 w-3" />
          </button>
          {!rightOpen && (
            <button
              onClick={() => setRightOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Open actions panel"
            >
              <LuPanelRight className="h-3 w-3" />
            </button>
          )}
          {!bottomOpen && (
            <button
              onClick={() => setBottomOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Open output panel"
            >
              <LuPanelBottom className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Main table + bottom panel */}
        <div className="min-h-0 flex-1 flex flex-col">
          {/* Table area */}
          <div
            className="min-h-0 flex-1"
            style={bottomOpen && !bottomMaximized ? { flex: "1 1 60%" } : bottomMaximized ? { flex: "0 0 0px", overflow: "hidden" } : {}}
          >
            <Table projectId={projectId} data={tableData} fitContainer />
          </div>

          {/* Bottom panel */}
          {bottomOpen && (
            <div
              className="min-h-0 shrink-0"
              style={bottomMaximized ? { flex: "1 1 100%" } : { flex: "0 0 40%", maxHeight: "50%" }}
            >
              <BottomPanel
                activeTab={bottomTab}
                onTabChange={setBottomTab}
                onClose={() => { setBottomOpen(false); setBottomMaximized(false); }}
                onToggleSize={() => setBottomMaximized((v) => !v)}
                isMaximized={bottomMaximized}
                resultData={resultData}
                logs={logs}
                checkpoints={checkpoints}
                onRevert={handleRevert}
              />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="border-t border-gray-200 bg-gray-50/80 px-3 py-1 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>Rows: <strong className="text-gray-700">{rows.length}</strong></span>
            {resultData?.row_count != null && (
              <span>Result: <strong className="text-gray-700">{resultData.row_count}</strong></span>
            )}
            {resultData?.operation_type && (
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">{resultData.operation_type}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openPlainCsv}
              className="rounded border border-gray-200 px-2 py-0.5 text-gray-600 hover:bg-gray-100"
            >
              Export
            </button>
          </div>
        </div>
      </section>

      {/* === Right Panel === */}
      {rightOpen && (
        <WorkspaceRightPanel
          projectId={projectId}
          onTransform={handleTransform}
          onResult={handleResult}
          onSave={handleSave}
          onExport={handleExport}
          onShowLogs={handleShowLogs}
          onShowCheckpoints={handleShowCheckpoints}
          onClose={() => setRightOpen(false)}
        />
      )}

      {/* === Dialogs === */}
      <InputDialog
        isOpen={isInputOpen}
        message="Enter a commit message for this save:"
        onSubmit={handleSubmitCommit}
        onCancel={() => setIsInputOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!confirmData}
        message={confirmData?.message}
        onConfirm={confirmData?.onConfirm}
        onCancel={() => setConfirmData(null)}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
