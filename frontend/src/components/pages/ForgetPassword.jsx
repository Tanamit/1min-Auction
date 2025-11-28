import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";   // ← IMPORTANT

export default function ForgetPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");

  const handleChange = (e) => {
    setIdentifier(e.target.value);
  };

  const handleNext = async (e) => {
    e.preventDefault();

    const requestBody = {
      email: identifier, // backend expects 'email'
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json().catch(() => ({})); // avoid crash if response isn't JSON

      if (res.ok) {
        alert("User found! You can now reset your password.");
        navigate("/resetpassword");
      } else {
        alert(data.detail || "Could not find a user with that email.");
      }
    } catch (error) {
      console.error("Forget Password error:", error);

      alert("Something went wrong. Backend not reachable.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-4xl font-extrabold mb-2">Forget password</h1>
      <p className="text-gray-500 mb-10">Enter your details below</p>

      <form
        onSubmit={handleNext}
        className="flex flex-col gap-3 w-80 text-left"
      >
        <input
          type="text"
          name="identifier"
          placeholder="Email or Phone Number"
          className="border-b border-gray-300 p-2 focus:outline-none focus:border-red-500"
          value={identifier}
          onChange={handleChange}
          required
        />

        <div className="h-4"></div>

        <button
          type="submit"
          className="bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition duration-300 shadow-md"
        >
          Next
        </button>
      </form>
    </div>
  );
}
