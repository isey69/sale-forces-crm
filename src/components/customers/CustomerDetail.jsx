import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Plus,
  Users,
  Building,
  Phone,
  Mail,
  Calendar,
  FileText,
  Settings,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useCustomer } from "../../hooks/useCustomers";
import Modal from "../common/Modal";
import CustomerForm from "./CustomerForm";

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const {
    customer,
    relationships,
    loading,
    updateCustomer,
    addRelationship,
    removeRelationship,
    updateCustomFields,
  } = useCustomer(customerId);

  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);

  // Handler functions
  const handleEditCustomer = () => {
    setShowEditModal(true);
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      await updateCustomer(customerData);
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  const handleAddRelationship = () => {
    setShowRelationshipModal(true);
  };

  const handleRemoveRelationship = async (relationshipId) => {
    try {
      await removeRelationship(relationshipId);
    } catch (error) {
      console.error("Failed to remove relationship:", error);
    }
  };

  const handleScheduleMeeting = () => {
    console.log("Schedule meeting clicked");
  };

  const handleAddNote = () => {
    console.log("Add note clicked");
  };

  const handleAddCustomField = () => {
    console.log("Add custom field clicked");
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: Users },
    { key: "meetings", label: "Meetings", icon: Calendar },
    { key: "notes", label: "Notes", icon: FileText },
    { key: "custom", label: "Custom Fields", icon: Settings },
  ];

  const getTypeIcon = (type) => {
    return type === "CPA" ? (
      <Building className="w-4 h-4 text-primary-600" />
    ) : (
      <Users className="w-4 h-4 text-secondary-600" />
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-xl p-6">
              <div className="h-6 bg-secondary-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
                <div className="h-4 bg-secondary-200 rounded w-1/2"></div>
                <div className="h-4 bg-secondary-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Customer not found state
  if (!customer && !loading) {
    return (
      <div className="min-h-screen bg-secondary-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Customer Not Found
            </h2>
            <p className="text-secondary-600 mb-6">
              The customer you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/customers")}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-secondary-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/customers")}
            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xl font-bold text-primary-800">
                  {customer?.name?.charAt(0)}
                  {customer?.surname?.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-secondary-900">
                  {customer?.title} {customer?.name} {customer?.surname}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {getTypeIcon(customer?.type)}
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      customer?.type === "CPA"
                        ? "bg-primary-100 text-primary-800"
                        : "bg-secondary-100 text-secondary-800"
                    }`}
                  >
                    {customer?.type}
                  </span>
                  {customer?.cpaNumber && (
                    <span className="text-sm text-secondary-600">
                      • {customer.cpaNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleEditCustomer}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit Customer
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-secondary-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customer?.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-secondary-400" />
                          <div>
                            <p className="text-sm text-secondary-600">Email</p>
                            <p className="text-secondary-900">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      )}
                      {customer?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-secondary-400" />
                          <div>
                            <p className="text-sm text-secondary-600">Phone</p>
                            <p className="text-secondary-900">
                              {customer.phone}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Relationships */}
                  <div className="bg-secondary-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        Related{" "}
                        {customer?.type === "CPA"
                          ? "NonCPA Clients"
                          : "CPA Professionals"}
                      </h3>
                      <button
                        onClick={handleAddRelationship}
                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Relationship
                      </button>
                    </div>
                    <div className="space-y-3">
                      {relationships && relationships.length > 0 ? (
                        relationships.map((relation) => (
                          <div
                            key={relation.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getTypeIcon(relation.type)}
                              <div>
                                <p className="font-medium text-secondary-900">
                                  {relation.name} {relation.surname}
                                </p>
                                <p className="text-sm text-secondary-600">
                                  {relation.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveRelationship(relation.id)
                                }
                                className="p-1 text-secondary-400 hover:text-danger-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-secondary-600">
                          No relationships found
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="space-y-6">
                  <div className="bg-secondary-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                      Activity Summary
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-secondary-600">
                          Total Meetings
                        </p>
                        <p className="text-2xl font-bold text-secondary-900">
                          0
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600">
                          Last Activity
                        </p>
                        <p className="text-secondary-900">
                          {customer?.lastActivity
                            ? new Date(
                                customer.lastActivity
                              ).toLocaleDateString()
                            : "No activity"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600">
                          Customer Since
                        </p>
                        <p className="text-secondary-900">
                          {customer?.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={handleScheduleMeeting}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Meeting
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Add Note
                      </button>
                      <button
                        onClick={handleAddRelationship}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Relationship
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Meetings Tab */}
            {activeTab === "meetings" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Meetings History
                  </h3>
                  <button
                    onClick={handleScheduleMeeting}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Schedule Meeting
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-secondary-50 rounded-lg p-6">
                    <p className="text-secondary-600 text-center">
                      No meetings scheduled yet
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Customer Notes
                  </h3>
                  <button
                    onClick={handleAddNote}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Note
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-secondary-50 rounded-lg p-6">
                    <p className="text-secondary-600 text-center">
                      No notes available
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Fields Tab */}
            {activeTab === "custom" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Custom Fields
                  </h3>
                  <button
                    onClick={handleAddCustomField}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer?.customFields &&
                  Object.keys(customer.customFields).length > 0 ? (
                    Object.entries(customer.customFields).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="bg-secondary-50 rounded-lg p-4"
                        >
                          <p className="text-sm text-secondary-600 mb-1 capitalize">
                            {key.replace("_", " ")}
                          </p>
                          <p className="text-secondary-900 font-medium">
                            {value}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div className="col-span-2 bg-secondary-50 rounded-lg p-6">
                      <p className="text-secondary-600 text-center">
                        No custom fields added yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Customer Modal */}
        {showEditModal && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Customer"
            size="large"
          >
            <CustomerForm
              customer={customer}
              onSave={handleSaveCustomer}
              onCancel={() => setShowEditModal(false)}
            />
          </Modal>
        )}

        {/* Add Relationship Modal */}
        {showRelationshipModal && (
          <Modal
            isOpen={showRelationshipModal}
            onClose={() => setShowRelationshipModal(false)}
            title="Add Relationship"
          >
            <div className="text-center py-8">
              <p className="text-secondary-600">
                Relationship functionality coming soon...
              </p>
              <button
                onClick={() => setShowRelationshipModal(false)}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
