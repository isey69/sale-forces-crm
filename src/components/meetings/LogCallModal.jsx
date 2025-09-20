import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { callService } from '../../services/callService';
import toast from 'react-hot-toast';

const LogCallModal = ({ isOpen, onClose, call, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '',
    notes: '',
    status: 'completed',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (call) {
      const scheduledDate = call.scheduledDate?.toDate ? call.scheduledDate.toDate() : new Date(call.scheduledDate);
      setFormData({
        date: scheduledDate.toISOString().split('T')[0],
        time: call.scheduledTime || '',
        duration: '',
        notes: call.purpose || '',
        status: 'completed',
      });
    }
  }, [call]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!call) return;

    setIsSubmitting(true);
    try {
      await callService.logScheduledCallOutcome(call.id, {
        notes: formData.notes,
        duration: parseInt(formData.duration, 10) || 0,
        date: formData.date,
        time: formData.time,
        status: formData.status,
      });
      toast.success('Call logged successfully');
      onSuccess(formData.status, call);
      onClose();
    } catch (error) {
      console.error('Error logging call:', error);
      toast.error('Failed to log call');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!call) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Call: ${call.purpose}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Time
            </label>
            <input
              type="time"
              id="time"
              name="time"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="completed">Completed</option>
            <option value="no_answer">No Answer</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration (in minutes)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g., 15"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.notes}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Logging...' : 'Log Call'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LogCallModal;
