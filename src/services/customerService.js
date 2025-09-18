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
} from "firebase/firestore";
import { db } from "./firebase";

const CUSTOMERS_COLLECTION = "customers";
const RELATIONSHIPS_COLLECTION = "customer_relationships";

// Customer CRUD Operations
export const customerService = {
  // Get all customers
  async getAllCustomers() {
    try {
      const customersRef = collection(db, CUSTOMERS_COLLECTION);
      const q = query(customersRef, orderBy("createdAt", "desc"));
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

      return customers;
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  // More efficient search for relationship adding
  async searchCustomersByName(name) {
    if (!name) return [];
    try {
      const customersRef = collection(db, CUSTOMERS_COLLECTION);
      const searchLower = name.toLowerCase();
      const q = query(
        customersRef,
        where('name_lowercase', '>=', searchLower),
        where('name_lowercase', '<=', searchLower + '\uf8ff'),
        orderBy('name_lowercase'),
      );

      const querySnapshot = await getDocs(q);
      const customers = [];
      querySnapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() });
      });
      return customers;
    } catch (error) {
      console.error("Error searching customers by name:", error);
      // It's likely the composite index is missing. Log a helpful message.
      if (error.code === 'failed-precondition') {
        console.error(
          "Firestore index not found. Please create a composite index on 'customers' collection for 'name_lowercase' ascending."
        );
      }
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

  // Search customers
  async searchCustomers(searchTerm) {
    try {
      const customers = await this.getAllCustomers();

      const filtered = customers.filter((customer) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          customer.name?.toLowerCase().includes(searchLower) ||
          customer.surname?.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          customer.cpaNumber?.toLowerCase().includes(searchLower) ||
          `${customer.name} ${customer.surname}`
            .toLowerCase()
            .includes(searchLower)
        );
      });

      return filtered;
    } catch (error) {
      console.error("Error searching customers:", error);
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
    try {
      const batch = writeBatch(db);
      const customersRef = collection(db, CUSTOMERS_COLLECTION);
      const results = [];

      for (const customerData of customersData) {
        // Check for duplicates (by email or cpaNumber)
        const existing = await this.findDuplicateCustomer(customerData);
        if (existing) {
          results.push({
            status: "skipped",
            data: customerData,
            reason: "Duplicate found",
          });
          continue;
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
        results.push({
          status: "imported",
          data: customerData,
          id: newCustomerRef.id,
        });
      }

      await batch.commit();
      return results;
    } catch (error) {
      console.error("Error importing customers:", error);
      throw error;
    }
  },

  // Find duplicate customer
  async findDuplicateCustomer(customerData) {
    try {
      const customersRef = collection(db, CUSTOMERS_COLLECTION);
      let q;

      if (customerData.email) {
        q = query(customersRef, where("email", "==", customerData.email));
        const emailSnapshot = await getDocs(q);
        if (!emailSnapshot.empty) {
          return emailSnapshot.docs[0].data();
        }
      }

      if (customerData.cpaNumber) {
        q = query(
          customersRef,
          where("cpaNumber", "==", customerData.cpaNumber)
        );
        const cpaSnapshot = await getDocs(q);
        if (!cpaSnapshot.empty) {
          return cpaSnapshot.docs[0].data();
        }
      }

      return null;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
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
