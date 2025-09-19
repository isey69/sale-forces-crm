import React, { useState, useCallback } from "react";
import { Plus, Upload, Download } from "lucide-react";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerForm from "../components/customers/CustomerForm";
import Modal from "../components/common/Modal";
import CSVImport from "../components/customers/CSVImport";
import { useCustomers } from "../hooks/useCustomers";
import { Toaster } from "react-hot-toast";

const Customers = () => {
  const {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    importCustomersFromCSV,
    loadMoreCustomers,
    hasMore,
    loadingMore,
    statusFilter,
    handleStatusFilterChange,
    searchCustomers,
    typeFilter,
    handleTypeFilterChange,
  } = useCustomers();

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setShowCustomerForm(true);
  }, []);

  const handleSaveCustomer = useCallback(async (customerData) => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, customerData);
      } else {
        await addCustomer(customerData);
      }
      setShowCustomerForm(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  }, [selectedCustomer, addCustomer, updateCustomer]);

  const handleImportCSV = () => {
    setShowImportModal(true);
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export functionality
    console.log("CSV Export clicked");
  };

  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-secondary-50 p-6">
        <div className="w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-xl p-6">
              <div className="h-6 bg-secondary-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-secondary-200 rounded"></div>
                <div className="h-4 bg-secondary-200 rounded"></div>
                <div className="h-4 bg-secondary-200 rounded"></div>
                <div className="h-4 bg-secondary-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 p-6">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                Customers
              </h1>
              <p className="mt-1 text-secondary-600">
                Manage your CPA and NonCPA customers
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>

              <button
                onClick={handleImportCSV}
                className="flex items-center gap-2 px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>

              <button
                onClick={handleAddCustomer}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Total Customers</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {customers.length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">CPA Customers</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {customers.filter((c) => c.type === "CPA").length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">NonCPA Customers</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {customers.filter((c) => c.type === "NonCPA").length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-secondary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {customers.filter((c) => c.lastMeeting).length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-success-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <CustomerTable
          customers={customers}
          onEditCustomer={handleEditCustomer}
          onLoadMore={loadMoreCustomers}
          hasMore={hasMore}
          isLoadingMore={loadingMore}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onSearch={searchCustomers}
          typeFilter={typeFilter}
          onTypeFilterChange={handleTypeFilterChange}
          loading={loading}
        />

        {/* Customer Form Modal */}
        {showCustomerForm && (
          <Modal
            isOpen={showCustomerForm}
            onClose={() => {
              setShowCustomerForm(false);
              setSelectedCustomer(null);
            }}
            title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
          >
            <CustomerForm
              customer={selectedCustomer}
              onSave={handleSaveCustomer}
              onCancel={() => {
                setShowCustomerForm(false);
                setSelectedCustomer(null);
              }}
            />
          </Modal>
        )}

        {/* CSV Import Modal */}
        <CSVImport
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            // The useCustomers hook will reload the customers, so we just close the modal
            setShowImportModal(false);
          }}
        />
      </div>
    </div>
  );
};

export default Customers;
