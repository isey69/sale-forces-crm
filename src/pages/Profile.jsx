import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || "",
    email: currentUser?.email || "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateUserProfile({
        displayName: formData.displayName,
      });
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white shadow-card rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          Account Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Display Name"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            placeholder="Enter your display name"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            disabled
            helper="Email address cannot be changed"
          />

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={loading}>
              Update Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Account Stats */}
      <div className="bg-white shadow-card rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Account Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">
              {new Date(
                currentUser?.metadata?.creationTime || Date.now()
              ).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">Member Since</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {new Date(
                currentUser?.metadata?.lastSignInTime || Date.now()
              ).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">Last Login</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {currentUser?.emailVerified ? "Verified" : "Unverified"}
            </p>
            <p className="text-sm text-gray-600">Email Status</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
