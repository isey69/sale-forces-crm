import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { callService } from '../../services/callService';
import toast from 'react-hot-toast';

const LogCallModal = ({ isOpen, onClose, call, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!call) return;

    setIsSubmitting(true);
    try {
      await callService.completeScheduledCall(call.id, {
        notes,
        duration: parseInt(duration, 10) || 0,
      });
      toast.success('Call logged successfully');
      onSuccess();
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Call for ${call.purpose}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration (in minutes)
          </label>
          <input
            type="number"
            id="duration"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g., 15"
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
