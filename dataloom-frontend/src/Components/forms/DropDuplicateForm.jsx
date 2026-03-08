import { useState } from "react";
import PropTypes from "prop-types";
import { transformProject } from "../../api";
import useError from "../../hooks/useError";
import FormErrorAlert from "../common/FormErrorAlert";
import { useProjectContext } from "../../context/ProjectContext";

const DropDuplicateForm = ({ projectId, onClose, onTransform, onResult }) => {
  const { columns } = useProjectContext();
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [keep, setKeep] = useState("first");
  const { error, clearError, handleError } = useError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedColumns.length) return;

    const transformationInput = {
      operation_type: "dropDuplicate",
      drop_duplicate: {
        columns: selectedColumns.join(","),
        keep: keep,
      },
    };

    clearError();
    try {
      const response = await transformProject(projectId, transformationInput);
      console.log("Transformation response:", response);
      onTransform(response); // Pass data to parent component
      onResult?.(response);
      onClose(); // Close the form after submission
    } catch (err) {
      console.error("Error transforming project:", err);
      handleError(err);
    }
  };

  const onColumnsChange = (e) => {
    const values = Array.from(e.target.selectedOptions).map((option) => option.value);
    setSelectedColumns(values);
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
      <form onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Drop Duplicate</h3>
        <div className="flex space-x-2 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Columns:</label>
            <select
              multiple
              value={selectedColumns}
              onChange={onColumnsChange}
              className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              required
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Cmd/Ctrl+Click to select multiple columns</p>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Keep:</label>
            <select
              value={keep}
              onChange={(e) => setKeep(e.target.value)}
              className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="first">First</option>
              <option value="last">Last</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center gap-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md font-medium shadow-sm transition-colors duration-150"
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
    </div>
  );
};

DropDuplicateForm.propTypes = {
  projectId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onTransform: PropTypes.func.isRequired,
};

export default DropDuplicateForm;
