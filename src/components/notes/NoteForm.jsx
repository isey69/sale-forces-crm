import React, { useState, useEffect } from "react";
import { useNotes } from "../../context/NotesContext";
import { useCustomers } from "../../context/CustomerContext";
import { useMeetings } from "../../context/MeetingContext";
import { useAuth } from "../../context/AuthContext";
import Input, { Select, Textarea } from "../common/Input";
import Button from "../common/Button";
import Modal from "../common/Modal";

const NoteForm = ({
  isOpen,
  onClose,
  note = null,
  onSuccess,
  prefilledData = null,
}) => {
  const { createNote, updateNote, tags } = useNotes();
  const { customers } = useCustomers();
  const { meetings } = useMeetings();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general",
    relatedTo: null,
    tags: [],
    priority: "medium",
    isPrivate: false,
  });
  const [newTag, setNewTag] = useState("");

  const isEditing = !!note;

  // Initialize form data
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || "",
        content: note.content || "",
        type: note.type || "general",
        relatedTo: note.relatedTo || null,
        tags: note.tags || [],
        priority: note.priority || "medium",
        isPrivate: note.isPrivate || false,
      });
    } else if (prefilledData) {
      setFormData({
        title: prefilledData.title || "",
        content: prefilledData.content || "",
        type: prefilledData.type || "general",
        relatedTo: prefilledData.relatedTo || null,
        tags: prefilledData.tags || [],
        priority: prefilledData.priority || "medium",
        isPrivate: prefilledData.isPrivate || false,
      });
    } else {
      // Reset for new note
      setFormData({
        title: "",
        content: "",
        type: "general",
        relatedTo: null,
        tags: [],
        priority: "medium",
        isPrivate: false,
      });
    }
    setErrors({});
    setNewTag("");
  }, [note, prefilledData, isOpen]);

  const typeOptions = [
    { value: "general", label: "General Note" },
    { value: "meeting", label: "Meeting Note" },
    { value: "customer", label: "Customer Note" },
    { value: "task", label: "Task/Reminder" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  // Get related entity options based on type
  const getRelatedEntityOptions = () => {
    switch (formData.type) {
      case "customer":
        return customers.map((customer) => ({
          value: JSON.stringify({
            type: "customer",
            id: customer.id,
            name: `${customer.name} ${customer.surname}`,
          }),
          label: `${customer.name} ${customer.surname} (${customer.type})`,
        }));
      case "meeting":
        return meetings.map((meeting) => ({
          value: JSON.stringify({
            type: "meeting",
            id: meeting.id,
            name: meeting.title,
          }),
          label: `${meeting.title} - ${new Date(
            meeting.date?.toDate?.() || meeting.date
          ).toLocaleDateString()}`,
        }));
      default:
        return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear relatedTo when type changes
    if (name === "type") {
      setFormData((prev) => ({
        ...prev,
        relatedTo: null,
      }));
    }
  };

  const handleRelatedToChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      relatedTo: value ? JSON.parse(value) : null,
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleExistingTagAdd = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const noteData = {
        ...formData,
        createdBy: currentUser?.uid || "unknown",
      };

      let result;
      if (isEditing) {
        result = await updateNote(note.id, noteData);
      } else {
        result = await createNote(noteData);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save note:", error);
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
        form="note-form"
        variant="primary"
        loading={loading}
      >
        {isEditing ? "Update Note" : "Create Note"}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Note" : "Create New Note"}
      size="lg"
      footer={footer}
    >
      <form id="note-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter note title"
          required
          error={errors.title}
        />

        {/* Type and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Note Type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            options={typeOptions}
            required
            error={errors.type}
          />

          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            options={priorityOptions}
            required
            error={errors.priority}
          />
        </div>

        {/* Related Entity */}
        {(formData.type === "customer" || formData.type === "meeting") && (
          <Select
            label={`Related ${
              formData.type === "customer" ? "Customer" : "Meeting"
            }`}
            value={formData.relatedTo ? JSON.stringify(formData.relatedTo) : ""}
            onChange={handleRelatedToChange}
            options={getRelatedEntityOptions()}
            placeholder={`Select a ${formData.type}`}
            helper={`Link this note to a specific ${formData.type}`}
          />
        )}

        {/* Content */}
        <Textarea
          label="Content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          placeholder="Write your note content here..."
          rows={6}
          required
          error={errors.content}
        />

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>

          {/* Current Tags */}
          {formData.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
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

          {/* Add New Tag */}
          <div className="flex space-x-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </div>

          {/* Existing Tags */}
          {tags.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Existing tags:</p>
              <div className="flex flex-wrap gap-1">
                {tags
                  .filter((tag) => !formData.tags.includes(tag))
                  .slice(0, 10)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleExistingTagAdd(tag)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Private Note Checkbox */}
        <div className="flex items-center">
          <input
            id="isPrivate"
            name="isPrivate"
            type="checkbox"
            checked={formData.isPrivate}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isPrivate"
            className="ml-2 block text-sm text-gray-900"
          >
            Make this note private
          </label>
          <span className="ml-2 text-xs text-gray-500">
            (Only visible to you)
          </span>
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

export default NoteForm;
