import React, { useState } from "react";
import Header from "./Header";
const config = require("../config");
const API_URL = config.IP_BACKEND;

const Settings = () => {
  const [selectedMenu, setSelectedMenu] = useState("profile");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    notifications: true,
    twoFactorAuth: false,
  });

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Settings saved successfully!");
        console.log(data);
      } else {
        alert("Failed to save settings. Please try again.");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("An error occurred while saving settings.");
    }
  };

  return (
    <div>
        <Header></Header>
        <div className="flex min-h-screen bg-gray-100">
            
        {/* Sidebar Menu */}
        <aside className="w-64 bg-white shadow-lg">
            <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-700">Settings</h3>
            <ul className="mt-4 space-y-2">
                <li
                className={`p-3 rounded-lg cursor-pointer ${
                    selectedMenu === "profile" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleMenuClick("profile")}
                >
                Profile
                </li>
                <li
                className={`p-3 rounded-lg cursor-pointer ${
                    selectedMenu === "security" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleMenuClick("security")}
                >
                Security
                </li>
                <li
                className={`p-3 rounded-lg cursor-pointer ${
                    selectedMenu === "notifications" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleMenuClick("notifications")}
                >
                Notifications
                </li>
            </ul>
            </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6">
            <h2 className="text-2xl font-semibold text-gray-800 capitalize">{selectedMenu} Settings</h2>

            {/* Profile Settings */}
            {selectedMenu === "profile" && (
            <div className="mt-6 space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-600">Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                />
                </div>
            </div>
            )}

            {/* Security Settings */}
            {selectedMenu === "security" && (
            <div className="mt-6 space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-600">Password</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                />
                </div>
                <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    name="twoFactorAuth"
                    checked={formData.twoFactorAuth}
                    onChange={handleChange}
                    className="text-blue-500 focus:ring focus:ring-blue-300"
                />
                <label className="text-sm text-gray-600">Enable Two-Factor Authentication</label>
                </div>
            </div>
            )}

            {/* Notifications Settings */}
            {selectedMenu === "notifications" && (
            <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={handleChange}
                    className="text-blue-500 focus:ring focus:ring-blue-300"
                />
                <label className="text-sm text-gray-600">Receive Notifications</label>
                </div>
            </div>
            )}

            <button
            onClick={handleSave}
            className="mt-6 px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
            >
            Save Settings
            </button>
        </main>
        </div>
    </div>
  );
};

export default Settings;
