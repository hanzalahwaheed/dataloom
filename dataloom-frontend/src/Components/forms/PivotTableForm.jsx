import { useState } from "react";
import PropTypes from "prop-types";
import TransformResultPreview from "./TransformResultPreview";
import { transformProject } from "../../api";
import useError from "../../hooks/useError";
import FormErrorAlert from "../common/FormErrorAlert";
import { useProjectContext } from "../../context/ProjectContext";

const PivotTableForm = ({ projectId, onClose, onResult }) => {
  const { columns } = useProjectContext();
  const [index, setIndex] = useState("");
  const [column, setColumn] = useState("");
  const [value, setValue] = useState("");
  const [aggfun, setAggfun] = useState("sum");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { error, clearError, handleError } = useError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      const response = await transformProject(projectId, {
        operation_type: "pivotTables",
        pivot_query: { index, column, value, aggfun },
      });
      setResult(response);
      onResult?.(response);
      console.log("Pivot API response:", response);
    } catch (err) {
      console.error("Error applying pivot table:", err.message);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
      <form onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Pivot Table</h3>
        <div className="flex space-x-2 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Index:</label>
            <select
              value={index}
              onChange={(e) => setIndex(e.target.value)}
              className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select index column...</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Column:</label>
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="">No column split</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex space-x-2 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Value:</label>
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select value column...</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Aggregation Function:</label>
            <select
              value={aggfun}
              onChange={(e) => setAggfun(e.target.value)}
              className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="sum">Sum</option>
              <option value="mean">Mean</option>
              <option value="count">Count</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center gap-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md font-medium shadow-sm transition-colors duration-150"
            disabled={loading}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-sm rounded-md font-medium shadow-sm transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      </form>
      <FormErrorAlert message={error} />
      {result && <TransformResultPreview columns={result.columns} rows={result.rows} />}
    </div>
  );
};

PivotTableForm.propTypes = {
  projectId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PivotTableForm;
