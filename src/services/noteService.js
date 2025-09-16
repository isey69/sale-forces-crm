import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const NOTES_COLLECTION = "notes";

// Note data structure:
// {
//   id: string,
//   title: string,
//   content: string,
//   type: 'general' | 'meeting' | 'customer' | 'task',
//   relatedTo?: {
//     type: 'customer' | 'meeting',
//     id: string,
//     name: string
//   },
//   tags: array of strings,
//   priority: 'low' | 'medium' | 'high',
//   isPrivate: boolean,
//   createdBy: string (user ID),
//   createdAt: timestamp,
//   updatedAt: timestamp
// }

export const noteService = {
  // Get all notes
  async getAllNotes() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, NOTES_COLLECTION), orderBy("updatedAt", "desc"))
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching notes:", error);
      throw error;
    }
  },

  // Get notes by type
  async getNotesByType(type) {
    try {
      const q = query(
        collection(db, NOTES_COLLECTION),
        where("type", "==", type),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching notes by type:", error);
      throw error;
    }
  },

  // Get notes related to specific entity
  async getRelatedNotes(entityType, entityId) {
    try {
      const q = query(
        collection(db, NOTES_COLLECTION),
        where("relatedTo.type", "==", entityType),
        where("relatedTo.id", "==", entityId),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching related notes:", error);
      throw error;
    }
  },

  // Get notes by tags
  async getNotesByTag(tag) {
    try {
      const q = query(
        collection(db, NOTES_COLLECTION),
        where("tags", "array-contains", tag),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching notes by tag:", error);
      throw error;
    }
  },

  // Get single note
  async getNote(id) {
    try {
      const docRef = doc(db, NOTES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        throw new Error("Note not found");
      }
    } catch (error) {
      console.error("Error fetching note:", error);
      throw error;
    }
  },

  // Create new note
  async createNote(noteData) {
    try {
      const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
        ...noteData,
        tags: noteData.tags || [],
        priority: noteData.priority || "medium",
        isPrivate: noteData.isPrivate || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        id: docRef.id,
        ...noteData,
      };
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  },

  // Update note
  async updateNote(id, updates) {
    try {
      const docRef = doc(db, NOTES_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      return await this.getNote(id);
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  },

  // Delete note
  async deleteNote(id) {
    try {
      const docRef = doc(db, NOTES_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  },

  // Search notes
  async searchNotes(searchTerm) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia
      const notes = await this.getAllNotes();

      const searchLower = searchTerm.toLowerCase();
      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error("Error searching notes:", error);
      throw error;
    }
  },

  // Get all unique tags
  async getAllTags() {
    try {
      const notes = await this.getAllNotes();
      const allTags = new Set();

      notes.forEach((note) => {
        if (note.tags && note.tags.length > 0) {
          note.tags.forEach((tag) => allTags.add(tag));
        }
      });

      return Array.from(allTags).sort();
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  },

  // Get notes statistics
  async getNotesStats() {
    try {
      const notes = await this.getAllNotes();

      const stats = {
        total: notes.length,
        byType: {},
        byPriority: { low: 0, medium: 0, high: 0 },
        recentCount: 0,
      };

      // Count by type
      notes.forEach((note) => {
        stats.byType[note.type] = (stats.byType[note.type] || 0) + 1;
        stats.byPriority[note.priority] =
          (stats.byPriority[note.priority] || 0) + 1;
      });

      // Count recent notes (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      stats.recentCount = notes.filter((note) => {
        const createdAt =
          note.createdAt?.toDate?.() || new Date(note.createdAt);
        return createdAt >= weekAgo;
      }).length;

      return stats;
    } catch (error) {
      console.error("Error fetching notes stats:", error);
      throw error;
    }
  },
};

export default noteService;
