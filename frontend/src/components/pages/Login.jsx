import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false); // ✅ ย้ายขึ้นมาด้านบน

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user, data.token);
        localStorage.setItem("token", data.token);
        alert("Login successful!");

        const roleRoutes = {
          1: "/profile/admin",    
          2: "/profile/seller",   
          3: "/profile/buyer",    
        };

        navigate(roleRoutes[data.user.role_id] || "/");

      } else {
        alert(data.detail || data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(`Error: ${error.message || "Something went wrong. Please try again."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-3xl font-bold mb-2">Log in</h1>
      <p className="text-gray-500 mb-6">Enter your details below</p>

      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-3 w-80 text-left"
      >
        <input
          type="email"
          name="email"
          placeholder="Email or Phone Number"
          className="border p-2 rounded"
          value={credentials.email}
          onChange={handleChange}
          disabled={isLoading} // ✅ เพิ่ม
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={credentials.password}
          onChange={handleChange}
          disabled={isLoading} // ✅ เพิ่ม
          required
        />
        <button
          type="submit"
          disabled={isLoading} // ✅ เพิ่ม
          className="bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed" // ✅ เพิ่ม disabled styles
        >
          {isLoading ? "Logging in..." : "Log In"} {/* ✅ เพิ่ม loading text */}
        </button>
      </form>

      <div className="text-sm mt-4 flex justify-between w-80">
        <span
          onClick={() => navigate("/signup")}
          className="text-red-500 cursor-pointer"
        >
          Create Account
        </span>
        <span
          onClick={() => navigate("/forgetpassword")}
          className="text-red-500 cursor-pointer"
        >
          Forget Password?
        </span>
      </div>
    </div>
  );
}