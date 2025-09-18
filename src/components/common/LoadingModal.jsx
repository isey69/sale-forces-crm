import React from 'react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const LoadingModal = ({ isOpen, message = 'Loading...' }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Don't close on click
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="sm"
    >
      <div className="flex flex-col items-center justify-center p-6">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
      </div>
    </Modal>
  );
};

export default LoadingModal;
