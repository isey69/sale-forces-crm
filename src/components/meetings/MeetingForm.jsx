import React, { useState, useEffect } from "react";
import { useMeetings } from "../../context/MeetingContext";
import { useCustomerContext } from "../../context/CustomerContext";
import Input, { Select, Textarea } from "../common/Input";
import Button from "../common/Button";
import Modal from "../common/Modal";

const MeetingForm = ({ isOpen, onClose, meeting = null, onSuccess }) => {
  const { createMeeting, updateMeeting, categories } = useMeetings();
  const { customers } = useCustomerContext();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    attendees: [],
    category: "",
    meetingLink: "",
    notes: "",
    status: "scheduled",
  });

  const isEditing = !!meeting;

  // Initialize form data when meeting changes
  useEffect(() => {
    if (meeting) {
      const meetingDate = meeting.date?.toDate?.() || new Date(meeting.date);

      setFormData({
        title: meeting.title || "",
        description: meeting.description || "",
        date: meetingDate.toISOString().split("T")[0],
        startTime: meeting.startTime || "",
        endTime: meeting.endTime || "",
        attendees: meeting.attendees || [],
        category: meeting.category || "",
        meetingLink: meeting.meetingLink || "",
        notes: meeting.notes || "",
        status: meeting.status || "scheduled",
      });
    } else {
      // Reset for new meeting
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      setFormData({
        title: "",
        description: "",
        date: tomorrow.toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "10:00",
        attendees: [],
        category: categories[0]?.name || "",
        meetingLink: "",
        notes: "",
        status: "scheduled",
      });
    }
    setErrors({});
  }, [meeting, isOpen, categories]);

  const statusOptions = [
    { value: "scheduled", label: "Scheduled" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const categoryOptions = categories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const displayTime = new Date(
        `2000-01-01T${timeString}`
      ).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      timeOptions.push({ value: timeString, label: displayTime });
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Auto-adjust end time when start time changes
    if (name === "startTime" && value) {
      const [startHour, startMinute] = value.split(":").map(Number);
      const endHour = startHour + 1;
      const endTime = `${endHour.toString().padStart(2, "0")}:${startMinute
        .toString()
        .padStart(2, "0")}`;

      if (endHour < 24) {
        setFormData((prev) => ({
          ...prev,
          endTime,
        }));
      }
    }
  };

  const handleAttendeeToggle = (customerId) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.includes(customerId)
        ? prev.attendees.filter((id) => id !== customerId)
        : [...prev.attendees, customerId],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endTime) newErrors.endTime = "End time is required";
    if (!formData.category) newErrors.category = "Category is required";

    // Date validation
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      newErrors.date = "Meeting date cannot be in the past";
    }

    // Time validation
    if (formData.startTime && formData.endTime) {
      const [startHour, startMinute] = formData.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = formData.endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (endMinutes <= startMinutes) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    // Attendees validation
    if (formData.attendees.length === 0) {
      newErrors.attendees = "At least one attendee is required";
    }

    // Meeting link validation (if provided)
    if (formData.meetingLink && !isValidUrl(formData.meetingLink)) {
      newErrors.meetingLink = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const meetingData = {
        ...formData,
        date: new Date(formData.date),
      };

      let result;
      if (isEditing) {
        result = await updateMeeting(meeting.id, meetingData);
      } else {
        result = await createMeeting(meetingData);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save meeting:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCustomers = () => {
    return customers.filter((customer) =>
      formData.attendees.includes(customer.id)
    );
  };

  const getAvailableCustomers = () => {
    return customers.filter(
      (customer) => !formData.attendees.includes(customer.id)
    );
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
        form="meeting-form"
        variant="primary"
        loading={loading}
      >
        {isEditing ? "Update Meeting" : "Schedule Meeting"}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Meeting" : "Schedule New Meeting"}
      size="lg"
      footer={footer}
    >
      <form id="meeting-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <Input
            label="Meeting Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter meeting title"
            required
            error={errors.title}
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Optional meeting description"
            rows={3}
            error={errors.description}
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            error={errors.date}
          />

          <Select
            label="Start Time"
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
            options={timeOptions}
            required
            error={errors.startTime}
          />

          <Select
            label="End Time"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            options={timeOptions}
            required
            error={errors.endTime}
          />
        </div>

        {/* Category and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            options={categoryOptions}
            placeholder="Select category"
            required
            error={errors.category}
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={statusOptions}
            required
            error={errors.status}
          />
        </div>

        {/* Meeting Link */}
        <Input
          label="Meeting Link"
          name="meetingLink"
          value={formData.meetingLink}
          onChange={handleInputChange}
          placeholder="https://zoom.us/j/... or https://teams.microsoft.com/..."
          error={errors.meetingLink}
          helper="Optional video conference link"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          }
        />

        {/* Attendees */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attendees <span className="text-red-500">*</span>
          </label>

          {/* Selected Attendees */}
          {getSelectedCustomers().length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Selected ({getSelectedCustomers().length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {getSelectedCustomers().map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                  >
                    <div
                      className={`w-4 h-4 rounded-full mr-2 ${
                        customer.type === "CPA"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    />
                    {customer.name} {customer.surname}
                    <button
                      type="button"
                      onClick={() => handleAttendeeToggle(customer.id)}
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

          {/* Available Attendees */}
          {getAvailableCustomers().length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Available Customers
              </h4>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                {getAvailableCustomers().map((customer) => (
                  <label
                    key={customer.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={formData.attendees.includes(customer.id)}
                      onChange={() => handleAttendeeToggle(customer.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 ${
                          customer.type === "CPA"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        }`}
                      >
                        {customer.name.charAt(0)}
                        {customer.surname.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {customer.name} {customer.surname}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.type}{" "}
                          {customer.email && `• ${customer.email}`}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {errors.attendees && (
            <p className="text-sm text-red-600 mt-1">{errors.attendees}</p>
          )}
        </div>

        {/* Notes (for editing existing meetings) */}
        {isEditing && (
          <Textarea
            label="Meeting Notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add notes about this meeting..."
            rows={4}
            helper="Notes can be added or updated after the meeting"
          />
        )}

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

export default MeetingForm;
