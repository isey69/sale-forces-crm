import { useState, useEffect } from 'react';
import { callService } from '../services/callService';
import toast from 'react-hot-toast';

export const useCalls = (customerId) => {
  const [callHistory, setCallHistory] = useState([]);
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    completed: 0,
    noAnswer: 0,
    postponed: 0,
    scheduled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all call data
  const loadCallData = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [historyData, scheduledData, statsData] = await Promise.all([
        callService.getCallHistory(customerId),
        callService.getScheduledCalls(customerId),
        callService.getCallStatistics(customerId)
      ]);
      
      setCallHistory(historyData);
      setScheduledCalls(scheduledData);
      setCallStats(statsData);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load call data');
    } finally {
      setLoading(false);
    }
  };

  // Add call to history
  const addCallToHistory = async (callData) => {
    try {
      const newCall = await callService.addCallToHistory({
        ...callData,
        customerId
      });
      setCallHistory(prev => [newCall, ...prev]);
      
      // Update stats
      const updatedStats = await callService.getCallStatistics(customerId);
      setCallStats(updatedStats);
      
      toast.success('Call logged successfully');
      return newCall;
    } catch (err) {
      toast.error('Failed to log call');
      throw err;
    }
  };

  // Update call in history
  const updateCallHistory = async (callId, updates) => {
    try {
      const updatedCall = await callService.updateCallHistory(callId, updates);
      setCallHistory(prev => 
        prev.map(call => 
          call.id === callId ? { ...call, ...updatedCall } : call
        )
      );
      
      // Update stats
      const updatedStats = await callService.getCallStatistics(customerId);
      setCallStats(updatedStats);
      
      toast.success('Call updated successfully');
      return updatedCall;
    } catch (err) {
      toast.error('Failed to update call');
      throw err;
    }
  };

  // Delete call from history
  const deleteCallHistory = async (callId) => {
    try {
      await callService.deleteCallHistory(callId);
      setCallHistory(prev => prev.filter(call => call.id !== callId));
      
      // Update stats
      const updatedStats = await callService.getCallStatistics(customerId);
      setCallStats(updatedStats);
      
      toast.success('Call deleted successfully');
    } catch (err) {
      toast.error('Failed to delete call');
      throw err;
    }
  };

  // Schedule a call
  const scheduleCall = async (callData) => {
    try {
      const newScheduledCall = await callService.scheduleCall({
        ...callData,
        customerId
      });
      setScheduledCalls(prev => [...prev, newScheduledCall].sort((a, b) => 
        new Date(a.scheduledDate) - new Date(b.scheduledDate)
      ));
      
      // Update stats
      const updatedStats = await callService.getCallStatistics(customerId);
      setCallStats(updatedStats);
      
      toast.success('Call scheduled successfully');
      return newScheduledCall;
    } catch (err) {
      toast.error('Failed to schedule call');
      throw err;
    }
  };

  // Update scheduled call
  const updateScheduledCall = async (callId, updates) => {
    try {
      const updatedCall = await callService.updateScheduledCall(callId, updates);
      setScheduledCalls(prev => 
        prev.map(call => 
          call.id === callId ? { ...call, ...updatedCall } : call
        ).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
      );
      
      toast.success('Scheduled call updated successfully');
      return updatedCall;
    } catch (err) {
      toast.error('Failed to update scheduled call');
      throw err;
    }
  };

  // Cancel scheduled call
  const cancelScheduledCall = async (callId) => {
    try {
      await callService.cancelScheduledCall(callId);
      setScheduledCalls(prev => prev.filter(call => call.id !== callId));
      
      // Update stats
      const updatedStats = await callService.getCallStatistics(customerId);
      setCallStats(updatedStats);
      
      toast.success('Scheduled call cancelled successfully');
    } catch (err) {
      toast.error('Failed to cancel scheduled call');
      throw err;
    }
  };

  // Complete a scheduled call
  const completeScheduledCall = async (scheduledCallId, callOutcome) => {
    try {
      await callService.completeScheduledCall(scheduledCallId, callOutcome);
      
      // Reload all data
      await loadCallData();
      
      toast.success('Call completed and logged to history');
    } catch (err) {
      toast.error('Failed to complete scheduled call');
      throw err;
    }
  };

  // Initial load
  useEffect(() => {
    loadCallData();
  }, [customerId]);

  return {
    callHistory,
    scheduledCalls,
    callStats,
    loading,
    error,
    loadCallData,
    addCallToHistory,
    updateCallHistory,
    deleteCallHistory,
    scheduleCall,
    updateScheduledCall,
    cancelScheduledCall,
    completeScheduledCall
  };
};