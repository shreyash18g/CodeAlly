
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../apis/auth";

export default function Register() {
  const navigate = useNavigate();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await register(firstname, lastname, email, password);
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "string"
          ? data
          : data?.message || data?.email?.[0] ||
            data?.password?.[0] || "Registration Failed"
      );
    }
  };

  const field =
    "w-full bg-[#0c1729] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#111c30] to-[#080e1b] flex items-center justify-center px-5 py-12">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
            CodeAlly<span className="text-blue-500">.</span>
          </Link>

          <h1 className="text-3xl font-bold text-white mt-7">
            Create your account
          </h1>

          <p className="text-gray-400 mt-2">
            Start your coding journey with CodeAlly.
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/70 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/40"
        >

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              Register
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Enter your details to get started.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                placeholder="First name"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                className={field}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last name"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className={field}
                required
              />
            </div>

          </div>

          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-2">
              Use at least 8 characters.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-400 hover:via-teal-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            Create Account →
          </button>

          <div className="border-t border-gray-700/70 mt-7 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-emerald-400 font-semibold hover:text-emerald-300 transition"
              >
                Sign in
              </Link>
            </p>
          </div>

        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          © CodeAlly · Practice. Improve. Compete.
        </p>

      </div>
    </div>
  );
}
