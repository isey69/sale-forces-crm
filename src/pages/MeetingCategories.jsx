import React, { useState } from "react";
import { useMeetings } from "../context/MeetingContext";
import Button from "../components/common/Button";
import Input, { Textarea } from "../components/common/Input";
import Modal, { ConfirmModal } from "../components/common/Modal";

const MeetingCategories = () => {
  const { categories, loading, error, deleteCategory, clearError } =
    useMeetings();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowAddForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setFormLoading(true);
    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (error) {
      console.error("Failed to delete category:", error);
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
          <h1 className="text-2xl font-bold text-gray-900">
            Meeting Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize your meetings with custom categories
          </p>
        </div>

        <div className="mt-4 sm:mt-0">
          <Button
            variant="primary"
            onClick={handleAddCategory}
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
            Add Category
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

      {/* Categories List */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEditCategory}
              onDelete={setDeletingCategory}
            />
          ))}
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
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No categories
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first meeting category.
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={handleAddCategory}
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
              Add Category
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CategoryForm
        isOpen={showAddForm}
        onClose={handleCloseForm}
        category={editingCategory}
      />

      <ConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={formLoading}
      />
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-card border border-gray-200 hover:shadow-card-hover transition-all duration-200 overflow-hidden">
      {/* Header with color */}
      <div
        className="h-3"
        style={{ backgroundColor: category.color || "#6B7280" }}
      />

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {category.name}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
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
              onClick={() => onDelete(category)}
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

        {category.description && (
          <p className="text-sm text-gray-600 mb-4">{category.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: category.color || "#6B7280" }}
            title="Category Color"
          />
          <span className="text-xs text-gray-500">
            Created{" "}
            {new Date(
              category.createdAt?.toDate?.() || category.createdAt
            ).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Category Form Component
const CategoryForm = ({ isOpen, onClose, category = null }) => {
  const { createCategory, updateCategory } = useMeetings();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  const isEditing = !!category;

  const predefinedColors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#8B5CF6", // Purple
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#F97316", // Orange
    "#EC4899", // Pink
    "#6B7280", // Gray
  ];

  React.useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        color: category.color || "#3B82F6",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleColorChange = (color) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
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
        await updateCategory(category.id, formData);
      } else {
        await createCategory(formData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save category:", error);
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
        form="category-form"
        variant="primary"
        loading={loading}
      >
        {isEditing ? "Update Category" : "Create Category"}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Category" : "Create Category"}
      size="md"
      footer={footer}
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <Input
          label="Category Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., Introduction, Follow-up"
          required
          error={errors.name}
        />

        {/* Description */}
        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Optional description of this category"
          rows={3}
          helper="Briefly describe when this category should be used"
        />

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Color
          </label>
          <div className="grid grid-cols-5 gap-3">
            {predefinedColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorChange(color)}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  formData.color === color
                    ? "border-gray-400 scale-110 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              >
                {formData.color === color && (
                  <svg
                    className="w-6 h-6 text-white mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="mt-3">
            <Input
              label="Custom Color"
              type="color"
              value={formData.color}
              onChange={handleInputChange}
              name="color"
              helper="Or choose a custom color"
            />
          </div>
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

export default MeetingCategories;
