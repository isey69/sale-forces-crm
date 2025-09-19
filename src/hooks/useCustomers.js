import { useState, useEffect } from "react";
import { customerService } from "../services/customerService";
import toast from "react-hot-toast";

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Load initial customers
  const loadCustomers = async (filter) => {
    try {
      setLoading(true);
      setError(null);
      const { customers: newCustomers, lastVisible: newLastVisible } =
        await customerService.getAllCustomers({ status: filter });
      setCustomers(newCustomers);
      setLastVisible(newLastVisible);
      setHasMore(newCustomers.length > 0);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Load more customers
  const loadMoreCustomers = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const { customers: newCustomers, lastVisible: newLastVisible } =
        await customerService.getAllCustomers({
          status: statusFilter,
          lastVisible,
        });

      setCustomers((prev) => [...prev, ...newCustomers]);
      setLastVisible(newLastVisible);
      setHasMore(newCustomers.length > 0);
    } catch (err) {
      toast.error("Failed to load more customers");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStatusFilterChange = (newStatus) => {
    setCustomers([]);
    setLastVisible(null);
    setHasMore(true);
    setStatusFilter(newStatus);
    loadCustomers(newStatus);
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
      if (searchTerm.trim() === "") {
        loadCustomers(statusFilter);
        setHasMore(true);
      } else {
        const searchResults = await customerService.searchCustomers(searchTerm);
        setCustomers(searchResults);
        setHasMore(false); // No pagination on search results
      }
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
      // This is a simple implementation. For large datasets,
      // server-side filtering with pagination would be better.
      if (type === "all") {
        await loadCustomers(); // Reloads with pagination
      } else {
        const filteredCustomers = await customerService.getCustomersByType(
          type
        );
        setCustomers(filteredCustomers);
        setHasMore(false); // Assume filtering shows all results
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
    loadCustomers(statusFilter);
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
    loadMoreCustomers,
    hasMore,
    loadingMore,
    statusFilter,
    handleStatusFilterChange,
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
