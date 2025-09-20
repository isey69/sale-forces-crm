import React, { useState } from "react";
import { useLabels } from "../../hooks/useLabels";
import { Plus, Edit, Trash2 } from "lucide-react";
import Modal from "../common/Modal";
import { ConfirmModal } from "../common/Modal";

const LabelManager = () => {
  const { labels, addLabel, updateLabel, deleteLabel, loading } = useLabels();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentLabel, setCurrentLabel] = useState(null);
  const [labelToDelete, setLabelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddLabel = () => {
    setCurrentLabel(null);
    setShowModal(true);
  };

  const handleEditLabel = (label) => {
    setCurrentLabel(label);
    setShowModal(true);
  };

  const handleDeleteLabel = (label) => {
    setLabelToDelete(label);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (labelToDelete) {
      setIsDeleting(true);
      try {
        await deleteLabel(labelToDelete.id);
        setShowDeleteModal(false);
        setLabelToDelete(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSave = async (formData) => {
    if (currentLabel) {
      await updateLabel(currentLabel.id, formData);
    } else {
      await addLabel(formData);
    }
    setShowModal(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Labels</h1>
          <button
            onClick={handleAddLabel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Label
          </button>
        </div>

        {loading ? (
          <p>Loading labels...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-md">
            <ul className="divide-y divide-gray-200">
              {labels.map((label) => (
                <li
                  key={label.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: label.color }}
                    ></span>
                    <span className="font-medium text-gray-800">
                      {label.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditLabel(label)}
                      className="p-2 text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLabel(label)}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-gray-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showModal && (
        <LabelFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          label={currentLabel}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Label"
        message={`Are you sure you want to delete the label "${labelToDelete?.name}"? This will not remove the label from existing customers.`}
        loading={isDeleting}
      />
    </div>
  );
};

const LabelFormModal = ({ isOpen, onClose, onSave, label }) => {
  const [name, setName] = useState(label?.name || "");
  const [color, setColor] = useState(label?.color || "#cccccc");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ name, color });
    } finally {
      setIsSaving(false);
    }
  };

  const colors = [
    "#f87171",
    "#fb923c",
    "#facc15",
    "#a3e635",
    "#4ade80",
    "#34d399",
    "#2dd4bf",
    "#22d3ee",
    "#38bdf8",
    "#60a5fa",
    "#818cf8",
    "#a78bfa",
    "#c084fc",
    "#f472b6",
    "#fb7185",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={label ? "Edit Label" : "Add Label"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Label Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Color
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 p-0 border-none cursor-pointer"
              title="Select a custom color"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LabelManager;
