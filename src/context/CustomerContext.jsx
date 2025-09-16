import React, { createContext, useContext, useState, useEffect } from "react";
import customerService from "../services/customerService";

const CustomerContext = createContext({});

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomers must be used within a CustomerProvider");
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: "all", // 'all', 'CPA', 'NonCPA'
    search: "",
    sortBy: "name", // 'name', 'createdAt', 'updatedAt'
  });

  // Load all customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCustomers = await customerService.getAllCustomers();
      setCustomers(fetchedCustomers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered customers
  const getFilteredCustomers = () => {
    let filtered = [...customers];

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter((customer) => customer.type === filters.type);
    }

    // Filter by search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.surname.toLowerCase().includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm) ||
          customer.cpaNumber?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return `${a.name} ${a.surname}`.localeCompare(
            `${b.name} ${b.surname}`
          );
        case "createdAt":
          return (
            new Date(b.createdAt?.toDate?.() || b.createdAt) -
            new Date(a.createdAt?.toDate?.() || a.createdAt)
          );
        case "updatedAt":
          return (
            new Date(b.updatedAt?.toDate?.() || b.updatedAt) -
            new Date(a.updatedAt?.toDate?.() || a.updatedAt)
          );
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Create customer
  const createCustomer = async (customerData) => {
    try {
      setError(null);
      const newCustomer = await customerService.createCustomer(customerData);
      setCustomers((prev) => [...prev, newCustomer]);
      return newCustomer;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update customer
  const updateCustomer = async (id, updates) => {
    try {
      setError(null);
      const updatedCustomer = await customerService.updateCustomer(id, updates);
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id ? updatedCustomer : customer
        )
      );
      return updatedCustomer;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete customer
  const deleteCustomer = async (id) => {
    try {
      setError(null);
      await customerService.deleteCustomer(id);
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Add relationship
  const addRelationship = async (customerId1, customerId2) => {
    try {
      setError(null);
      await customerService.addRelationship(customerId1, customerId2);

      // Update local state
      setCustomers((prev) =>
        prev.map((customer) => {
          if (customer.id === customerId1) {
            return {
              ...customer,
              relationships: [...(customer.relationships || []), customerId2],
            };
          }
          if (customer.id === customerId2) {
            return {
              ...customer,
              relationships: [...(customer.relationships || []), customerId1],
            };
          }
          return customer;
        })
      );

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Remove relationship
  const removeRelationship = async (customerId1, customerId2) => {
    try {
      setError(null);
      await customerService.removeRelationship(customerId1, customerId2);

      // Update local state
      setCustomers((prev) =>
        prev.map((customer) => {
          if (customer.id === customerId1) {
            return {
              ...customer,
              relationships: (customer.relationships || []).filter(
                (id) => id !== customerId2
              ),
            };
          }
          if (customer.id === customerId2) {
            return {
              ...customer,
              relationships: (customer.relationships || []).filter(
                (id) => id !== customerId1
              ),
            };
          }
          return customer;
        })
      );

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get related customers for a specific customer
  const getRelatedCustomers = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer || !customer.relationships) return [];

    return customers.filter((c) => customer.relationships.includes(c.id));
  };

  // Import customers from CSV
  const importCustomers = async (customersData) => {
    try {
      setError(null);
      setLoading(true);
      const results = await customerService.bulkImportCustomers(customersData);

      // Add successfully imported customers to state
      if (results.imported.length > 0) {
        setCustomers((prev) => [...prev, ...results.imported]);
      }

      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const value = {
    customers,
    filteredCustomers: getFilteredCustomers(),
    loading,
    error,
    filters,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addRelationship,
    removeRelationship,
    getRelatedCustomers,
    importCustomers,
    updateFilters,
    clearError,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};
