import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const CUSTOM_FIELDS_COLLECTION = "customFields";

// Custom Field data structure:
// {
//   id: string,
//   name: string,
//   label: string,
//   type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'checkbox',
//   appliesTo: ['CPA', 'NonCPA'] or ['CPA'] or ['NonCPA'],
//   required: boolean,
//   options?: array (for select type),
//   defaultValue?: any,
//   placeholder?: string,
//   helpText?: string,
//   validation?: {
//     min?: number,
//     max?: number,
//     pattern?: string,
//     message?: string
//   },
//   order: number,
//   isActive: boolean,
//   createdAt: timestamp,
//   updatedAt: timestamp
// }

export const customFieldService = {
  // Get all custom fields
  async getAllCustomFields() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, CUSTOM_FIELDS_COLLECTION), orderBy("order"))
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      throw error;
    }
  },

  // Get active custom fields
  async getActiveCustomFields() {
    try {
      const q = query(
        collection(db, CUSTOM_FIELDS_COLLECTION),
        where("isActive", "==", true),
        orderBy("order")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching active custom fields:", error);
      throw error;
    }
  },

  // Get custom fields for specific customer type
  async getCustomFieldsForType(customerType) {
    try {
      const fields = await this.getActiveCustomFields();
      return fields.filter(
        (field) =>
          field.appliesTo.includes(customerType) ||
          field.appliesTo.includes("both")
      );
    } catch (error) {
      console.error("Error fetching custom fields for type:", error);
      throw error;
    }
  },

  // Get single custom field
  async getCustomField(id) {
    try {
      const docRef = doc(db, CUSTOM_FIELDS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        throw new Error("Custom field not found");
      }
    } catch (error) {
      console.error("Error fetching custom field:", error);
      throw error;
    }
  },

  // Create new custom field
  async createCustomField(fieldData) {
    try {
      // Get the highest order number and increment
      const fields = await this.getAllCustomFields();
      const maxOrder =
        fields.length > 0 ? Math.max(...fields.map((f) => f.order || 0)) : 0;

      const docRef = await addDoc(collection(db, CUSTOM_FIELDS_COLLECTION), {
        ...fieldData,
        order: maxOrder + 1,
        isActive: fieldData.isActive !== undefined ? fieldData.isActive : true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        id: docRef.id,
        ...fieldData,
        order: maxOrder + 1,
      };
    } catch (error) {
      console.error("Error creating custom field:", error);
      throw error;
    }
  },

  // Update custom field
  async updateCustomField(id, updates) {
    try {
      const docRef = doc(db, CUSTOM_FIELDS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      return await this.getCustomField(id);
    } catch (error) {
      console.error("Error updating custom field:", error);
      throw error;
    }
  },

  // Delete custom field
  async deleteCustomField(id) {
    try {
      const docRef = doc(db, CUSTOM_FIELDS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting custom field:", error);
      throw error;
    }
  },

  // Reorder custom fields
  async reorderCustomFields(fieldIds) {
    try {
      const updatePromises = fieldIds.map((fieldId, index) => {
        const docRef = doc(db, CUSTOM_FIELDS_COLLECTION, fieldId);
        return updateDoc(docRef, {
          order: index + 1,
          updatedAt: Timestamp.now(),
        });
      });

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error("Error reordering custom fields:", error);
      throw error;
    }
  },

  // Toggle field active status
  async toggleFieldStatus(id, isActive) {
    try {
      return await this.updateCustomField(id, { isActive });
    } catch (error) {
      console.error("Error toggling field status:", error);
      throw error;
    }
  },

  // Validate custom field data
  validateFieldData(fieldData) {
    const errors = [];

    if (!fieldData.name?.trim()) {
      errors.push("Field name is required");
    }

    if (!fieldData.label?.trim()) {
      errors.push("Field label is required");
    }

    if (!fieldData.type) {
      errors.push("Field type is required");
    }

    if (!fieldData.appliesTo || fieldData.appliesTo.length === 0) {
      errors.push("Field must apply to at least one customer type");
    }

    // Validate select options
    if (fieldData.type === "select") {
      if (!fieldData.options || fieldData.options.length === 0) {
        errors.push("Select fields must have at least one option");
      }
    }

    // Validate name uniqueness (this would need to be checked against existing fields)
    const validNamePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (fieldData.name && !validNamePattern.test(fieldData.name)) {
      errors.push(
        "Field name must start with a letter and contain only letters, numbers, and underscores"
      );
    }

    return errors;
  },

  // Check if field name is unique
  async isFieldNameUnique(name, excludeId = null) {
    try {
      const fields = await this.getAllCustomFields();
      return !fields.some(
        (field) =>
          field.name.toLowerCase() === name.toLowerCase() &&
          field.id !== excludeId
      );
    } catch (error) {
      console.error("Error checking field name uniqueness:", error);
      throw error;
    }
  },

  // Get field usage statistics
  async getFieldUsageStats() {
    try {
      const fields = await this.getAllCustomFields();

      // This would require querying all customers to see which fields are used
      // For now, return basic stats
      return {
        total: fields.length,
        active: fields.filter((f) => f.isActive).length,
        inactive: fields.filter((f) => !f.isActive).length,
        byType: fields.reduce((acc, field) => {
          acc[field.type] = (acc[field.type] || 0) + 1;
          return acc;
        }, {}),
        byAppliesTo: {
          cpaOnly: fields.filter(
            (f) => f.appliesTo.length === 1 && f.appliesTo.includes("CPA")
          ).length,
          nonCpaOnly: fields.filter(
            (f) => f.appliesTo.length === 1 && f.appliesTo.includes("NonCPA")
          ).length,
          both: fields.filter(
            (f) => f.appliesTo.length === 2 || f.appliesTo.includes("both")
          ).length,
        },
      };
    } catch (error) {
      console.error("Error fetching field usage stats:", error);
      throw error;
    }
  },
};

// Default field types configuration
export const fieldTypes = [
  {
    value: "text",
    label: "Text",
    description: "Single line text input",
    icon: "📝",
  },
  {
    value: "textarea",
    label: "Long Text",
    description: "Multi-line text area",
    icon: "📄",
  },
  {
    value: "number",
    label: "Number",
    description: "Numeric input",
    icon: "🔢",
  },
  {
    value: "email",
    label: "Email",
    description: "Email address input",
    icon: "📧",
  },
  {
    value: "phone",
    label: "Phone",
    description: "Phone number input",
    icon: "📞",
  },
  {
    value: "date",
    label: "Date",
    description: "Date picker",
    icon: "📅",
  },
  {
    value: "select",
    label: "Dropdown",
    description: "Select from predefined options",
    icon: "📋",
  },
  {
    value: "checkbox",
    label: "Checkbox",
    description: "True/false checkbox",
    icon: "☑️",
  },
];

export default customFieldService;
