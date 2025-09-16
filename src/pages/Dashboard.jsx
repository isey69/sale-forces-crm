import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCustomerContext } from "../context/CustomerContext";
import Button from "../components/common/Button";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { customers, loading } = useCustomerContext();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    cpaCustomers: 0,
    nonCpaCustomers: 0,
    recentlyAdded: 0,
    totalRelationships: 0,
  });

  // Calculate dashboard statistics
  useEffect(() => {
    if (customers.length > 0) {
      const cpaCount = customers.filter((c) => c.type === "CPA").length;
      const nonCpaCount = customers.filter((c) => c.type === "NonCPA").length;

      // Calculate recently added (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentCount = customers.filter((c) => {
        const createdAt = c.createdAt?.toDate?.() || new Date(c.createdAt);
        return createdAt >= oneWeekAgo;
      }).length;

      // Calculate total relationships
      const totalRelationships =
        customers.reduce((total, customer) => {
          return total + (customer.relationships?.length || 0);
        }, 0) / 2; // Divide by 2 because relationships are bidirectional

      setStats({
        totalCustomers: customers.length,
        cpaCustomers: cpaCount,
        nonCpaCustomers: nonCpaCount,
        recentlyAdded: recentCount,
        totalRelationships,
      });
    }
  }, [customers]);

  // Get recent customers (last 5)
  const getRecentCustomers = () => {
    return [...customers]
      .sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bDate - aDate;
      })
      .slice(0, 5);
  };

  const formatDate = (date) => {
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200 hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className="text-green-600 font-medium">↗ {trend}</span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );

  const QuickAction = ({ title, description, icon, href, color }) => (
    <Link
      to={href}
      className="group block p-6 bg-white rounded-lg shadow-card border border-gray-200 hover:shadow-card-hover transition-all hover:scale-105"
    >
      <div className="flex items-center">
        <div
          className={`p-3 rounded-full ${color} group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {getGreeting()}, {currentUser?.displayName || "User"}!
            </h1>
            <p className="text-primary-100 mt-2">
              Here's what's happening with your CRM today
            </p>
          </div>
          <div className="hidden md:block">
            <svg
              className="w-16 h-16 text-primary-200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          subtitle={`${stats.cpaCustomers} CPA • ${stats.nonCpaCustomers} NonCPA`}
          icon={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          }
          color="bg-blue-500"
          trend="+12%"
        />

        <StatCard
          title="CPA Customers"
          value={stats.cpaCustomers}
          icon={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          color="bg-green-500"
          trend="+8%"
        />

        <StatCard
          title="NonCPA Customers"
          value={stats.nonCpaCustomers}
          icon={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          color="bg-purple-500"
          trend="+15%"
        />

        <StatCard
          title="Relationships"
          value={stats.totalRelationships}
          icon={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          }
          color="bg-orange-500"
          trend="+20%"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickAction
            title="Add Customer"
            description="Register new CPA or NonCPA customer"
            href="/customers"
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            }
            color="bg-primary-500"
          />

          <QuickAction
            title="Schedule Meeting"
            description="Plan your next customer meeting"
            href="/meetings"
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            color="bg-green-500"
          />

          <QuickAction
            title="Import CSV"
            description="Bulk import customer data"
            href="/customers"
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            }
            color="bg-blue-500"
          />

          <QuickAction
            title="Custom Fields"
            description="Manage customer field templates"
            href="/custom-fields"
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Customers
            </h2>
            <Link
              to="/customers"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              View all →
            </Link>
          </div>

          {getRecentCustomers().length > 0 ? (
            <div className="space-y-4">
              {getRecentCustomers().map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        customer.type === "CPA"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    >
                      {customer.name.charAt(0)}
                      {customer.surname.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {customer.name} {customer.surname}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customer.type} • {formatDate(customer.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customer.type === "CPA"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {customer.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No customers yet</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={() => (window.location.href = "/customers")}
              >
                Add your first customer
              </Button>
            </div>
          )}
        </div>

        {/* Tips & Getting Started */}
        <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Getting Started
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-medium">
                    1
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Import your customers
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload CSV files with your CPA and NonCPA customer data
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-medium">
                    2
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Build relationships
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Link CPAs with their NonCPA clients for better organization
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-medium">
                    3
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Schedule meetings
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Plan and track your customer meetings with notes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
