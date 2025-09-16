import React, { useState } from "react";
import { useCustomers } from "../../context/CustomerContext";
import Button from "../common/Button";
import Modal, { ConfirmModal } from "../common/Modal";

const CustomerCard = ({ customer, onEdit, showRelationships = true }) => {
  const { customers, removeRelationship, deleteCustomer } = useCustomers();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRelationshipsModal, setShowRelationshipsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get related customers
  const getRelatedCustomers = () => {
    if (!customer.relationships || customer.relationships.length === 0)
      return [];
    return customers.filter((c) => customer.relationships.includes(c.id));
  };

  const relatedCustomers = getRelatedCustomers();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteCustomer(customer.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRelationship = async (relatedCustomerId) => {
    try {
      await removeRelationship(customer.id, relatedCustomerId);
    } catch (error) {
      console.error("Failed to remove relationship:", error);
    }
  };

  const getInitials = (name, surname) => {
    return `${name?.charAt(0) || ""}${surname?.charAt(0) || ""}`.toUpperCase();
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    // Basic phone formatting
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-card border border-gray-200 hover:shadow-card-hover transition-all duration-200 overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-4 ${
            customer.type === "CPA" ? "bg-green-50" : "bg-purple-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                  customer.type === "CPA" ? "bg-green-500" : "bg-purple-500"
                }`}
              >
                {getInitials(customer.name, customer.surname)}
              </div>

              {/* Name and Type */}
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {customer.title} {customer.name} {customer.surname}
                </h3>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customer.type === "CPA"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {customer.type}
                  </span>
                  {customer.cpaNumber && (
                    <span className="text-sm text-gray-600">
                      #{customer.cpaNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(customer)}
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            {customer.email && (
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-gray-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    {customer.email}
                  </a>
                </div>
              </div>
            )}

            {/* Phone */}
            {customer.phone && (
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-gray-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    {formatPhone(customer.phone)}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {customer.customFields &&
            Object.keys(customer.customFields).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(customer.customFields).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-gray-500 capitalize">{key}:</span>
                      <span className="ml-2 text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Relationships */}
          {showRelationships && relatedCustomers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Related {customer.type === "CPA" ? "Clients" : "CPAs"} (
                  {relatedCustomers.length})
                </h4>
                {relatedCustomers.length > 2 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowRelationshipsModal(true)}
                  >
                    View all
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {relatedCustomers.slice(0, 2).map((related) => (
                  <div
                    key={related.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          related.type === "CPA"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        }`}
                      >
                        {getInitials(related.name, related.surname)}
                      </div>
                      <span className="ml-2 text-sm text-gray-700">
                        {related.name} {related.surname}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleRemoveRelationship(related.id)}
                      className="text-red-600 hover:text-red-700"
                      icon={
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Added{" "}
              {new Date(
                customer.createdAt?.toDate?.() || customer.createdAt
              ).toLocaleDateString()}
            </span>
            {customer.updatedAt && (
              <span>
                Updated{" "}
                {new Date(
                  customer.updatedAt?.toDate?.() || customer.updatedAt
                ).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer.name} ${customer.surname}? This action cannot be undone and will remove all relationships.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
      />

      {/* All Relationships Modal */}
      <Modal
        isOpen={showRelationshipsModal}
        onClose={() => setShowRelationshipsModal(false)}
        title={`${customer.name}'s Related ${
          customer.type === "CPA" ? "Clients" : "CPAs"
        }`}
        size="md"
      >
        <div className="space-y-3">
          {relatedCustomers.map((related) => (
            <div
              key={related.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    related.type === "CPA" ? "bg-green-500" : "bg-purple-500"
                  }`}
                >
                  {getInitials(related.name, related.surname)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {related.name} {related.surname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {related.type} {related.email && `• ${related.email}`}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleRemoveRelationship(related.id)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default CustomerCard;
