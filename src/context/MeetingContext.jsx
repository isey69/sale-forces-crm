import React, { createContext, useContext, useState, useEffect } from "react";
import {
  meetingService,
  meetingCategoryService,
} from "../services/meetingService";

const MeetingContext = createContext({});

export const useMeetings = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeetings must be used within a MeetingProvider");
  }
  return context;
};

export const MeetingProvider = ({ children }) => {
  const [meetings, setMeetings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all", // 'all', 'scheduled', 'completed', 'cancelled'
    category: "all",
    dateRange: "upcoming", // 'all', 'upcoming', 'today', 'thisWeek', 'thisMonth'
    search: "",
  });

  // Load meetings and categories
  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedMeetings, fetchedCategories] = await Promise.all([
        meetingService.getAllMeetings(),
        meetingCategoryService.getAllCategories(),
      ]);
      setMeetings(fetchedMeetings);
      setCategories(fetchedCategories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered meetings
  const getFilteredMeetings = () => {
    let filtered = [...meetings];

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (meeting) => meeting.status === filters.status
      );
    }

    // Filter by category
    if (filters.category !== "all") {
      filtered = filtered.filter(
        (meeting) => meeting.category === filters.category
      );
    }

    // Filter by date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filters.dateRange) {
      case "upcoming":
        filtered = filtered.filter((meeting) => {
          const meetingDate =
            meeting.date?.toDate?.() || new Date(meeting.date);
          return meetingDate >= today;
        });
        break;
      case "today":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter((meeting) => {
          const meetingDate =
            meeting.date?.toDate?.() || new Date(meeting.date);
          return meetingDate >= today && meetingDate < tomorrow;
        });
        break;
      case "thisWeek":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        filtered = filtered.filter((meeting) => {
          const meetingDate =
            meeting.date?.toDate?.() || new Date(meeting.date);
          return meetingDate >= weekStart && meetingDate < weekEnd;
        });
        break;
      case "thisMonth":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        filtered = filtered.filter((meeting) => {
          const meetingDate =
            meeting.date?.toDate?.() || new Date(meeting.date);
          return meetingDate >= monthStart && meetingDate < monthEnd;
        });
        break;
    }

    // Filter by search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchTerm) ||
          meeting.description?.toLowerCase().includes(searchTerm) ||
          meeting.category?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = a.date?.toDate?.() || new Date(a.date);
      const dateB = b.date?.toDate?.() || new Date(b.date);
      return dateA - dateB;
    });

    return filtered;
  };

  // Create meeting
  const createMeeting = async (meetingData) => {
    try {
      setError(null);
      const newMeeting = await meetingService.createMeeting(meetingData);
      setMeetings((prev) => [...prev, newMeeting]);
      return newMeeting;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update meeting
  const updateMeeting = async (id, updates) => {
    try {
      setError(null);
      const updatedMeeting = await meetingService.updateMeeting(id, updates);
      setMeetings((prev) =>
        prev.map((meeting) => (meeting.id === id ? updatedMeeting : meeting))
      );
      return updatedMeeting;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete meeting
  const deleteMeeting = async (id) => {
    try {
      setError(null);
      await meetingService.deleteMeeting(id);
      setMeetings((prev) => prev.filter((meeting) => meeting.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update meeting status
  const updateMeetingStatus = async (id, status) => {
    try {
      setError(null);
      const updatedMeeting = await meetingService.updateMeetingStatus(
        id,
        status
      );
      setMeetings((prev) =>
        prev.map((meeting) => (meeting.id === id ? updatedMeeting : meeting))
      );
      return updatedMeeting;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Add meeting notes
  const addMeetingNotes = async (id, notes) => {
    try {
      setError(null);
      const updatedMeeting = await meetingService.addMeetingNotes(id, notes);
      setMeetings((prev) =>
        prev.map((meeting) => (meeting.id === id ? updatedMeeting : meeting))
      );
      return updatedMeeting;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Category management
  const createCategory = async (categoryData) => {
    try {
      setError(null);
      const newCategory = await meetingCategoryService.createCategory(
        categoryData
      );
      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      setError(null);
      const updatedCategory = await meetingCategoryService.updateCategory(
        id,
        updates
      );
      setCategories((prev) =>
        prev.map((category) =>
          category.id === id ? updatedCategory : category
        )
      );
      return updatedCategory;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteCategory = async (id) => {
    try {
      setError(null);
      const categoryToDelete = categories.find((c) => c.id === id);

      // Check if category is in use
      const inUse = await meetingCategoryService.isCategoryInUse(
        categoryToDelete.name
      );
      if (inUse) {
        throw new Error(
          "Cannot delete category that is being used by meetings"
        );
      }

      await meetingCategoryService.deleteCategory(id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get meetings for specific customer
  const getMeetingsForCustomer = async (customerId) => {
    try {
      return await meetingService.getMeetingsForCustomer(customerId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get meetings for date range
  const getMeetingsByDateRange = async (startDate, endDate) => {
    try {
      return await meetingService.getMeetingsByDateRange(startDate, endDate);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get today's meetings
  const getTodaysMeetings = () => {
    const today = new Date();
    const todayStr = today.toDateString();

    return meetings.filter((meeting) => {
      const meetingDate = meeting.date?.toDate?.() || new Date(meeting.date);
      return meetingDate.toDateString() === todayStr;
    });
  };

  // Get upcoming meetings (next 7 days)
  const getUpcomingMeetings = () => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    return meetings
      .filter((meeting) => {
        const meetingDate = meeting.date?.toDate?.() || new Date(meeting.date);
        return (
          meetingDate >= now &&
          meetingDate <= weekFromNow &&
          meeting.status === "scheduled"
        );
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate?.() || new Date(a.date);
        const dateB = b.date?.toDate?.() || new Date(b.date);
        return dateA - dateB;
      });
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Load data on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  const value = {
    meetings,
    categories,
    filteredMeetings: getFilteredMeetings(),
    loading,
    error,
    filters,
    loadMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateMeetingStatus,
    addMeetingNotes,
    createCategory,
    updateCategory,
    deleteCategory,
    getMeetingsForCustomer,
    getMeetingsByDateRange,
    getTodaysMeetings,
    getUpcomingMeetings,
    updateFilters,
    clearError,
  };

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
};
