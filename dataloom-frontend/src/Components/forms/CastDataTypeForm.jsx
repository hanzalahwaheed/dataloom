import { useState } from "react";
import PropTypes from "prop-types";
import { transformProject } from "../../api";
import { useProjectContext } from "../../context/ProjectContext";
import { useToast } from "../../context/ToastContext";
import useError from "../../hooks/useError";
import FormErrorAlert from "../common/FormErrorAlert";

const CastDataTypeForm = ({ projectId, onClose, onTransform, onResult }) => {
  const { columns } = useProjectContext();
  const { showToast } = useToast();

  const [column, setColumn] = useState("");
  const [targetType, setTargetType] = useState("string");
  const { error, clearError, handleError } = useError();

  const handleSubmit = async (e) => {
    e.preventDefault();

    clearError();
    try {
      const response = await transformProject(projectId, {
        operation_type: "castDataType",
        cast_data_type_params: {
          column,
          target_type: targetType,
        },
      });

      onTransform(response);
      onResult?.(response);
      onClose();
    } catch (err) {
      console.error("Error casting data type:", err);
      showToast(err.response?.data?.detail || "Failed to cast data type.", "error");
      handleError(err);
    }
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
      <form onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Cast Data Type</h3>

        <div className="flex space-x-2 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Column:</label>
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select column...</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Target Type:</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="border border-gray-300 rounded-md w-full px-3 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="string">String</option>
              <option value="integer">Integer</option>
              <option value="float">Float</option>
              <option value="boolean">Boolean</option>
              <option value="datetime">DateTime</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md font-medium shadow-sm transition-colors duration-150"
          >
            Apply
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

CastDataTypeForm.propTypes = {
  projectId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onTransform: PropTypes.func.isRequired,
};

export default CastDataTypeForm;
