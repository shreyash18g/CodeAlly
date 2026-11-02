
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../apis/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setMessage(res.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to send reset link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#111c30] to-[#080e1b] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            CodeAlly.
          </Link>
          <h1 className="text-3xl font-bold text-white mt-7">
            Forgot Password?
          </h1>
          <p className="text-gray-400 mt-2">
            No worries. We'll help you reset it.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900/70 border border-gray-700/70 rounded-3xl p-8 shadow-2xl"
        >
          <label className="block text-sm text-gray-300 mb-2">
            Registered Email Address
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#0c1729] border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-emerald-400 transition"
          />

          {message && (
            <div className="mt-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-3 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="text-center mt-6">
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 text-sm">
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
