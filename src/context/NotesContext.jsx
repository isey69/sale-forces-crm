import React, { createContext, useContext, useState, useEffect } from "react";
import noteService from "../services/noteService";

const NotesContext = createContext({});

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: "all", // 'all', 'general', 'meeting', 'customer', 'task'
    priority: "all", // 'all', 'low', 'medium', 'high'
    tag: "",
    search: "",
    relatedTo: null, // { type: 'customer'|'meeting', id: string }
  });

  // Load notes and tags
  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedNotes, fetchedTags] = await Promise.all([
        noteService.getAllNotes(),
        noteService.getAllTags(),
      ]);
      setNotes(fetchedNotes);
      setTags(fetchedTags);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered notes
  const getFilteredNotes = () => {
    let filtered = [...notes];

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter((note) => note.type === filters.type);
    }

    // Filter by priority
    if (filters.priority !== "all") {
      filtered = filtered.filter((note) => note.priority === filters.priority);
    }

    // Filter by tag
    if (filters.tag) {
      filtered = filtered.filter(
        (note) => note.tags && note.tags.includes(filters.tag)
      );
    }

    // Filter by related entity
    if (filters.relatedTo) {
      filtered = filtered.filter(
        (note) =>
          note.relatedTo &&
          note.relatedTo.type === filters.relatedTo.type &&
          note.relatedTo.id === filters.relatedTo.id
      );
    }

    // Filter by search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm) ||
          note.content.toLowerCase().includes(searchTerm) ||
          (note.tags &&
            note.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Sort by updated date (most recent first)
    filtered.sort((a, b) => {
      const dateA = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
      const dateB = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
      return dateB - dateA;
    });

    return filtered;
  };

  // Create note
  const createNote = async (noteData) => {
    try {
      setError(null);
      const newNote = await noteService.createNote(noteData);
      setNotes((prev) => [newNote, ...prev]);

      // Update tags if new ones were added
      if (noteData.tags && noteData.tags.length > 0) {
        const newTags = noteData.tags.filter((tag) => !tags.includes(tag));
        if (newTags.length > 0) {
          setTags((prev) => [...prev, ...newTags].sort());
        }
      }

      return newNote;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update note
  const updateNote = async (id, updates) => {
    try {
      setError(null);
      const updatedNote = await noteService.updateNote(id, updates);
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updatedNote : note))
      );

      // Update tags if new ones were added
      if (updates.tags && updates.tags.length > 0) {
        const newTags = updates.tags.filter((tag) => !tags.includes(tag));
        if (newTags.length > 0) {
          setTags((prev) => [...prev, ...newTags].sort());
        }
      }

      return updatedNote;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete note
  const deleteNote = async (id) => {
    try {
      setError(null);
      await noteService.deleteNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get notes by type
  const getNotesByType = (type) => {
    return notes.filter((note) => note.type === type);
  };

  // Get notes related to entity
  const getRelatedNotes = (entityType, entityId) => {
    return notes.filter(
      (note) =>
        note.relatedTo &&
        note.relatedTo.type === entityType &&
        note.relatedTo.id === entityId
    );
  };

  // Get recent notes (last 7 days)
  const getRecentNotes = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return notes
      .filter((note) => {
        const createdAt =
          note.createdAt?.toDate?.() || new Date(note.createdAt);
        return createdAt >= weekAgo;
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
  };

  // Get notes by priority
  const getNotesByPriority = (priority) => {
    return notes.filter((note) => note.priority === priority);
  };

  // Search notes
  const searchNotes = async (searchTerm) => {
    try {
      setError(null);
      return await noteService.searchNotes(searchTerm);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get notes statistics
  const getNotesStats = () => {
    const total = notes.length;
    const byType = {
      general: notes.filter((n) => n.type === "general").length,
      meeting: notes.filter((n) => n.type === "meeting").length,
      customer: notes.filter((n) => n.type === "customer").length,
      task: notes.filter((n) => n.type === "task").length,
    };
    const byPriority = {
      low: notes.filter((n) => n.priority === "low").length,
      medium: notes.filter((n) => n.priority === "medium").length,
      high: notes.filter((n) => n.priority === "high").length,
    };
    const recent = getRecentNotes().length;

    return { total, byType, byPriority, recent };
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      type: "all",
      priority: "all",
      tag: "",
      search: "",
      relatedTo: null,
    });
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Load data on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const value = {
    notes,
    tags,
    filteredNotes: getFilteredNotes(),
    loading,
    error,
    filters,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    getNotesByType,
    getRelatedNotes,
    getRecentNotes,
    getNotesByPriority,
    searchNotes,
    getNotesStats,
    updateFilters,
    clearFilters,
    clearError,
  };

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
};
