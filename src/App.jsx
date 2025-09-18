import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CustomerProvider } from "./context/CustomerContext";
import { MeetingProvider } from "./context/MeetingContext";
import { NotesProvider } from "./context/NotesContext";
import { CustomFieldsProvider } from "./context/CustomFieldsContext";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Meetings from "./pages/Meetings";
import Notes from "./pages/Notes";
import CustomFields from "./pages/CustomFields";
import MeetingCategories from "./pages/MeetingCategories";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import CustomerDetail from "./components/customers/CustomerDetail";
import LabelsPage from "./pages/Labels";

function App() {
  console.log("App component rendering");
  return (
    <AuthProvider>
      <CustomFieldsProvider>
        <CustomerProvider>
          <MeetingProvider>
            <NotesProvider>
              <Router>
                <div className="min-h-screen bg-gray-50">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={<AuthenticatedApp />} />
                  </Routes>
                </div>
              </Router>
            </NotesProvider>
          </MeetingProvider>
        </CustomerProvider>
      </CustomFieldsProvider>
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  console.log("AuthenticatedApp rendering");
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/custom-fields" element={<CustomFields />} />
            <Route path="/meeting-categories" element={<MeetingCategories />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/customers/:customerId" element={<CustomerDetail />} />
            <Route path="/labels" element={<LabelsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
