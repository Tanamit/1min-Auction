import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";


export default function ResetPassword() {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    email: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    
    if (!passwords.email) {
      alert("Please enter your email address.");
      return;
    }
    
    try {
      const resetData = {
        email: passwords.email,
        new_password: passwords.newPassword,
      };

      const res = await fetch(`${API_BASE_URL}/api/users/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Your password has been successfully reset! You can now log in.");
        navigate("/login");
      } else {
        alert(data.detail || "Failed to reset password. Please check your email address.");
      }

    } catch (error) {
      console.error("Password reset error:", error);
      alert("Something went wrong. Please check that the backend server is running on port 8080.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-4xl font-extrabold mb-2">Reset password</h1>
      <p className="text-gray-500 mb-10">Enter your details below</p>

      <form
        onSubmit={handlePasswordReset}
        className="flex flex-col gap-3 w-80 text-left"
      >
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="border-b border-gray-300 p-2 focus:outline-none focus:border-red-500"
          value={passwords.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="newPassword"
          placeholder="New password"
          className="border-b border-gray-300 p-2 focus:outline-none focus:border-red-500"
          value={passwords.newPassword}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmNewPassword"
          placeholder="Confirm New Password"
          className="border-b border-gray-300 p-2 focus:outline-none focus:border-red-500"
          value={passwords.confirmNewPassword}
          onChange={handleChange}
          required
        />
        
        {/* Placeholder for spacing to match UI */}
        <div className="h-6"></div> 

        <button
          type="submit"
          className="bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition duration-300 shadow-md mb-2"
        >
          Reset Password
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition duration-300 shadow-md"
        >
          Back to login
        </button>
      </form>
    </div>
  );
}