import { 
  collection, 
  doc, 
  getDocs,
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { parse } from 'date-fns';

const CALL_HISTORY_COLLECTION = 'call_history';
const SCHEDULED_CALLS_COLLECTION = 'scheduled_calls';

export const callService = {
  // Get call history for a customer
  async getCallHistory(customerId) {
    try {
      const callHistoryRef = collection(db, CALL_HISTORY_COLLECTION);
      const q = query(
        callHistoryRef,
        where('customerId', '==', customerId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const calls = [];
      querySnapshot.forEach((doc) => {
        calls.push({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || doc.data().date
        });
      });
      
      return calls;
    } catch (error) {
      console.error('Error fetching call history:', error);
      throw error;
    }
  },

  // Get all call history
  async getAllCallHistory() {
    try {
      const callHistoryRef = collection(db, CALL_HISTORY_COLLECTION);
      const q = query(
        callHistoryRef,
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const calls = [];
      querySnapshot.forEach((doc) => {
        calls.push({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || doc.data().date
        });
      });

      return calls;
    } catch (error) {
      console.error('Error fetching all call history:', error);
      throw error;
    }
  },

  // Add call to history
  async addCallToHistory(callData) {
    try {
      const callHistoryRef = collection(db, CALL_HISTORY_COLLECTION);
      const newCall = {
        ...callData,
        date: new Date(callData.date),
        createdAt: new Date()
      };
      
      const docRef = await addDoc(callHistoryRef, newCall);
      return { id: docRef.id, ...newCall };
    } catch (error) {
      console.error('Error adding call to history:', error);
      throw error;
    }
  },

  // Update call in history
  async updateCallHistory(callId, updates) {
    try {
      const callRef = doc(db, CALL_HISTORY_COLLECTION, callId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      if (updates.date) {
        updateData.date = new Date(updates.date);
      }
      
      await updateDoc(callRef, updateData);
      return { id: callId, ...updateData };
    } catch (error) {
      console.error('Error updating call history:', error);
      throw error;
    }
  },

  // Delete call from history
  async deleteCallHistory(callId) {
    try {
      const callRef = doc(db, CALL_HISTORY_COLLECTION, callId);
      await deleteDoc(callRef);
      return true;
    } catch (error) {
      console.error('Error deleting call history:', error);
      throw error;
    }
  },

  // Get all scheduled calls (for meetings page)
  async getAllScheduledCalls() {
    try {
      const scheduledCallsRef = collection(db, SCHEDULED_CALLS_COLLECTION);
      const q = query(
        scheduledCallsRef,
        orderBy('scheduledDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      const calls = [];
      querySnapshot.forEach((doc) => {
        calls.push({
          id: doc.id,
          ...doc.data(),
          scheduledDate: doc.data().scheduledDate?.toDate?.() || doc.data().scheduledDate
        });
      });
      
      return calls;
    } catch (error) {
      console.error('Error fetching all scheduled calls:', error);
      throw error;
    }
  },

  // Get scheduled calls for a customer
  async getScheduledCalls(customerId) {
    try {
      const scheduledCallsRef = collection(db, SCHEDULED_CALLS_COLLECTION);
      const q = query(
        scheduledCallsRef,
        where('customerId', '==', customerId),
        orderBy('scheduledDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      const calls = [];
      querySnapshot.forEach((doc) => {
        calls.push({
          id: doc.id,
          ...doc.data(),
          scheduledDate: doc.data().scheduledDate?.toDate?.() || doc.data().scheduledDate
        });
      });
      
      return calls;
    } catch (error) {
      console.error('Error fetching scheduled calls:', error);
      throw error;
    }
  },

  // Schedule a call
  async scheduleCall(callData) {
    try {
      const scheduledCallsRef = collection(db, SCHEDULED_CALLS_COLLECTION);
      const newCall = {
        ...callData,
        scheduledDate: new Date(callData.scheduledDate),
        scheduledTime: callData.scheduledTime,
        createdAt: new Date(),
        status: 'scheduled'
      };
      
      const docRef = await addDoc(scheduledCallsRef, newCall);
      return { id: docRef.id, ...newCall };
    } catch (error) {
      console.error('Error scheduling call:', error);
      throw error;
    }
  },

  // Update scheduled call
  async updateScheduledCall(callId, updates) {
    try {
      const callRef = doc(db, SCHEDULED_CALLS_COLLECTION, callId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      if (updates.scheduledDate) {
        updateData.scheduledDate = new Date(updates.scheduledDate);
      }
      
      await updateDoc(callRef, updateData);
      return { id: callId, ...updateData };
    } catch (error) {
      console.error('Error updating scheduled call:', error);
      throw error;
    }
  },

  // Cancel scheduled call
  async cancelScheduledCall(callId) {
    try {
      const callRef = doc(db, SCHEDULED_CALLS_COLLECTION, callId);
      await deleteDoc(callRef);
      return true;
    } catch (error) {
      console.error('Error canceling scheduled call:', error);
      throw error;
    }
  },

  // Get call statistics for a customer
  async getCallStatistics(customerId) {
    try {
      const [callHistory, scheduledCalls] = await Promise.all([
        this.getCallHistory(customerId),
        this.getScheduledCalls(customerId)
      ]);

      const stats = {
        totalCalls: callHistory.length,
        completed: callHistory.filter(call => call.status === 'completed').length,
        noAnswer: callHistory.filter(call => call.status === 'no_answer').length,
        postponed: callHistory.filter(call => call.status === 'postponed').length,
        scheduled: scheduledCalls.length
      };

      return stats;
    } catch (error) {
      console.error('Error getting call statistics:', error);
      throw error;
    }
  },

  // Mark scheduled call as completed and move to history
  async completeScheduledCall(scheduledCallId, callOutcome) {
    try {
      // Get the scheduled call
      const callRef = doc(db, SCHEDULED_CALLS_COLLECTION, scheduledCallId);
      const callDoc = await getDoc(callRef);
      
      if (!callDoc.exists()) {
        throw new Error('Scheduled call not found');
      }

      const scheduledCall = callDoc.data();
      
      const callDate = callOutcome.date && callOutcome.time
        ? parse(`${callOutcome.date} ${callOutcome.time}`, 'yyyy-MM-dd HH:mm', new Date())
        : new Date();

      // Create call history entry
      const callHistoryData = {
        customerId: scheduledCall.customerId,
        date: callDate,
        time: callDate.toLocaleTimeString(),
        duration: callOutcome.duration || 0,
        status: callOutcome.status || 'completed',
        outcome: callOutcome.notes || '',
        callType: 'outbound',
        originalScheduledCall: scheduledCallId
      };

      // Add to call history
      await this.addCallToHistory(callHistoryData);
      
      // Remove from scheduled calls
      await this.cancelScheduledCall(scheduledCallId);

      return true;
    } catch (error) {
      console.error('Error completing scheduled call:', error);
      throw error;
    }
  },

  async logScheduledCallOutcome(scheduledCallId, callOutcome) {
    if (callOutcome.status === 'completed') {
      return this.completeScheduledCall(scheduledCallId, callOutcome);
    } else {
      // For 'no_answer' or 'postponed'
      const callRef = doc(db, SCHEDULED_CALLS_COLLECTION, scheduledCallId);
      const callDoc = await getDoc(callRef);

      if (!callDoc.exists()) {
        throw new Error('Scheduled call not found');
      }

      const scheduledCall = callDoc.data();

      const callDate = callOutcome.date && callOutcome.time
        ? parse(`${callOutcome.date} ${callOutcome.time}`, 'yyyy-MM-dd HH:mm', new Date())
        : new Date();

      const callHistoryData = {
        customerId: scheduledCall.customerId,
        date: callDate,
        time: callDate.toLocaleTimeString(),
        duration: 0, // No duration for these statuses
        status: callOutcome.status,
        outcome: callOutcome.notes || '',
        callType: 'outbound',
        originalScheduledCall: scheduledCallId
      };

      await this.addCallToHistory(callHistoryData);
      await this.cancelScheduledCall(scheduledCallId);
      return true;
    }
  }
};