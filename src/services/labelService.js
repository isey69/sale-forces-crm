import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

const LABELS_COLLECTION = 'labels';

export const labelService = {
  // Get all labels
  async getAllLabels() {
    try {
      const labelsRef = collection(db, LABELS_COLLECTION);
      const q = query(labelsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      const labels = [];
      querySnapshot.forEach((doc) => {
        labels.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return labels;
    } catch (error) {
      console.error('Error fetching labels:', error);
      throw error;
    }
  },

  // Add new label
  async addLabel(labelData) {
    try {
      const labelsRef = collection(db, LABELS_COLLECTION);
      const newLabel = {
        ...labelData,
        createdAt: new Date(),
      };

      const docRef = await addDoc(labelsRef, newLabel);
      return { id: docRef.id, ...newLabel };
    } catch (error) {
      console.error('Error adding label:', error);
      throw error;
    }
  },

  // Update label
  async updateLabel(labelId, updates) {
    try {
      const labelRef = doc(db, LABELS_COLLECTION, labelId);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(labelRef, updateData);
      return { id: labelId, ...updateData };
    } catch (error) {
      console.error('Error updating label:', error);
      throw error;
    }
  },

  // Delete label
  async deleteLabel(labelId) {
    try {
      const labelRef = doc(db, LABELS_COLLECTION, labelId);
      await deleteDoc(labelRef);
      // Note: This does not remove the label from customers who have it.
      // A more robust solution would be to run a script to remove the labelId from all customer documents.
      return true;
    } catch (error) {
      console.error('Error deleting label:', error);
      throw error;
    }
  },
};
