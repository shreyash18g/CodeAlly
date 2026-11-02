
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../apis/auth";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, password);
      setMessage(res.data.message);

      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(
        err.response?.data?.message || "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full bg-[#0c1729] border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-emerald-400 transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#111c30] to-[#080e1b] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            CodeAlly.
          </Link>
          <h1 className="text-3xl font-bold text-white mt-7">
            Reset Password
          </h1>
          <p className="text-gray-400 mt-2">
            Choose a new password for your account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900/70 border border-gray-700/70 rounded-3xl p-8 shadow-2xl"
        >
          <label className="block text-sm text-gray-300 mb-2">
            New Password
          </label>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
            required
          />

          <label className="block text-sm text-gray-300 mt-5 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={field}
            required
          />

          <p className="text-xs text-gray-500 mt-3">
            At least 6 characters, including one uppercase letter and one number.
          </p>

          {error && (
            <div className="mt-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-3 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!message}
            className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition"
          >
            {loading ? "Updating..." : "Reset Password"}
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
