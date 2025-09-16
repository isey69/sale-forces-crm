import React, { useState } from "react";
import { useCustomFields } from "../context/CustomFieldsContext";
import { fieldTypes } from "../services/customFieldService";
import Button from "../components/common/Button";
import Input, { Select, Textarea } from "../components/common/Input";
import Modal, { ConfirmModal } from "../components/common/Modal";

const CustomFields = () => {
  const {
    customFields,
    loading,
    error,

    deleteCustomField,
    toggleFieldStatus,
    clearError,
  } = useCustomFields();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deletingField, setDeletingField] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleAddField = () => {
    setEditingField(null);
    setShowAddForm(true);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingField(null);
  };

  const handleToggleStatus = async (field) => {
    try {
      await toggleFieldStatus(field.id, !field.isActive);
    } catch (error) {
      console.error("Failed to toggle field status:", error);
    }
  };

  const handleDeleteField = async () => {
    if (!deletingField) return;

    setFormLoading(true);
    try {
      await deleteCustomField(deletingField.id);
      setDeletingField(null);
    } catch (error) {
      console.error("Failed to delete field:", error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Fields</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage additional fields for customer profiles
          </p>
        </div>

        <div className="mt-4 sm:mt-0">
          <Button
            variant="primary"
            onClick={handleAddField}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            }
          >
            Add Custom Field
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Field Types Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Available Field Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {fieldTypes.map((type) => (
            <div
              key={type.value}
              className="flex items-center text-sm text-blue-700"
            >
              <span className="mr-2">{type.icon}</span>
              {type.label}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Fields List */}
      {customFields.length > 0 ? (
        <div className="bg-white shadow-card rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Custom Fields ({customFields.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {customFields.map((field) => (
              <CustomFieldRow
                key={field.id}
                field={field}
                onEdit={handleEditField}
                onDelete={setDeletingField}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No custom fields
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first custom field.
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={handleAddField}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              }
            >
              Add Custom Field
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CustomFieldForm
        isOpen={showAddForm}
        onClose={handleCloseForm}
        field={editingField}
      />

      <ConfirmModal
        isOpen={!!deletingField}
        onClose={() => setDeletingField(null)}
        onConfirm={handleDeleteField}
        title="Delete Custom Field"
        message={`Are you sure you want to delete "${deletingField?.label}"? This will remove this field from all customer profiles.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={formLoading}
      />
    </div>
  );
};

// Custom Field Row Component
const CustomFieldRow = ({ field, onEdit, onDelete, onToggleStatus }) => {
  const getTypeIcon = (type) => {
    const fieldType = fieldTypes.find((ft) => ft.value === type);
    return fieldType?.icon || "📝";
  };

  const getAppliesToText = (appliesTo) => {
    if (appliesTo.includes("CPA") && appliesTo.includes("NonCPA")) {
      return "Both CPA & NonCPA";
    } else if (appliesTo.includes("CPA")) {
      return "CPA Only";
    } else if (appliesTo.includes("NonCPA")) {
      return "NonCPA Only";
    }
    return "Unknown";
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <span className="text-2xl">{getTypeIcon(field.type)}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900">
                {field.label}
              </h4>
              {field.required && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Required
                </span>
              )}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  field.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {field.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
              <span>Type: {field.type}</span>
              <span>•</span>
              <span>Name: {field.name}</span>
              <span>•</span>
              <span>{getAppliesToText(field.appliesTo)}</span>
            </div>
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStatus(field)}
            className={field.isActive ? "text-gray-600" : "text-green-600"}
          >
            {field.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(field)}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(field)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
};

// Custom Field Form Component
const CustomFieldForm = ({ isOpen, onClose, field = null }) => {
  const { createCustomField, updateCustomField } = useCustomFields();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    type: "text",
    appliesTo: ["CPA"],
    required: false,
    options: [],
    defaultValue: "",
    placeholder: "",
    helpText: "",
    validation: {},
  });
  const [newOption, setNewOption] = useState("");

  const isEditing = !!field;

  React.useEffect(() => {
    if (field) {
      setFormData({
        name: field.name || "",
        label: field.label || "",
        type: field.type || "text",
        appliesTo: field.appliesTo || ["CPA"],
        required: field.required || false,
        options: field.options || [],
        defaultValue: field.defaultValue || "",
        placeholder: field.placeholder || "",
        helpText: field.helpText || "",
        validation: field.validation || {},
      });
    } else {
      setFormData({
        name: "",
        label: "",
        type: "text",
        appliesTo: ["CPA"],
        required: false,
        options: [],
        defaultValue: "",
        placeholder: "",
        helpText: "",
        validation: {},
      });
    }
    setErrors({});
  }, [field, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Generate name from label if not editing
    if (name === "label" && !isEditing) {
      const generatedName = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      setFormData((prev) => ({ ...prev, name: generatedName }));
    }

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAppliesToChange = (customerType) => {
    setFormData((prev) => ({
      ...prev,
      appliesTo: prev.appliesTo.includes(customerType)
        ? prev.appliesTo.filter((type) => type !== customerType)
        : [...prev.appliesTo, customerType],
    }));
  };

  const handleAddOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, newOption.trim()],
      }));
      setNewOption("");
    }
  };

  const handleRemoveOption = (optionToRemove) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((option) => option !== optionToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.label.trim()) {
      newErrors.label = "Label is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name =
        "Name must start with a letter and contain only letters, numbers, and underscores";
    }

    if (formData.appliesTo.length === 0) {
      newErrors.appliesTo = "Field must apply to at least one customer type";
    }

    if (formData.type === "select" && formData.options.length === 0) {
      newErrors.options = "Select fields must have at least one option";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditing) {
        await updateCustomField(field.id, formData);
      } else {
        await createCustomField(formData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save custom field:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="custom-field-form"
        variant="primary"
        loading={loading}
      >
        {isEditing ? "Update Field" : "Create Field"}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Custom Field" : "Create Custom Field"}
      size="lg"
      footer={footer}
    >
      <form
        id="custom-field-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Label and Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Field Label"
            name="label"
            value={formData.label}
            onChange={handleInputChange}
            placeholder="e.g., Company Size"
            required
            error={errors.label}
            helper="Display name shown to users"
          />

          <Input
            label="Field Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., company_size"
            required
            error={errors.name}
            helper="Internal identifier (lowercase, underscores only)"
            disabled={isEditing}
          />
        </div>

        {/* Type */}
        <Select
          label="Field Type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          options={fieldTypes.map((type) => ({
            value: type.value,
            label: `${type.icon} ${type.label} - ${type.description}`,
          }))}
          required
          error={errors.type}
        />

        {/* Applies To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Applies To <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.appliesTo.includes("CPA")}
                onChange={() => handleAppliesToChange("CPA")}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">CPA Customers</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.appliesTo.includes("NonCPA")}
                onChange={() => handleAppliesToChange("NonCPA")}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                NonCPA Customers
              </span>
            </label>
          </div>
          {errors.appliesTo && (
            <p className="text-sm text-red-600 mt-1">{errors.appliesTo}</p>
          )}
        </div>

        {/* Options (for select type) */}
        {formData.type === "select" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options <span className="text-red-500">*</span>
            </label>

            {/* Current Options */}
            {formData.options.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {formData.options.map((option) => (
                    <div
                      key={option}
                      className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {option}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(option)}
                        className="ml-2 text-gray-600 hover:text-gray-800"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Option */}
            <div className="flex space-x-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add an option"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddOption}
                disabled={!newOption.trim()}
              >
                Add
              </Button>
            </div>

            {errors.options && (
              <p className="text-sm text-red-600 mt-1">{errors.options}</p>
            )}
          </div>
        )}

        {/* Placeholder and Default Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Placeholder"
            name="placeholder"
            value={formData.placeholder}
            onChange={handleInputChange}
            placeholder="Placeholder text"
            helper="Hint text shown in empty field"
          />

          <Input
            label="Default Value"
            name="defaultValue"
            value={formData.defaultValue}
            onChange={handleInputChange}
            placeholder="Default value"
            helper="Pre-filled value for new customers"
          />
        </div>

        {/* Help Text */}
        <Textarea
          label="Help Text"
          name="helpText"
          value={formData.helpText}
          onChange={handleInputChange}
          placeholder="Additional instructions or explanation"
          rows={3}
          helper="Optional description shown below the field"
        />

        {/* Required Checkbox */}
        <div className="flex items-center">
          <input
            id="required"
            name="required"
            type="checkbox"
            checked={formData.required}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label
            htmlFor="required"
            className="ml-2 block text-sm text-gray-900"
          >
            Make this field required
          </label>
        </div>

        {/* Error Messages */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CustomFields;
