import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";


export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "", // Snake_case key
    last_name: "",  // Snake_case key
    username: "",
    email: "",
    password: "",
    address: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account created successfully!");
        navigate("/login");
      } else {
        // This will catch the 400 Bad Request if it still occurs
        alert(data.detail || data.message || "Failed to create account"); 
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const inputBaseStyle = "border p-2 rounded";
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-3xl font-bold mb-2">Create an account</h1>
      <p className="text-gray-500 mb-6">Enter your details below</p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 w-80 text-left"
      >
        {/* First Name and Last Name on the same line */}
        <div className="flex gap-3">
            {/* First Name */}
            <input
            type="text"
            name="first_name" // Snake_case name
            placeholder="First Name"
            className={`${inputBaseStyle} w-1/2`}
            value={formData.first_name}
            onChange={handleChange}
            required
            />
            {/* Last Name */}
            <input
            type="text"
            name="last_name" // Snake_case name
            placeholder="Last Name"
            className={`${inputBaseStyle} w-1/2`}
            value={formData.last_name}
            onChange={handleChange}
            required
            />
        </div>
        {/* Username */}
        <input
          type="text"
          name="username"
          placeholder="Username"
          className={inputBaseStyle}
          value={formData.username}
          onChange={handleChange}
          required
        />
        {/* Email*/}
        <input
          type="email"
          name="email"
          placeholder="Email"
          className={inputBaseStyle}
          value={formData.email}
          onChange={handleChange}
          required
        />
        {/* Password */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          className={inputBaseStyle}
          value={formData.password}
          onChange={handleChange}
          required
        />
        {/* Address (using textarea for multi-line support) */}
        <textarea
          name="address"
          placeholder="Address"
          className={`${inputBaseStyle} resize-y h-20`}
          value={formData.address}
          onChange={handleChange}
          required
        />
        
        <button
          type="submit"
          className="bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Create Account
        </button>
      </form>

      <p className="text-sm mt-4">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-red-500 cursor-pointer"
        >
          Log in
        </span>
      </p>
    </div>
  );
}
