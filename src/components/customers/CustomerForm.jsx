import React, { useState, useEffect } from "react";
import { Save, X, User, Building } from "lucide-react";
import { CUSTOMER_STATUSES } from "../../utils/constants";

const CustomerForm = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    type: "CPA",
    cpaNumber: "",
    title: "Mr.",
    name: "",
    surname: "",
    email: "",
    phone: "",
    lineID: "",
    customerID: "",
    howNice: 5,
    address: "",
    companyName: "",
    companyId: "",
    companyAddress: "",
    status: "New",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        type: customer.type || "CPA",
        cpaNumber: customer.cpaNumber || "",
        title: customer.title || "Mr.",
        name: customer.name || "",
        surname: customer.surname || "",
        email: customer.email || "",
        phone: customer.phone || "",
        lineID: customer.lineID || "",
        customerID: customer.customerID || "",
        howNice: customer.howNice || 5,
        address: customer.address || "",
        companyName: customer.companyName || "",
        companyId: customer.companyId || "",
        companyAddress: customer.companyAddress || "",
        status: customer.status || "New",
      });
    }
  }, [customer]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.surname.trim()) {
      newErrors.surname = "Surname is required";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    // CPA Number required for CPA type
    if (formData.type === "CPA" && !formData.cpaNumber.trim()) {
      newErrors.cpaNumber = "CPA Number is required for CPA customers";
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (basic)
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSave(formData, setLoading);
  };

  const titleOptions = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Type */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Customer Type *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 p-4 border border-secondary-300 rounded-lg cursor-pointer hover:bg-secondary-50">
              <input
                type="radio"
                name="type"
                value="CPA"
                checked={formData.type === "CPA"}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <Building className="w-5 h-5 text-primary-600" />
              <span className="font-medium">CPA</span>
            </label>
            <label className="flex items-center space-x-3 p-4 border border-secondary-300 rounded-lg cursor-pointer hover:bg-secondary-50">
              <input
                type="radio"
                name="type"
                value="NonCPA"
                checked={formData.type === "NonCPA"}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <User className="w-5 h-5 text-secondary-600" />
              <span className="font-medium">NonCPA</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Title *
            </label>
            <select
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.title ? "border-red-300" : "border-secondary-300"
              }`}
            >
              {titleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* CPA Number */}
          {formData.type === "CPA" && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                CPA Number *
              </label>
              <input
                type="text"
                name="cpaNumber"
                value={formData.cpaNumber}
                onChange={handleInputChange}
                placeholder="e.g., CPA001"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.cpaNumber ? "border-red-300" : "border-secondary-300"
                }`}
              />
              {errors.cpaNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.cpaNumber}</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter first name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.name ? "border-red-300" : "border-secondary-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Surname */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              placeholder="Enter last name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.surname ? "border-red-300" : "border-secondary-300"
              }`}
            />
            {errors.surname && (
              <p className="mt-1 text-sm text-red-600">{errors.surname}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? "border-red-300" : "border-secondary-300"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.phone ? "border-red-300" : "border-secondary-300"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Line ID */}
            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                Line ID
                </label>
                <input
                type="text"
                name="lineID"
                value={formData.lineID}
                onChange={handleInputChange}
                placeholder="Enter Line ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.lineID ? "border-red-300" : "border-secondary-300"
                }`}
                />
                {errors.lineID && (
                <p className="mt-1 text-sm text-red-600">{errors.lineID}</p>
                )}
            </div>

            {/* Customer ID */}
            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                Customer ID
                </label>
                <input
                type="text"
                name="customerID"
                value={formData.customerID}
                onChange={handleInputChange}
                placeholder="Enter Customer ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.customerID ? "border-red-300" : "border-secondary-300"
                }`}
                />
                {errors.customerID && (
                <p className="mt-1 text-sm text-red-600">{errors.customerID}</p>
                )}
            </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter address"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Enter company name"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Company ID */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Company ID
            </label>
            <input
              type="text"
              name="companyId"
              value={formData.companyId}
              onChange={handleInputChange}
              placeholder="Enter company ID"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Company Address */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Company Address
          </label>
          <textarea
            name="companyAddress"
            value={formData.companyAddress}
            onChange={handleInputChange}
            placeholder="Enter company address"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* How Nice */}
          <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                  How Nice (1-10)
              </label>
              <input
                  type="range"
                  name="howNice"
                  min="1"
                  max="10"
                  value={formData.howNice}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center mt-2 text-lg font-bold text-primary-600">
                  {formData.howNice}
              </div>
          </div>
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent border-secondary-300"
            >
              {CUSTOMER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 inline mr-2" />
            {loading
              ? "Saving..."
              : customer
              ? "Update Customer"
              : "Add Customer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
