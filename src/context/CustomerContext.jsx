import React, { createContext, useContext, useReducer, useEffect } from "react";
import { customerService } from "../services/customerService";
import toast from "react-hot-toast";

// Customer Context
const CustomerContext = createContext();

// Customer state reducer
const customerReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_CUSTOMERS":
      return {
        ...state,
        customers: action.payload,
        loading: false,
        error: null,
      };
    case "ADD_CUSTOMER":
      return { ...state, customers: [action.payload, ...state.customers] };
    case "UPDATE_CUSTOMER":
      return {
        ...state,
        customers: state.customers.map((customer) =>
          customer.id === action.payload.id
            ? { ...customer, ...action.payload }
            : customer
        ),
      };
    case "DELETE_CUSTOMER":
      return {
        ...state,
        customers: state.customers.filter(
          (customer) => customer.id !== action.payload
        ),
      };
    case "SET_FILTER":
      return { ...state, filter: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  customers: [],
  loading: true,
  error: null,
  filter: "all", // all, cpa, noncpa
  searchTerm: "",
};

// Customer Provider
export const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customerReducer, initialState);

  // Load all customers
  const loadCustomers = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      // Note: This context does not currently support pagination, so we just get the customers.
      const { customers } = await customerService.getAllCustomers();
      dispatch({ type: "SET_CUSTOMERS", payload: customers });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      toast.error("Failed to load customers");
    }
  };

  // Add customer
  const addCustomer = async (customerData) => {
    try {
      const newCustomer = await customerService.addCustomer(customerData);
      dispatch({ type: "ADD_CUSTOMER", payload: newCustomer });
      toast.success("Customer added successfully");
      return newCustomer;
    } catch (error) {
      toast.error("Failed to add customer");
      throw error;
    }
  };

  // Update customer
  const updateCustomer = async (customerId, updates) => {
    try {
      const updatedCustomer = await customerService.updateCustomer(
        customerId,
        updates
      );
      dispatch({
        type: "UPDATE_CUSTOMER",
        payload: { id: customerId, ...updatedCustomer },
      });
      toast.success("Customer updated successfully");
      return updatedCustomer;
    } catch (error) {
      toast.error("Failed to update customer");
      throw error;
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId) => {
    try {
      await customerService.deleteCustomer(customerId);
      dispatch({ type: "DELETE_CUSTOMER", payload: customerId });
      toast.success("Customer deleted successfully");
    } catch (error) {
      toast.error("Failed to delete customer");
      throw error;
    }
  };

  // Search customers
  const searchCustomers = async (searchTerm) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_SEARCH_TERM", payload: searchTerm });

      if (searchTerm.trim() === "") {
        await loadCustomers();
      } else {
        const searchResults = await customerService.searchCustomers(searchTerm);
        dispatch({ type: "SET_CUSTOMERS", payload: searchResults });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      toast.error("Failed to search customers");
    }
  };

  // Filter customers by type
  const filterCustomersByType = async (type) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_FILTER", payload: type });

      if (type === "all") {
        await loadCustomers();
      } else {
        const filteredCustomers = await customerService.getCustomersByType(
          type.toUpperCase()
        );
        dispatch({ type: "SET_CUSTOMERS", payload: filteredCustomers });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      toast.error("Failed to filter customers");
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
    } catch (error) {
      toast.error("Failed to import customers");
      throw error;
    }
  };

  // Get customer statistics
  const getCustomerStats = () => {
    const { customers } = state;
    return {
      total: customers.length,
      cpa: customers.filter((c) => c.type === "CPA").length,
      noncpa: customers.filter((c) => c.type === "NonCPA").length,
      withMeetings: customers.filter((c) => c.lastMeeting).length,
    };
  };

  // Initial load
  useEffect(() => {
    loadCustomers();
  }, []);

  const value = {
    ...state,
    loadCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    filterCustomersByType,
    importCustomersFromCSV,
    getCustomerStats,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

// Custom hook to use customer context
export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error(
      "useCustomerContext must be used within a CustomerProvider"
    );
  }
  return context;
};
