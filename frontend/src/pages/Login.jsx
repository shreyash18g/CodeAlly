import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../apis/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors on a new attempt

    try {
      const res = await login(email, password);

      // Secure tokens locally
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // Trigger global context status update
      loginUser();

      // Redirect securely to dashboard/home
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "Login Failed"
      );
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-8 rounded-lg w-96"
      >
        <h1 className="text-white text-3xl mb-6 font-bold">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-red-500 mb-4 text-sm bg-red-950/50 p-2 rounded border border-red-900">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}