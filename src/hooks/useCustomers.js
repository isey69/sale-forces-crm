import { useState, useEffect } from "react";
import { customerService } from "../services/customerService";
import toast from "react-hot-toast";

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Add customer
  const addCustomer = async (customerData) => {
    try {
      const newCustomer = await customerService.addCustomer(customerData);
      setCustomers((prev) => [newCustomer, ...prev]);
      toast.success("Customer added successfully");
      return newCustomer;
    } catch (err) {
      toast.error("Failed to add customer");
      throw err;
    }
  };

  // Update customer
  const updateCustomer = async (customerId, updates) => {
    try {
      const updatedCustomer = await customerService.updateCustomer(
        customerId,
        updates
      );
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId
            ? { ...customer, ...updatedCustomer }
            : customer
        )
      );
      toast.success("Customer updated successfully");
      return updatedCustomer;
    } catch (err) {
      toast.error("Failed to update customer");
      throw err;
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId) => {
    try {
      await customerService.deleteCustomer(customerId);
      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== customerId)
      );
      toast.success("Customer deleted successfully");
    } catch (err) {
      toast.error("Failed to delete customer");
      throw err;
    }
  };

  // Search customers
  const searchCustomers = async (searchTerm) => {
    try {
      setLoading(true);
      const searchResults = await customerService.searchCustomers(searchTerm);
      setCustomers(searchResults);
    } catch (err) {
      toast.error("Failed to search customers");
    } finally {
      setLoading(false);
    }
  };

  // Filter customers by type
  const filterCustomersByType = async (type) => {
    try {
      setLoading(true);
      if (type === "all") {
        await loadCustomers();
      } else {
        const filteredCustomers = await customerService.getCustomersByType(
          type
        );
        setCustomers(filteredCustomers);
      }
    } catch (err) {
      toast.error("Failed to filter customers");
    } finally {
      setLoading(false);
    }
  };

  // Import customers from CSV
  const importCustomersFromCSV = async (customersData) => {
    try {
      const results = await customerService.importCustomersFromCSV(
        customersData
      );

      const imported = results.filter((r) => r.status === "imported").length;
      const skipped = results.filter((r) => r.status === "skipped").length;

      if (imported > 0) {
        toast.success(
          `${imported} customers imported successfully${
            skipped > 0 ? `, ${skipped} skipped` : ""
          }`
        );
        await loadCustomers(); // Reload to show new customers
      } else {
        toast.error("No customers were imported");
      }

      return results;
    } catch (err) {
      toast.error("Failed to import customers");
      throw err;
    }
  };

  // Initial load
  useEffect(() => {
    loadCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    loadCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    filterCustomersByType,
    importCustomersFromCSV,
  };
};

export const useCustomer = (customerId) => {
  const [customer, setCustomer] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load customer data
  const loadCustomer = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      setError(null);

      const [customerData, relationshipsData] = await Promise.all([
        customerService.getCustomerById(customerId),
        customerService.getCustomerRelationships(customerId),
      ]);

      setCustomer(customerData);
      setRelationships(relationshipsData);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  // Update customer
  const updateCustomer = async (updates) => {
    try {
      const updatedCustomer = await customerService.updateCustomer(
        customerId,
        updates
      );
      setCustomer((prev) => ({ ...prev, ...updatedCustomer }));
      toast.success("Customer updated successfully");
      return updatedCustomer;
    } catch (err) {
      toast.error("Failed to update customer");
      throw err;
    }
  };

  // Add relationship
  const addRelationship = async (relatedCustomerId) => {
    try {
      await customerService.addCustomerRelationship(
        customerId,
        relatedCustomerId
      );
      await loadCustomer(); // Reload to show new relationship
      toast.success("Relationship added successfully");
    } catch (err) {
      toast.error("Failed to add relationship");
      throw err;
    }
  };

  // Remove relationship
  const removeRelationship = async (relatedCustomerId) => {
    try {
      await customerService.removeCustomerRelationship(
        customerId,
        relatedCustomerId
      );
      setRelationships((prev) =>
        prev.filter((rel) => rel.id !== relatedCustomerId)
      );
      toast.success("Relationship removed successfully");
    } catch (err) {
      toast.error("Failed to remove relationship");
      throw err;
    }
  };

  // Update custom fields
  const updateCustomFields = async (customFields) => {
    try {
      await customerService.updateCustomFields(customerId, customFields);
      setCustomer((prev) => ({ ...prev, customFields }));
      toast.success("Custom fields updated successfully");
    } catch (err) {
      toast.error("Failed to update custom fields");
      throw err;
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const assignLabel = async (labelId) => {
    try {
      await customerService.assignLabelToCustomer(customerId, labelId);
      await loadCustomer(); // Reload to show new label
      toast.success("Label assigned successfully");
    } catch (err) {
      toast.error("Failed to assign label");
      throw err;
    }
  };

  const deassignLabel = async (labelId) => {
    try {
      await customerService.deassignLabelFromCustomer(customerId, labelId);
      await loadCustomer(); // Reload to show updated labels
      toast.success("Label de-assigned successfully");
    } catch (err) {
      toast.error("Failed to de-assign label");
      throw err;
    }
  };

  return {
    customer,
    relationships,
    loading,
    error,
    loadCustomer,
    updateCustomer,
    addRelationship,
    removeRelationship,
    updateCustomFields,
    assignLabel,
    deassignLabel,
  };
};
