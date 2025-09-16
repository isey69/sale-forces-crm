import React, { useState } from "react";
import { useMeetings } from "../context/MeetingContext";
import MeetingCard from "../components/meetings/MeetingCard";
import MeetingForm from "../components/meetings/MeetingForm";
import Button from "../components/common/Button";
import Input, { Select } from "../components/common/Input";

const Meetings = () => {
  const {
    filteredMeetings,
    categories,
    loading,
    error,
    filters,
    updateFilters,
    getTodaysMeetings,
    getUpcomingMeetings,
    clearError,
  } = useMeetings();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [viewMode, setViewMode] = useState("upcoming"); // 'all', 'upcoming', 'today', 'calendar'

  // Filter options
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "scheduled", label: "Scheduled" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map((cat) => ({ value: cat.name, label: cat.name })),
  ];

  const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "upcoming", label: "Upcoming" },
    { value: "today", label: "Today" },
    { value: "thisWeek", label: "This Week" },
    { value: "thisMonth", label: "This Month" },
  ];

  const handleSearchChange = (e) => {
    updateFilters({ search: e.target.value });
  };

  const handleStatusFilter = (e) => {
    updateFilters({ status: e.target.value });
  };

  const handleCategoryFilter = (e) => {
    updateFilters({ category: e.target.value });
  };

  const handleDateRangeFilter = (e) => {
    updateFilters({ dateRange: e.target.value });
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
  };

  const handleCloseEditForm = () => {
    setEditingMeeting(null);
  };

  const handleMeetingSuccess = () => {
    setShowAddForm(false);
    setEditingMeeting(null);
  };

  const getStats = () => {
    const total = filteredMeetings.length;
    const scheduled = filteredMeetings.filter(
      (m) => m.status === "scheduled"
    ).length;
    const completed = filteredMeetings.filter(
      (m) => m.status === "completed"
    ).length;
    const today = getTodaysMeetings().length;

    return { total, scheduled, completed, today };
  };

  const formatDate = (date) => {
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
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

  const groupMeetingsByDate = (meetings) => {
    const groups = {};
    meetings.forEach((meeting) => {
      const date = meeting.date?.toDate?.() || new Date(meeting.date);
      const dateKey = date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(meeting);
    });

    // Sort meetings within each date by start time
    Object.keys(groups).forEach((dateKey) => {
      groups[dateKey].sort((a, b) => {
        const timeA = a.startTime || "00:00";
        const timeB = b.startTime || "00:00";
        return timeA.localeCompare(timeB);
      });
    });

    return groups;
  };

  const stats = getStats();
  const todaysMeetings = getTodaysMeetings();
  const upcomingMeetings = getUpcomingMeetings();

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
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and manage your customer meetings
          </p>
        </div>

        <div className="mt-4 sm:mt-0">
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
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
            Schedule Meeting
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
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
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.scheduled}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg
                className="w-6 h-6 text-orange-600"
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
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.today}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Meetings Quick View */}
      {todaysMeetings.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-900">
              Today's Meetings
            </h2>
            <span className="text-sm text-primary-600">
              {todaysMeetings.length} meeting
              {todaysMeetings.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3">
            {todaysMeetings.slice(0, 3).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatTime(meeting.startTime)}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {meeting.title}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {meeting.category}
                  </span>
                  {meeting.meetingLink && (
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
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
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
            {todaysMeetings.length > 3 && (
              <p className="text-sm text-primary-600 text-center">
                +{todaysMeetings.length - 3} more meeting
                {todaysMeetings.length - 3 !== 1 ? "s" : ""} today
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-2">
            <Input
              placeholder="Search meetings by title, description, or category..."
              value={filters.search}
              onChange={handleSearchChange}
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onChange={handleStatusFilter}
            options={statusOptions}
          />

          {/* Category Filter */}
          <Select
            value={filters.category}
            onChange={handleCategoryFilter}
            options={categoryOptions}
          />

          {/* Date Range Filter */}
          <Select
            value={filters.dateRange}
            onChange={handleDateRangeFilter}
            options={dateRangeOptions}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Showing {filteredMeetings.length} meeting
              {filteredMeetings.length !== 1 ? "s" : ""}
              {filters.search && ` matching "${filters.search}"`}
              {filters.status !== "all" && ` with status ${filters.status}`}
              {filters.category !== "all" && ` in ${filters.category}`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">View:</span>
            <button
              onClick={() => setViewMode("upcoming")}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === "upcoming"
                  ? "bg-primary-100 text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === "all"
                  ? "bg-primary-100 text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Meetings Display */}
      {filteredMeetings.length > 0 ? (
        viewMode === "upcoming" && upcomingMeetings.length > 0 ? (
          /* Upcoming Meetings View */
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Upcoming Meetings
            </h2>
            <div className="space-y-4">
              {Object.entries(
                groupMeetingsByDate(upcomingMeetings.slice(0, 10))
              ).map(([dateKey, meetings]) => (
                <div key={dateKey} className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900 sticky top-0 bg-gray-50 py-2 px-4 rounded-lg">
                    {formatDate(new Date(dateKey))}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {meetings.map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        onEdit={handleEditMeeting}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* All Meetings View */
          <div className="space-y-4">
            {Object.entries(groupMeetingsByDate(filteredMeetings)).map(
              ([dateKey, meetings]) => (
                <div key={dateKey} className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900 sticky top-0 bg-gray-50 py-2 px-4 rounded-lg">
                    {formatDate(new Date(dateKey))}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {meetings.map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        onEdit={handleEditMeeting}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="text-center py-12">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.search ||
            filters.status !== "all" ||
            filters.category !== "all"
              ? "No meetings found"
              : "No meetings scheduled"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search ||
            filters.status !== "all" ||
            filters.category !== "all"
              ? "Try adjusting your search or filters."
              : "Get started by scheduling your first customer meeting."}
          </p>
          {!filters.search &&
            filters.status === "all" &&
            filters.category === "all" && (
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => setShowAddForm(true)}
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
                  Schedule First Meeting
                </Button>
              </div>
            )}
        </div>
      )}

      {/* Modals */}
      <MeetingForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={handleMeetingSuccess}
      />

      <MeetingForm
        isOpen={!!editingMeeting}
        onClose={handleCloseEditForm}
        meeting={editingMeeting}
        onSuccess={handleMeetingSuccess}
      />
    </div>
  );
};

export default Meetings;
