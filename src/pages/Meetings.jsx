import React, { useState, useEffect } from "react";
import { useMeetings } from "../context/MeetingContext";
import { callService } from "../services/callService";
import MeetingCard from "../components/meetings/MeetingCard";
import MeetingForm from "../components/meetings/MeetingForm";
import Button from "../components/common/Button";
import Input, { Select } from "../components/common/Input";
import Modal from "../components/common/Modal";
import { Phone, Calendar, Video, Users } from "lucide-react";
import toast from "react-hot-toast";

const Meetings = () => {
  const {
    filteredMeetings,
    categories,
    loading: meetingsLoading,
    error,
    filters,
    updateFilters,
    getTodaysMeetings,
    getUpcomingMeetings,
    clearError,
  } = useMeetings();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [viewMode, setViewMode] = useState("upcoming"); // 'all', 'upcoming', 'today', 'calls', 'meetings'
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'meetings', 'calls'
  
  // Call scheduling state
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [showScheduleCallModal, setShowScheduleCallModal] = useState(false);
  const [scheduleCallFormData, setScheduleCallFormData] = useState({
    customerId: '',
    scheduledDate: '',
    scheduledTime: '',
    priority: 'medium',
    purpose: ''
  });

  // Load scheduled calls
  const loadScheduledCalls = async () => {
    try {
      setCallsLoading(true);
      // Get all scheduled calls
      const calls = await callService.getAllScheduledCalls();
      setScheduledCalls(calls);
    } catch (error) {
      console.error('Error loading scheduled calls:', error);
      toast.error('Failed to load scheduled calls');
    } finally {
      setCallsLoading(false);
    }
  };

  useEffect(() => {
    loadScheduledCalls();
  }, []);

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

  const handleScheduleCall = async (e) => {
    e.preventDefault();
    try {
      await callService.scheduleCall(scheduleCallFormData);
      toast.success('Call scheduled successfully');
      setShowScheduleCallModal(false);
      setScheduleCallFormData({
        customerId: '',
        scheduledDate: '',
        scheduledTime: '',
        priority: 'medium',
        purpose: ''
      });
      await loadScheduledCalls(); // Reload calls
    } catch (error) {
      console.error('Error scheduling call:', error);
      toast.error('Failed to schedule call');
    }
  };

  const handleCancelCall = async (callId) => {
    try {
      await callService.cancelScheduledCall(callId);
      toast.success('Call cancelled successfully');
      await loadScheduledCalls(); // Reload calls
    } catch (error) {
      console.error('Error cancelling call:', error);
      toast.error('Failed to cancel call');
    }
  };

  const getStats = () => {
    const totalMeetings = filteredMeetings.length;
    const scheduledMeetings = filteredMeetings.filter(
      (m) => m.status === "scheduled"
    ).length;
    const completedMeetings = filteredMeetings.filter(
      (m) => m.status === "completed"
    ).length;
    const todayMeetings = getTodaysMeetings().length;
    const totalCalls = scheduledCalls.length;

    return { 
      totalMeetings, 
      scheduledMeetings, 
      completedMeetings, 
      todayMeetings, 
      totalCalls,
      totalAppointments: totalMeetings + totalCalls
    };
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredCalls = () => {
    let filtered = [...scheduledCalls];
    
    // Apply date range filter
    if (filters.dateRange === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(call => {
        const callDate = call.scheduledDate?.toDate?.() || new Date(call.scheduledDate);
        return callDate.toDateString() === today;
      });
    } else if (filters.dateRange === 'upcoming') {
      const now = new Date();
      filtered = filtered.filter(call => {
        const callDate = call.scheduledDate?.toDate?.() || new Date(call.scheduledDate);
        return callDate >= now;
      });
    }

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(call =>
        call.purpose?.toLowerCase().includes(filters.search.toLowerCase()) ||
        call.customerId?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    return filtered;
  };

  const getCombinedAppointments = () => {
    const meetings = filteredMeetings.map(m => ({ ...m, type: 'meeting' }));
    const calls = getFilteredCalls().map(c => ({ ...c, type: 'call' }));
    
    const combined = [...meetings, ...calls];
    
    // Sort by date and time
    return combined.sort((a, b) => {
      const dateA = a.date?.toDate?.() || new Date(a.date || a.scheduledDate);
      const dateB = b.date?.toDate?.() || new Date(b.date || b.scheduledDate);
      return dateA - dateB;
    });
  };

  const stats = getStats();
  const todaysMeetings = getTodaysMeetings();
  const upcomingMeetings = getUpcomingMeetings();
  const filteredCalls = getFilteredCalls();

  if (meetingsLoading || callsLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and manage your meetings and calls
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowScheduleCallModal(true)}
            icon={<Phone className="w-4 h-4" />}
          >
            Schedule Call
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            icon={<Calendar className="w-4 h-4" />}
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.totalAppointments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Meetings</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.totalMeetings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Calls</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.totalCalls}
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.completedMeetings}
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
                {stats.todayMeetings}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-card border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All Appointments', icon: Calendar },
              { key: 'meetings', label: 'Meetings Only', icon: Users },
              { key: 'calls', label: 'Calls Only', icon: Phone }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <Input
                placeholder="Search..."
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

            <Select
              value={filters.status}
              onChange={handleStatusFilter}
              options={statusOptions}
            />

            <Select
              value={filters.category}
              onChange={handleCategoryFilter}
              options={categoryOptions}
            />

            <Select
              value={filters.dateRange}
              onChange={handleDateRangeFilter}
              options={dateRangeOptions}
            />
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">All Appointments</h2>
          {getCombinedAppointments().length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {getCombinedAppointments().map((appointment) => (
                <div key={`${appointment.type}-${appointment.id}`} className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {appointment.type === 'meeting' ? (
                        <Users className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Phone className="w-5 h-5 text-green-600" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.title || appointment.purpose}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(appointment.date || appointment.scheduledDate)} at {
                            formatTime(appointment.startTime || appointment.scheduledTime)
                          }
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      appointment.type === 'meeting' 
                        ? 'bg-blue-100 text-blue-800'
                        : getPriorityColor(appointment.priority)
                    }`}>
                      {appointment.type === 'meeting' ? appointment.category : `${appointment.priority} priority`}
                    </span>
                  </div>
                  
                  {appointment.type === 'call' && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleCancelCall(appointment.id)}
                        className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments scheduled</h3>
            </div>
          )}
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Meetings</h2>
          {filteredMeetings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={handleEditMeeting}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings scheduled</h3>
            </div>
          )}
        </div>
      )}

      {activeTab === 'calls' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Scheduled Calls</h2>
          {filteredCalls.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCalls.map((call) => (
                <div key={call.id} className="bg-white rounded-lg shadow-card p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{call.purpose}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(call.scheduledDate)} at {formatTime(call.scheduledTime)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(call.priority)}`}>
                      {call.priority} priority
                    </span>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => handleCancelCall(call.id)}
                      className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Phone className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No calls scheduled</h3>
            </div>
          )}
        </div>
      )}

      {/* Schedule Call Modal */}
      <Modal
        isOpen={showScheduleCallModal}
        onClose={() => setShowScheduleCallModal(false)}
        title="Schedule Call"
        size="lg"
      >
        <form onSubmit={handleScheduleCall} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID</label>
            <input
              type="text"
              value={scheduleCallFormData.customerId}
              onChange={(e) => setScheduleCallFormData(prev => ({ ...prev, customerId: e.target.value }))}
              placeholder="Enter customer ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={scheduleCallFormData.scheduledDate}
                onChange={(e) => setScheduleCallFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={scheduleCallFormData.scheduledTime}
                onChange={(e) => setScheduleCallFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select 
              value={scheduleCallFormData.priority}
              onChange={(e) => setScheduleCallFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
            <textarea
              rows={3}
              value={scheduleCallFormData.purpose}
              onChange={(e) => setScheduleCallFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="Purpose of the call..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowScheduleCallModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Schedule Call
            </Button>
          </div>
        </form>
      </Modal>

      {/* Existing Modals */}
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