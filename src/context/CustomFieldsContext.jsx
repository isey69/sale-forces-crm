import React, { createContext, useContext, useState, useEffect } from "react";
import customFieldService from "../services/customFieldService";

const CustomFieldsContext = createContext({});

export const useCustomFields = () => {
  const context = useContext(CustomFieldsContext);
  if (!context) {
    throw new Error(
      "useCustomFields must be used within a CustomFieldsProvider"
    );
  }
  return context;
};

export const CustomFieldsProvider = ({ children }) => {
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load custom fields
  const loadCustomFields = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFields = await customFieldService.getAllCustomFields();
      setCustomFields(fetchedFields);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get active custom fields
  const getActiveCustomFields = () => {
    return customFields.filter((field) => field.isActive);
  };

  // Get custom fields for specific customer type
  const getCustomFieldsForType = (customerType) => {
    return getActiveCustomFields().filter(
      (field) =>
        field.appliesTo.includes(customerType) ||
        field.appliesTo.includes("both")
    );
  };

  // Create custom field
  const createCustomField = async (fieldData) => {
    try {
      setError(null);

      // Validate field data
      const validationErrors = customFieldService.validateFieldData(fieldData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // Check name uniqueness
      const isUnique = await customFieldService.isFieldNameUnique(
        fieldData.name
      );
      if (!isUnique) {
        throw new Error("Field name already exists");
      }

      const newField = await customFieldService.createCustomField(fieldData);
      setCustomFields((prev) => [...prev, newField]);
      return newField;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update custom field
  const updateCustomField = async (id, updates) => {
    try {
      setError(null);

      // Validate field data if name is being updated
      if (updates.name) {
        const isUnique = await customFieldService.isFieldNameUnique(
          updates.name,
          id
        );
        if (!isUnique) {
          throw new Error("Field name already exists");
        }
      }

      const updatedField = await customFieldService.updateCustomField(
        id,
        updates
      );
      setCustomFields((prev) =>
        prev.map((field) => (field.id === id ? updatedField : field))
      );
      return updatedField;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete custom field
  const deleteCustomField = async (id) => {
    try {
      setError(null);
      await customFieldService.deleteCustomField(id);
      setCustomFields((prev) => prev.filter((field) => field.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reorder custom fields
  const reorderCustomFields = async (fieldIds) => {
    try {
      setError(null);
      await customFieldService.reorderCustomFields(fieldIds);

      // Update local state with new order
      const reorderedFields = fieldIds.map((id, index) => {
        const field = customFields.find((f) => f.id === id);
        return { ...field, order: index + 1 };
      });

      setCustomFields(reorderedFields);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Toggle field active status
  const toggleFieldStatus = async (id, isActive) => {
    try {
      setError(null);
      const updatedField = await customFieldService.toggleFieldStatus(
        id,
        isActive
      );
      setCustomFields((prev) =>
        prev.map((field) => (field.id === id ? updatedField : field))
      );
      return updatedField;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Validate custom field value
  const validateFieldValue = (field, value) => {
    const errors = [];

    // Required field validation
    if (field.required && (!value || value.toString().trim() === "")) {
      errors.push(`${field.label} is required`);
      return errors;
    }

    // Skip validation if field is not required and value is empty
    if (!value || value.toString().trim() === "") {
      return errors;
    }

    // Type-specific validation
    switch (field.type) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.label} must be a valid email address`);
        }
        break;

      case "phone":
        const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
        if (!phoneRegex.test(value)) {
          errors.push(`${field.label} must be a valid phone number`);
        }
        break;

      case "number":
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`${field.label} must be a valid number`);
        } else {
          if (
            field.validation?.min !== undefined &&
            numValue < field.validation.min
          ) {
            errors.push(
              `${field.label} must be at least ${field.validation.min}`
            );
          }
          if (
            field.validation?.max !== undefined &&
            numValue > field.validation.max
          ) {
            errors.push(
              `${field.label} must be at most ${field.validation.max}`
            );
          }
        }
        break;

      case "text":
      case "textarea":
        if (field.validation?.min && value.length < field.validation.min) {
          errors.push(
            `${field.label} must be at least ${field.validation.min} characters`
          );
        }
        if (field.validation?.max && value.length > field.validation.max) {
          errors.push(
            `${field.label} must be at most ${field.validation.max} characters`
          );
        }
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors.push(
              field.validation.message || `${field.label} format is invalid`
            );
          }
        }
        break;

      case "select":
        if (field.options && !field.options.includes(value)) {
          errors.push(`${field.label} must be one of the predefined options`);
        }
        break;

      case "date":
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(`${field.label} must be a valid date`);
        }
        break;

      default:
        // No validation for unknown field types
        break;
    }

    return errors;
  };

  // Validate all custom field values for a customer
  const validateCustomFieldValues = (customerType, customFieldValues) => {
    const fieldsForType = getCustomFieldsForType(customerType);
    const allErrors = {};

    fieldsForType.forEach((field) => {
      const value = customFieldValues[field.name];
      const fieldErrors = validateFieldValue(field, value);
      if (fieldErrors.length > 0) {
        allErrors[field.name] = fieldErrors;
      }
    });

    return allErrors;
  };

  // Get field usage statistics
  const getFieldUsageStats = async () => {
    try {
      return await customFieldService.getFieldUsageStats();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Generate form schema for customer type
  const generateFormSchema = (customerType) => {
    const fieldsForType = getCustomFieldsForType(customerType);
    return fieldsForType.map((field) => ({
      ...field,
      validation: {
        required: field.required,
        ...field.validation,
      },
    }));
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Load data on mount
  useEffect(() => {
    loadCustomFields();
  }, []);

  const value = {
    customFields,
    activeCustomFields: getActiveCustomFields(),
    loading,
    error,
    loadCustomFields,
    createCustomField,
    updateCustomField,
    deleteCustomField,
    reorderCustomFields,
    toggleFieldStatus,
    getCustomFieldsForType,
    validateFieldValue,
    validateCustomFieldValues,
    getFieldUsageStats,
    generateFormSchema,
    clearError,
  };

  return (
    <CustomFieldsContext.Provider value={value}>
      {children}
    </CustomFieldsContext.Provider>
  );
};
