import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "./firebase";

const CUSTOMERS_COLLECTION = "customers";
const RELATIONSHIPS_COLLECTION = "customer_relationships";
const PAGE_SIZE = 20;

// Customer CRUD Operations
export const customerService = {
  // Get all customers with pagination and filtering
  async getAllCustomers(filters = {}) {
    const { status, lastVisible } = filters;
    try {
      const customersRef = collection(db, CUSTOMERS_COLLECTION);
      const queryConstraints = [orderBy("createdAt", "desc")];

      if (status && status !== "all") {
        queryConstraints.push(where("status", "==", status));
      }

      if (lastVisible) {
        queryConstraints.push(startAfter(lastVisible));
      }

      queryConstraints.push(limit(PAGE_SIZE));

      const q = query(customersRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);

      const customers = [];
      querySnapshot.forEach((doc) => {
        customers.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          lastActivity:
            doc.data().lastActivity?.toDate?.() || doc.data().lastActivity,
        });
      });

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      return { customers, lastVisible: lastDoc };
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },


  // Get customer by ID
  async getCustomerById(customerId) {
    try {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      const customerDoc = await getDoc(customerRef);

      if (!customerDoc.exists()) {
        throw new Error("Customer not found");
      }

      const customerData = customerDoc.data();
      return {
        id: customerDoc.id,
        ...customerData,
        createdAt: customerData.createdAt?.toDate?.() || customerData.createdAt,
        lastActivity:
          customerData.lastActivity?.toDate?.() || customerData.lastActivity,
      };
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }
  },

  // Add new customer
  async addCustomer(customerData) {
    try {
      const customersRef = collection(db, CUSTOMERS_COLLECTION);
      const newCustomer = {
        ...customerData,
        name_lowercase: customerData.name.toLowerCase(),
        createdAt: new Date(),
        lastActivity: new Date(),
        relationships: [],
        customFields: customerData.customFields || {},
      };

      if (customerData.cpaNumber) {
        newCustomer.cpaNumber_lowercase = customerData.cpaNumber.toLowerCase();
      }

      const docRef = await addDoc(customersRef, newCustomer);
      return { id: docRef.id, ...newCustomer };
    } catch (error) {
      console.error("Error adding customer:", error);
      throw error;
    }
  },

  // Update customer
  async updateCustomer(customerId, updates) {
    try {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      const updateData = {
        ...updates,
        lastActivity: new Date(),
      };

      if (updates.name) {
        updateData.name_lowercase = updates.name.toLowerCase();
      }
      if (updates.cpaNumber) {
        updateData.cpaNumber_lowercase = updates.cpaNumber.toLowerCase();
      }

      await updateDoc(customerRef, updateData);
      return { id: customerId, ...updateData };
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },

  // Delete customer
  async deleteCustomer(customerId) {
    try {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      await deleteDoc(customerRef);

      // Also remove all relationships
      await this.removeAllCustomerRelationships(customerId);

      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },

  // Get customers by type
  async getCustomersByType(type) {
    try {
      const customersRef = collection(db, CUSTOMERS_COLLECTION);
      const q = query(
        customersRef,
        where("type", "==", type),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const customers = [];
      querySnapshot.forEach((doc) => {
        customers.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return customers;
    } catch (error) {
      console.error("Error fetching customers by type:", error);
      throw error;
    }
  },

  // Search customers by name or CPA number
  async searchCustomers(searchTerm) {
    if (!searchTerm) return [];
    const searchLower = searchTerm.toLowerCase();

    const customersRef = collection(db, CUSTOMERS_COLLECTION);

    // Query for name
    const nameQuery = query(
      customersRef,
      where("name_lowercase", ">=", searchLower),
      where("name_lowercase", "<=", searchLower + "\uf8ff")
    );

    // Query for CPA number
    const cpaQuery = query(
      customersRef,
      where("cpaNumber_lowercase", ">=", searchLower),
      where("cpaNumber_lowercase", "<=", searchLower + "\uf8ff")
    );

    try {
      const [nameSnapshot, cpaSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(cpaQuery),
      ]);

      const customersMap = new Map();

      const processSnapshot = (snapshot) => {
        snapshot.forEach((doc) => {
          if (!customersMap.has(doc.id)) {
            customersMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      };

      processSnapshot(nameSnapshot);
      processSnapshot(cpaSnapshot);

      return Array.from(customersMap.values());
    } catch (error) {
      console.error("Error searching customers:", error);
      // It's likely the composite index is missing. Log a helpful message.
      if (error.code === "failed-precondition") {
        console.error(
          "Firestore index not found. Please create a composite index on 'customers' collection for 'name_lowercase' ascending and 'cpaNumber_lowercase' ascending."
        );
      }
      throw error;
    }
  },

  // Customer Relationships
  async getCustomerRelationships(customerId) {
    try {
      const relationshipsRef = collection(db, RELATIONSHIPS_COLLECTION);
      const q = query(relationshipsRef, where("customerId", "==", customerId));
      const querySnapshot = await getDocs(q);

      const relationships = [];
      for (const relationDoc of querySnapshot.docs) {
        const relationData = relationDoc.data();
        const relatedCustomer = await this.getCustomerById(
          relationData.relatedCustomerId
        );
        relationships.push({
          id: relationDoc.id,
          ...relatedCustomer,
        });
      }

      return relationships;
    } catch (error) {
      console.error("Error fetching customer relationships:", error);
      throw error;
    }
  },

  // Add customer relationship (bidirectional)
  async addCustomerRelationship(customerId, relatedCustomerId) {
    try {
      const batch = writeBatch(db);
      const relationshipsRef = collection(db, RELATIONSHIPS_COLLECTION);

      // Add relationship: customerId -> relatedCustomerId
      const relationRef1 = doc(relationshipsRef);
      batch.set(relationRef1, {
        customerId: customerId,
        relatedCustomerId: relatedCustomerId,
        createdAt: new Date(),
      });

      // Add reverse relationship: relatedCustomerId -> customerId
      const relationRef2 = doc(relationshipsRef);
      batch.set(relationRef2, {
        customerId: relatedCustomerId,
        relatedCustomerId: customerId,
        createdAt: new Date(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error adding customer relationship:", error);
      throw error;
    }
  },

  // Remove customer relationship (bidirectional)
  async removeCustomerRelationship(customerId, relatedCustomerId) {
    try {
      const batch = writeBatch(db);
      const relationshipsRef = collection(db, RELATIONSHIPS_COLLECTION);

      // Find and remove both directions of the relationship
      const q1 = query(
        relationshipsRef,
        where("customerId", "==", customerId),
        where("relatedCustomerId", "==", relatedCustomerId)
      );
      const q2 = query(
        relationshipsRef,
        where("customerId", "==", relatedCustomerId),
        where("relatedCustomerId", "==", customerId)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      snapshot1.forEach((doc) => {
        batch.delete(doc.ref);
      });

      snapshot2.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error removing customer relationship:", error);
      throw error;
    }
  },

  // Remove all relationships for a customer
  async removeAllCustomerRelationships(customerId) {
    try {
      const relationshipsRef = collection(db, RELATIONSHIPS_COLLECTION);
      const q1 = query(relationshipsRef, where("customerId", "==", customerId));
      const q2 = query(
        relationshipsRef,
        where("relatedCustomerId", "==", customerId)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      const batch = writeBatch(db);

      snapshot1.forEach((doc) => {
        batch.delete(doc.ref);
      });

      snapshot2.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error removing all customer relationships:", error);
      throw error;
    }
  },

  // Update custom fields
  async updateCustomFields(customerId, customFields) {
    try {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      await updateDoc(customerRef, {
        customFields: customFields,
        lastActivity: new Date(),
      });
      return true;
    } catch (error) {
      console.error("Error updating custom fields:", error);
      throw error;
    }
  },

  // CSV Import helper
  async importCustomersFromCSV(customersData) {
    if (!customersData || customersData.length === 0) {
      return { imported: [], duplicates: [], errors: [] };
    }

    try {
      const customersRef = collection(db, CUSTOMERS_COLLECTION);

      // 1. Get all emails and cpaNumbers from the import data
      const emailsToCkeck = customersData
        .map((c) => c.email)
        .filter(Boolean);
      const cpaNumbersToCheck = customersData
        .map((c) => c.cpaNumber)
        .filter(Boolean);

      // 2. Batch query for existing customers
      const existingEmails = new Set();
      const existingCpaNumbers = new Set();

      const queryBy = async (field, values) => {
        if (values.length === 0) return;
        // Firestore 'in' query supports up to 10 elements
        for (let i = 0; i < values.length; i += 10) {
          const chunk = values.slice(i, i + 10);
          const q = query(customersRef, where(field, "in", chunk));
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            if (field === "email") existingEmails.add(doc.data().email);
            if (field === "cpaNumber")
              existingCpaNumbers.add(doc.data().cpaNumber);
          });
        }
      };

      await Promise.all([
        queryBy("email", emailsToCkeck),
        queryBy("cpaNumber", cpaNumbersToCheck),
      ]);

      // 3. Process and batch write
      const batch = writeBatch(db);
      const results = { imported: [], duplicates: [], errors: [] };

      customersData.forEach((customerData) => {
        const isDuplicate =
          (customerData.email && existingEmails.has(customerData.email)) ||
          (customerData.cpaNumber &&
            existingCpaNumbers.has(customerData.cpaNumber));

        if (isDuplicate) {
          results.duplicates.push({ data: customerData });
          return;
        }

        const newCustomerRef = doc(customersRef);
        const newCustomer = {
          ...customerData,
          name_lowercase: customerData.name.toLowerCase(),
          createdAt: new Date(),
          lastActivity: new Date(),
          relationships: [],
          customFields: {},
        };
        batch.set(newCustomerRef, newCustomer);
        results.imported.push({ data: customerData, id: newCustomerRef.id });
      });

      await batch.commit();
      return results;
    } catch (error) {
      console.error("Error importing customers:", error);
      throw error;
    }
  },

  // Assign a label to a customer
  async assignLabelToCustomer(customerId, labelId) {
    try {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      const customerDoc = await getDoc(customerRef);
      if (!customerDoc.exists()) {
        throw new Error("Customer not found");
      }
      const customerData = customerDoc.data();
      const labels = customerData.labels || [];
      if (!labels.includes(labelId)) {
        await updateDoc(customerRef, {
          labels: [...labels, labelId],
        });
      }
      return true;
    } catch (error) {
      console.error("Error assigning label to customer:", error);
      throw error;
    }
  },

  // De-assign a label from a customer
  async deassignLabelFromCustomer(customerId, labelId) {
    try {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      const customerDoc = await getDoc(customerRef);
      if (!customerDoc.exists()) {
        throw new Error("Customer not found");
      }
      const customerData = customerDoc.data();
      const labels = customerData.labels || [];
      if (labels.includes(labelId)) {
        await updateDoc(customerRef, {
          labels: labels.filter((id) => id !== labelId),
        });
      }
      return true;
    } catch (error) {
      console.error("Error de-assigning label from customer:", error);
      throw error;
    }
  },
};
