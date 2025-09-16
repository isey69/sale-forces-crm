import React, { useState } from "react";
import { useMeetings } from "../../context/MeetingContext";
import { useCustomerContext } from "../../context/CustomerContext";
import Button from "../common/Button";
import Modal, { ConfirmModal } from "../common/Modal";
import { Textarea } from "../common/Input";

const MeetingCard = ({ meeting, onEdit, compact = false }) => {
  const { updateMeetingStatus, addMeetingNotes, deleteMeeting, categories } =
    useMeetings();
  const { customers } = useCustomerContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState(meeting.notes || "");
  const [loading, setLoading] = useState(false);

  const getAttendees = () => {
    if (!meeting.attendees || meeting.attendees.length === 0) return [];
    return customers.filter((customer) =>
      meeting.attendees.includes(customer.id)
    );
  };

  const getCategory = () => {
    return categories.find((cat) => cat.name === meeting.category);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateMeetingStatus(meeting.id, newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await addMeetingNotes(meeting.id, notes);
      setShowNotesModal(false);
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMeeting(meeting.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDuration = () => {
    if (!meeting.startTime || !meeting.endTime) return "";

    const [startHours, startMinutes] = meeting.startTime.split(":").map(Number);
    const [endHours, endMinutes] = meeting.endTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;

    if (durationMinutes < 60) {
      return `${durationMinutes}m`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = () => {
    const category = getCategory();
    return category?.color || "#6B7280";
  };

  const isPast = () => {
    const meetingDate = meeting.date?.toDate?.() || new Date(meeting.date);
    const now = new Date();
    return meetingDate < now;
  };

  const attendees = getAttendees();

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getCategoryColor() }}
          />
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {meeting.title}
            </h4>
            <p className="text-xs text-gray-500">
              {formatTime(meeting.startTime)} • {attendees.length} attendee
              {attendees.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
            meeting.status
          )}`}
        >
          {meeting.status}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-card border border-gray-200 hover:shadow-card-hover transition-all duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getCategoryColor() }}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {meeting.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>{meeting.category}</span>
                  <span>•</span>
                  <span>{getDuration()}</span>
                  {attendees.length > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        {attendees.length} attendee
                        {attendees.length !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  meeting.status
                )}`}
              >
                {meeting.status}
              </span>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(meeting)}
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
                  onClick={() => setShowDeleteModal(true)}
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
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Date and Time */}
          <div className="flex items-center space-x-6 mb-4">
            <div className="flex items-center text-gray-600">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">{formatDate(meeting.date)}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">
                {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
              </span>
            </div>
          </div>

          {/* Description */}
          {meeting.description && (
            <p className="text-sm text-gray-600 mb-4">{meeting.description}</p>
          )}

          {/* Meeting Link */}
          {meeting.meetingLink && (
            <div className="flex items-center mb-4">
              <svg
                className="w-5 h-5 mr-2 text-gray-400"
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
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-500 underline"
              >
                Join Meeting
              </a>
            </div>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Attendees
              </h4>
              <div className="flex flex-wrap gap-2">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center bg-gray-50 px-3 py-1 rounded-full"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2 ${
                        attendee.type === "CPA"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    >
                      {attendee.name.charAt(0)}
                      {attendee.surname.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">
                      {attendee.name} {attendee.surname}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {meeting.notes && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {meeting.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Status Change Buttons */}
              {meeting.status === "scheduled" && isPast() && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleStatusChange("completed")}
                >
                  Mark Complete
                </Button>
              )}

              {meeting.status === "scheduled" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("cancelled")}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Cancel
                </Button>
              )}

              {meeting.status === "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("scheduled")}
                >
                  Reschedule
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNotesModal(true)}
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
              >
                {meeting.notes ? "Edit Notes" : "Add Notes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Meeting"
        message={`Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
      />

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title="Meeting Notes"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowNotesModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveNotes}
              loading={loading}
            >
              Save Notes
            </Button>
          </div>
        }
      >
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your meeting notes here..."
          rows={6}
          className="w-full"
        />
      </Modal>
    </>
  );
};

export default MeetingCard;
