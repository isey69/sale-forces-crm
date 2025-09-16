import React, { useState, useRef } from "react";
import { useCustomerContext } from "../../context/CustomerContext";
import { parseCSV, downloadCSVTemplate } from "../../utils/csvParser";
import Button from "../common/Button";
import Modal from "../common/Modal";
import { Select } from "../common/Input";

const CSVImport = ({ isOpen, onClose, onSuccess }) => {
  const { importCustomers } = useCustomerContext();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Results
  const [customerType, setCustomerType] = useState("CPA");
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const customerTypeOptions = [
    { value: "CPA", label: "CPA Customers" },
    { value: "NonCPA", label: "NonCPA Customers" },
  ];

  const resetForm = () => {
    setStep(1);
    setFile(null);
    setParsedData(null);
    setImportResults(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.name.endsWith(".csv")
      ) {
        setError("Please select a valid CSV file");
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("File size must be less than 5MB");
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  };

  const handleParseCSV = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const text = await file.text();
      const parsed = parseCSV(text, customerType);

      setParsedData(parsed);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData?.customers) return;

    setLoading(true);
    try {
      const results = await importCustomers(parsedData.customers);
      setImportResults(results);
      setStep(3);

      if (onSuccess) {
        onSuccess(results);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate(customerType);
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Customer Type Selection */}
            <Select
              label="Customer Type"
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              options={customerTypeOptions}
              helper="Select the type of customers you want to import"
            />

            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-400 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Need a template?
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Download our CSV template with the correct format and
                    required columns.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={handleDownloadTemplate}
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    }
                  >
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        ref={fileInputRef}
                        name="file-upload"
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV files up to 5MB</p>
                </div>
              </div>

              {file && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="ml-2 text-sm text-green-700">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Required Fields Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Required Columns:
              </h3>
              <div className="text-sm text-gray-600">
                {customerType === "CPA" ? (
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>cpaNumber</strong> - CPA license number
                    </li>
                    <li>
                      <strong>title</strong> - Mr., Ms., Dr., etc.
                    </li>
                    <li>
                      <strong>name</strong> - First name
                    </li>
                    <li>
                      <strong>surname</strong> - Last name
                    </li>
                    <li>email - Email address (optional)</li>
                    <li>phone - Phone number (optional)</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>title</strong> - Mr., Ms., Dr., etc.
                    </li>
                    <li>
                      <strong>name</strong> - First name
                    </li>
                    <li>
                      <strong>surname</strong> - Last name
                    </li>
                    <li>email - Email address (optional)</li>
                    <li>phone - Phone number (optional)</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    File parsed successfully!
                  </h3>
                  <p className="text-sm text-green-700">
                    Found {parsedData?.customers?.length || 0} valid customers
                    ready to import.
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {parsedData?.customers?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Valid Records</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {parsedData?.errors?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {/* Preview Table */}
            {parsedData?.customers && parsedData.customers.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Preview (First 5 records)
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        {customerType === "CPA" && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CPA #
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.customers
                        .slice(0, 5)
                        .map((customer, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  customer.type === "CPA"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {customer.type}
                              </span>
                            </td>
                            {customerType === "CPA" && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {customer.cpaNumber}
                              </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {customer.title} {customer.name}{" "}
                              {customer.surname}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {customer.email || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {customer.phone || "-"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors */}
            {parsedData?.errors && parsedData.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-3">
                  Errors Found
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {parsedData.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 py-1">
                      <strong>Row {error.row}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Import Complete!
              </h3>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResults?.imported?.length || 0}
                </div>
                <div className="text-sm text-green-800">
                  Successfully Imported
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResults?.duplicates?.length || 0}
                </div>
                <div className="text-sm text-yellow-800">
                  Duplicates Skipped
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResults?.errors?.length || 0}
                </div>
                <div className="text-sm text-red-800">Errors</div>
              </div>
            </div>

            {/* Duplicates */}
            {importResults?.duplicates &&
              importResults.duplicates.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-yellow-600 mb-3">
                    Duplicates Found
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {importResults.duplicates.map((duplicate, index) => (
                      <div key={index} className="text-sm text-yellow-700 py-1">
                        <strong>
                          {duplicate.data.name} {duplicate.data.surname}
                        </strong>{" "}
                        - Matches existing customer by{" "}
                        {duplicate.existingCustomers[0]?.duplicateReason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        );

      default:
        return null;
    }
  };

  const getFooterButtons = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleParseCSV}
              disabled={!file}
              loading={loading}
            >
              Parse CSV
            </Button>
          </>
        );
      case 2:
        return (
          <>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              loading={loading}
              disabled={
                !parsedData?.customers || parsedData.customers.length === 0
              }
            >
              Import {parsedData?.customers?.length || 0} Customers
            </Button>
          </>
        );
      case 3:
        return (
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Customers from CSV"
      size="xl"
      footer={
        <div className="flex justify-between w-full">{getFooterButtons()}</div>
      }
    >
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center">
          {[1, 2, 3].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= stepNumber
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > stepNumber ? "bg-primary-600" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Upload</span>
          <span>Preview</span>
          <span>Results</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      {getStepContent()}
    </Modal>
  );
};

export default CSVImport;
