import { useState } from "react";
import PropTypes from "prop-types";
import TransformResultPreview from "./TransformResultPreview";
import { transformProject } from "../../api";
import useError from "../../hooks/useError";
import FormErrorAlert from "../common/FormErrorAlert";

const AdvQueryFilterForm = ({ projectId, onClose, onResult }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { error, clearError, handleError } = useError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Query:", query);
    setLoading(true);
    clearError();
    try {
      const response = await transformProject(projectId, {
        operation_type: "advQueryFilter",
        adv_query: { query },
      });
      setResult(response);
      onResult?.(response);
      console.log("Query API response:", response);
    } catch (err) {
      console.error("Error applying query:", err.message);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
      <form onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Advanced Query</h3>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">Query:</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            placeholder="e.g., col1 > 10 and col2 < 5"
            required
          />
        </div>
        <div className="flex justify-between items-center gap-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md font-medium shadow-sm transition-colors duration-150"
            disabled={loading}
          >
            Submit
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

AdvQueryFilterForm.propTypes = {
  projectId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AdvQueryFilterForm;
