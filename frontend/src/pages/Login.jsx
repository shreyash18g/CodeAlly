
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../apis/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      loginUser();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full bg-[#0c1729] border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#111c30] to-[#080e1b] flex items-center justify-center px-5 py-12">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
            CodeAlly<span className="text-blue-500">.</span>
          </Link>

          <h1 className="text-3xl font-bold text-white mt-7">
            Welcome Back
          </h1>

          <p className="text-gray-400 mt-2">
            Continue your coding journey.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/70 rounded-3xl p-8 shadow-2xl shadow-black/40"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Sign in to CodeAlly
          </h2>

          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-2">
              Email Address
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end mb-6">
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition"
            >
              Forgot Password?
            </Link>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-400 hover:via-teal-400 hover:to-blue-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          <div className="border-t border-gray-700/70 mt-7 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-emerald-400 font-semibold hover:text-emerald-300"
              >
                Create Account
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Practice. Improve. Compete.
        </p>
      </div>
    </div>
  );
}
