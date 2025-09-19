import React, { useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Users,
  Building,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { CUSTOMER_STATUSES } from "../../utils/constants";

const CustomerTable = ({
  customers = [],
  onEditCustomer,
  onLoadMore,
  hasMore,
  isLoadingMore,
  statusFilter,
  onStatusFilterChange,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [filterType, setFilterType] = useState("all"); // all, cpa, noncpa

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((customer) =>
        filterType === "cpa"
          ? customer.type === "CPA"
          : customer.type === "NonCPA"
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.cpaNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [customers, searchTerm, sortConfig, filterType, filterStatus]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleRowClick = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  const getTypeIcon = (type) => {
    return type === "CPA" ? (
      <Building className="w-4 h-4 text-primary-600" />
    ) : (
      <Users className="w-4 h-4 text-secondary-600" />
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800";
      case "Scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "Considering":
        return "bg-purple-100 text-purple-800";
      case "Lost":
        return "bg-red-100 text-red-800";
      case "Customer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-soft">
      {/* Header Controls */}
      <div className="p-6 border-b border-secondary-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-secondary-600" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="cpa">CPA Only</option>
                <option value="noncpa">NonCPA Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-secondary-600" />
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                {CUSTOMER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-secondary-600">
            {filteredAndSortedCustomers.length} of {customers.length} customers
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-50">
            <tr>
              <th
                className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center">
                  Type
                  {getSortIcon("type")}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Name
                  {getSortIcon("name")}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors"
                onClick={() => handleSort("cpaNumber")}
              >
                <div className="flex items-center">
                  CPA Number
                  {getSortIcon("cpaNumber")}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors"
                onClick={() => handleSort("howNice")}
              >
                <div className="flex items-center">
                  How Nice
                  {getSortIcon("howNice")}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon("status")}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Relationships
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Last Meeting
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredAndSortedCustomers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => handleRowClick(customer)}
                className="hover:bg-secondary-50 cursor-pointer transition-colors"
              >
                {/* Type */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(customer.type)}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        customer.type === "CPA"
                          ? "bg-primary-100 text-primary-800"
                          : "bg-secondary-100 text-secondary-800"
                      }`}
                    >
                      {customer.type}
                    </span>
                  </div>
                </td>

                {/* Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-800">
                          {customer.name?.charAt(0)}
                          {customer.surname?.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-secondary-900">
                        {customer.title} {customer.name} {customer.surname}
                      </div>
                    </div>
                  </div>
                </td>

                {/* CPA Number */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-secondary-900">
                    {customer.cpaNumber || "-"}
                  </div>
                </td>

                {/* How Nice */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-secondary-900">
                    {customer.howNice ? `${customer.howNice}/10` : "N/A"}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      customer.status
                    )}`}
                  >
                    {customer.status || "N/A"}
                  </span>
                </td>

                {/* Contact */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-secondary-900 space-y-1">
                    {customer.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-secondary-400" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-secondary-400" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Relationships */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-secondary-900">
                    {customer.relationships?.length > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        {customer.relationships.length} connected
                      </span>
                    ) : (
                      <span className="text-secondary-400">No connections</span>
                    )}
                  </div>
                </td>

                {/* Last Meeting */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-secondary-900">
                    {customer.lastMeeting ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-secondary-400" />
                        <span>
                          {new Date(customer.lastMeeting).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-secondary-400">No meetings</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAndSortedCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">
            No customers found
          </h3>
          <p className="mt-1 text-sm text-secondary-500">
            {searchTerm
              ? "Try adjusting your search terms."
              : "Get started by adding your first customer."}
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="p-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(CustomerTable);
