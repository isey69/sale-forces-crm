import { useState, useEffect } from 'react';
import { labelService } from '../services/labelService';
import toast from 'react-hot-toast';

export const useLabels = () => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      const labelsData = await labelService.getAllLabels();
      setLabels(labelsData);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const addLabel = async (labelData) => {
    try {
      const newLabel = await labelService.addLabel(labelData);
      setLabels((prev) => [...prev, newLabel]);
      toast.success('Label added successfully');
      return newLabel;
    } catch (err) {
      toast.error('Failed to add label');
      throw err;
    }
  };

  const updateLabel = async (labelId, updates) => {
    try {
      const updatedLabel = await labelService.updateLabel(labelId, updates);
      setLabels((prev) =>
        prev.map((label) =>
          label.id === labelId ? { ...label, ...updatedLabel } : label
        )
      );
      toast.success('Label updated successfully');
      return updatedLabel;
    } catch (err) {
      toast.error('Failed to update label');
      throw err;
    }
  };

  const deleteLabel = async (labelId) => {
    try {
      await labelService.deleteLabel(labelId);
      setLabels((prev) => prev.filter((label) => label.id !== labelId));
      toast.success('Label deleted successfully');
    } catch (err) {
      toast.error('Failed to delete label');
      throw err;
    }
  };

  useEffect(() => {
    loadLabels();
  }, []);

  return {
    labels,
    loading,
    error,
    loadLabels,
    addLabel,
    updateLabel,
    deleteLabel,
  };
};
