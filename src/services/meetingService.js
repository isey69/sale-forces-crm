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

const MEETINGS_COLLECTION = "meetings";
const CATEGORIES_COLLECTION = "meetingCategories";

// Meeting data structure:
// {
//   id: string,
//   title: string,
//   description?: string,
//   date: timestamp,
//   startTime: string, // "14:30"
//   endTime: string, // "15:30"
//   attendees: array of customer IDs,
//   category: string,
//   meetingLink?: string,
//   notes?: string,
//   status: 'scheduled' | 'completed' | 'cancelled',
//   createdAt: timestamp,
//   updatedAt: timestamp
// }

export const meetingService = {
  // Get all meetings
  async getAllMeetings() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, MEETINGS_COLLECTION), orderBy("date", "desc"))
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching meetings:", error);
      throw error;
    }
  },

  // Get meetings for a specific date range
  async getMeetingsByDateRange(startDate, endDate) {
    try {
      const start = Timestamp.fromDate(startDate);
      const end = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, MEETINGS_COLLECTION),
        where("date", ">=", start),
        where("date", "<=", end),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching meetings by date range:", error);
      throw error;
    }
  },

  // Get meetings for specific customer
  async getMeetingsForCustomer(customerId) {
    try {
      const q = query(
        collection(db, MEETINGS_COLLECTION),
        where("attendees", "array-contains", customerId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching customer meetings:", error);
      throw error;
    }
  },

  // Get single meeting
  async getMeeting(id) {
    try {
      const docRef = doc(db, MEETINGS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        throw new Error("Meeting not found");
      }
    } catch (error) {
      console.error("Error fetching meeting:", error);
      throw error;
    }
  },

  // Create new meeting
  async createMeeting(meetingData) {
    try {
      // Convert date string to Timestamp if needed
      const date =
        meetingData.date instanceof Date
          ? Timestamp.fromDate(meetingData.date)
          : Timestamp.fromDate(new Date(meetingData.date));

      const docRef = await addDoc(collection(db, MEETINGS_COLLECTION), {
        ...meetingData,
        date,
        status: meetingData.status || "scheduled",
        attendees: meetingData.attendees || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        id: docRef.id,
        ...meetingData,
        date,
      };
    } catch (error) {
      console.error("Error creating meeting:", error);
      throw error;
    }
  },

  // Update meeting
  async updateMeeting(id, updates) {
    try {
      const docRef = doc(db, MEETINGS_COLLECTION, id);

      // Convert date to Timestamp if it's being updated
      const updateData = { ...updates };
      if (updateData.date && !(updateData.date instanceof Timestamp)) {
        updateData.date =
          updateData.date instanceof Date
            ? Timestamp.fromDate(updateData.date)
            : Timestamp.fromDate(new Date(updateData.date));
      }

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });

      return await this.getMeeting(id);
    } catch (error) {
      console.error("Error updating meeting:", error);
      throw error;
    }
  },

  // Delete meeting
  async deleteMeeting(id) {
    try {
      const docRef = doc(db, MEETINGS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting meeting:", error);
      throw error;
    }
  },

  // Update meeting status
  async updateMeetingStatus(id, status) {
    try {
      return await this.updateMeeting(id, { status });
    } catch (error) {
      console.error("Error updating meeting status:", error);
      throw error;
    }
  },

  // Add notes to meeting
  async addMeetingNotes(id, notes) {
    try {
      return await this.updateMeeting(id, { notes });
    } catch (error) {
      console.error("Error adding meeting notes:", error);
      throw error;
    }
  },

  // Search meetings
  async searchMeetings(searchTerm) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia
      const meetings = await this.getAllMeetings();

      const searchLower = searchTerm.toLowerCase();
      return meetings.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchLower) ||
          meeting.description?.toLowerCase().includes(searchLower) ||
          meeting.category?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error("Error searching meetings:", error);
      throw error;
    }
  },
};

// Meeting Categories Service
export const meetingCategoryService = {
  // Get all categories
  async getAllCategories() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, CATEGORIES_COLLECTION), orderBy("name"))
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching meeting categories:", error);
      throw error;
    }
  },

  // Create category
  async createCategory(categoryData) {
    try {
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        ...categoryData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        id: docRef.id,
        ...categoryData,
      };
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  // Update category
  async updateCategory(id, updates) {
    try {
      const docRef = doc(db, CATEGORIES_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      const docSnap = await getDoc(docRef);
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  // Delete category
  async deleteCategory(id) {
    try {
      const docRef = doc(db, CATEGORIES_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  // Check if category is in use
  async isCategoryInUse(categoryName) {
    try {
      const q = query(
        collection(db, MEETINGS_COLLECTION),
        where("category", "==", categoryName)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking category usage:", error);
      throw error;
    }
  },
};

// Default categories to seed the database
export const defaultCategories = [
  {
    name: "Introduction",
    description: "Initial meeting with new clients",
    color: "#3B82F6",
  },
  {
    name: "Demonstration",
    description: "Product or service demonstrations",
    color: "#10B981",
  },
  {
    name: "Consultation",
    description: "Advisory and consultation sessions",
    color: "#8B5CF6",
  },
  {
    name: "Follow-up",
    description: "Follow-up meetings and check-ins",
    color: "#F59E0B",
  },
  {
    name: "Review",
    description: "Review meetings and assessments",
    color: "#EF4444",
  },
];

export default meetingService;
