import React, { useState, useEffect } from "react";
import { useCustomers } from "../../context/CustomerContext";
import Input, { Select } from "../common/Input";
import Button from "../common/Button";
import Modal from "../common/Modal";

const CustomerForm = ({ isOpen, onClose, customer = null, onSuccess }) => {
  const { createCustomer, updateCustomer, customers } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    type: "CPA",
    cpaNumber: "",
    title: "",
    name: "",
    surname: "",
    email: "",
    phone: "",
    customFields: {},
    relationships: [],
  });
  const [showRelationships, setShowRelationships] = useState(false);
  const [selectedRelationships, setSelectedRelationships] = useState([]);

  const isEditing = !!customer;

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        type: customer.type || "CPA",
        cpaNumber: customer.cpaNumber || "",
        title: customer.title || "",
        name: customer.name || "",
        surname: customer.surname || "",
        email: customer.email || "",
        phone: customer.phone || "",
        customFields: customer.customFields || {},
        relationships: customer.relationships || [],
      });
      setSelectedRelationships(customer.relationships || []);
    } else {
      // Reset for new customer
      setFormData({
        type: "CPA",
        cpaNumber: "",
        title: "",
        name: "",
        surname: "",
        email: "",
        phone: "",
        customFields: {},
        relationships: [],
      });
      setSelectedRelationships([]);
    }
    setErrors({});
  }, [customer, isOpen]);

  const titleOptions = [
    { value: "Mr.", label: "Mr." },
    { value: "Ms.", label: "Ms." },
    { value: "Mrs.", label: "Mrs." },
    { value: "Dr.", label: "Dr." },
    { value: "Prof.", label: "Prof." },
  ];

  const customerTypeOptions = [
    { value: "CPA", label: "CPA" },
    { value: "NonCPA", label: "NonCPA" },
  ];

  // Get available customers for relationships (opposite type)
  const getAvailableRelationships = () => {
    const oppositeType = formData.type === "CPA" ? "NonCPA" : "CPA";
    return customers.filter(
      (c) => c.type === oppositeType && c.id !== customer?.id // Exclude self when editing
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear CPA number when switching to NonCPA
    if (name === "type" && value === "NonCPA") {
      setFormData((prev) => ({
        ...prev,
        cpaNumber: "",
      }));
      setSelectedRelationships([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.surname.trim()) newErrors.surname = "Surname is required";

    // CPA specific validation
    if (formData.type === "CPA" && !formData.cpaNumber.trim()) {
      newErrors.cpaNumber = "CPA Number is required";
    }

    // Email validation (if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone validation (if provided)
    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        newErrors.phone = "Invalid phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const customerData = {
        ...formData,
        relationships: selectedRelationships,
      };

      let result;
      if (isEditing) {
        result = await updateCustomer(customer.id, customerData);
      } else {
        result = await createCustomer(customerData);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save customer:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRelationshipToggle = (customerId) => {
    setSelectedRelationships((prev) => {
      if (prev.includes(customerId)) {
        return prev.filter((id) => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const availableRelationships = getAvailableRelationships();

  const footer = (
    <div className="flex justify-between w-full">
      <div className="flex space-x-2">
        {!isEditing && availableRelationships.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowRelationships(!showRelationships)}
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            }
          >
            {showRelationships ? "Hide" : "Add"} Relationships
          </Button>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="customer-form"
          variant="primary"
          loading={loading}
        >
          {isEditing ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Customer" : "Add New Customer"}
      size="lg"
      footer={footer}
    >
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Type */}
        <Select
          label="Customer Type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          options={customerTypeOptions}
          required
          error={errors.type}
        />

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            options={titleOptions}
            placeholder="Select title"
            required
            error={errors.title}
          />

          {formData.type === "CPA" && (
            <Input
              label="CPA Number"
              name="cpaNumber"
              value={formData.cpaNumber}
              onChange={handleInputChange}
              placeholder="Enter CPA number"
              required
              error={errors.cpaNumber}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter first name"
            required
            error={errors.name}
          />

          <Input
            label="Last Name"
            name="surname"
            value={formData.surname}
            onChange={handleInputChange}
            placeholder="Enter last name"
            required
            error={errors.surname}
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter email address"
            error={errors.email}
            icon={
              <svg
                className="w-5 h-5"
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
            }
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Enter phone number"
            error={errors.phone}
            icon={
              <svg
                className="w-5 h-5"
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
            }
          />
        </div>

        {/* Relationships Section */}
        {showRelationships && availableRelationships.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Relationships (
              {formData.type === "CPA" ? "NonCPA Clients" : "CPA Professionals"}
              )
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
              {availableRelationships.map((availableCustomer) => (
                <label
                  key={availableCustomer.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRelationships.includes(
                      availableCustomer.id
                    )}
                    onChange={() =>
                      handleRelationshipToggle(availableCustomer.id)
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3 flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                        availableCustomer.type === "CPA"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    >
                      {availableCustomer.name.charAt(0)}
                      {availableCustomer.surname.charAt(0)}
                    </div>
                    <span className="ml-2 text-sm text-gray-700">
                      {availableCustomer.name} {availableCustomer.surname}
                      {availableCustomer.email && (
                        <span className="text-gray-500">
                          {" "}
                          • {availableCustomer.email}
                        </span>
                      )}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {selectedRelationships.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedRelationships.length} relationship(s) selected
              </p>
            )}
          </div>
        )}

        {/* Error Messages */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CustomerForm;
