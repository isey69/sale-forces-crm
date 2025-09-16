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
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION_NAME = "customers";

// Customer data structure:
// {
//   id: string,
//   type: 'CPA' | 'NonCPA',
//   cpaNumber?: string, // Only for CPA
//   title: string,
//   name: string,
//   surname: string,
//   email?: string,
//   phone?: string,
//   customFields: object,
//   relationships: array of customer IDs,
//   createdAt: timestamp,
//   updatedAt: timestamp
// }

export const customerService = {
  // Get all customers
  async getAllCustomers() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTION_NAME), orderBy("name"))
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  // Get customers by type
  async getCustomersByType(type) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("type", "==", type),
        orderBy("name")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching customers by type:", error);
      throw error;
    }
  },

  // Get single customer
  async getCustomer(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        throw new Error("Customer not found");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }
  },

  // Create new customer
  async createCustomer(customerData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...customerData,
        relationships: customerData.relationships || [],
        customFields: customerData.customFields || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        id: docRef.id,
        ...customerData,
      };
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  // Update customer
  async updateCustomer(id, updates) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });

      return await this.getCustomer(id);
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },

  // Delete customer
  async deleteCustomer(id) {
    try {
      // First, remove this customer from all relationships
      await this.removeFromAllRelationships(id);

      // Then delete the customer
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);

      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },

  // Add relationship between customers (bidirectional)
  async addRelationship(customerId1, customerId2) {
    try {
      const batch = writeBatch(db);

      const customer1Ref = doc(db, COLLECTION_NAME, customerId1);
      const customer2Ref = doc(db, COLLECTION_NAME, customerId2);

      batch.update(customer1Ref, {
        relationships: arrayUnion(customerId2),
        updatedAt: new Date(),
      });

      batch.update(customer2Ref, {
        relationships: arrayUnion(customerId1),
        updatedAt: new Date(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error adding relationship:", error);
      throw error;
    }
  },

  // Remove relationship between customers (bidirectional)
  async removeRelationship(customerId1, customerId2) {
    try {
      const batch = writeBatch(db);

      const customer1Ref = doc(db, COLLECTION_NAME, customerId1);
      const customer2Ref = doc(db, COLLECTION_NAME, customerId2);

      batch.update(customer1Ref, {
        relationships: arrayRemove(customerId2),
        updatedAt: new Date(),
      });

      batch.update(customer2Ref, {
        relationships: arrayRemove(customerId1),
        updatedAt: new Date(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error removing relationship:", error);
      throw error;
    }
  },

  // Remove customer from all relationships (used when deleting)
  async removeFromAllRelationships(customerId) {
    try {
      const customer = await this.getCustomer(customerId);

      if (customer.relationships && customer.relationships.length > 0) {
        const batch = writeBatch(db);

        for (const relatedId of customer.relationships) {
          const relatedRef = doc(db, COLLECTION_NAME, relatedId);
          batch.update(relatedRef, {
            relationships: arrayRemove(customerId),
            updatedAt: new Date(),
          });
        }

        await batch.commit();
      }

      return true;
    } catch (error) {
      console.error("Error removing from relationships:", error);
      throw error;
    }
  },

  // Check for duplicate customers
  async checkDuplicates(email, cpaNumber = null) {
    try {
      const duplicates = [];

      // Check by email if provided
      if (email) {
        const emailQuery = query(
          collection(db, COLLECTION_NAME),
          where("email", "==", email)
        );
        const emailSnapshot = await getDocs(emailQuery);
        duplicates.push(
          ...emailSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            duplicateReason: "email",
          }))
        );
      }

      // Check by CPA number if provided
      if (cpaNumber) {
        const cpaQuery = query(
          collection(db, COLLECTION_NAME),
          where("cpaNumber", "==", cpaNumber)
        );
        const cpaSnapshot = await getDocs(cpaQuery);
        duplicates.push(
          ...cpaSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            duplicateReason: "cpaNumber",
          }))
        );
      }

      // Remove duplicates based on ID
      const uniqueDuplicates = duplicates.filter(
        (customer, index, self) =>
          index === self.findIndex((c) => c.id === customer.id)
      );

      return uniqueDuplicates;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      throw error;
    }
  },

  // Bulk import customers with duplicate checking
  async bulkImportCustomers(customers) {
    try {
      const results = {
        imported: [],
        duplicates: [],
        errors: [],
      };

      for (const customerData of customers) {
        try {
          // Check for duplicates
          const duplicates = await this.checkDuplicates(
            customerData.email,
            customerData.cpaNumber
          );

          if (duplicates.length > 0) {
            results.duplicates.push({
              data: customerData,
              existingCustomers: duplicates,
            });
          } else {
            // Import customer
            const imported = await this.createCustomer(customerData);
            results.imported.push(imported);
          }
        } catch (error) {
          results.errors.push({
            data: customerData,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error in bulk import:", error);
      throw error;
    }
  },
};

export default customerService;
