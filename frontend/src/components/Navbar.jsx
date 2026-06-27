import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser } = useAuth();

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    logoutUser(); 
    navigate("/login");
  };

  // Secure navigation guard ONLY for Problems and Leaderboard
  const handleProtectedNavigation = (e, path) => {
    if (!user) {
      e.preventDefault(); // Stop default standard routing link transition
      navigate("/login", { state: { from: path } }); // Save location to redirect back after login
    }
  };

  // Premium sliding bottom border animation styles
  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return `text-sm font-medium tracking-wide transition-all duration-300 px-1 py-2 relative uppercase text-xs font-semibold tracking-wider after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-gradient-to-r after:from-emerald-400 after:to-blue-500 after:transition-all after:duration-300 ${
      isActive 
        ? "text-emerald-400 after:w-full" 
        : "text-gray-400 hover:text-white after:w-0"
    }`;
  };

  return (
    <nav className="bg-gray-950/80 border-b border-gray-900/60 text-white px-8 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-opacity-95 shadow-2xl shadow-black/40">
      
      {/* Left Section: Branding & Main Navigation items */}
      <div className="flex items-center gap-10">
        <Link 
          to="/" 
          className="text-2xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent hover:opacity-90 transition-all duration-300"
        >
          CodeAlly<span className="text-blue-500 font-mono text-lg">.</span>
        </Link>

        <div className="flex items-center gap-8">
          <Link 
            to="/problems" 
            onClick={(e) => handleProtectedNavigation(e, "/problems")} 
            className={getLinkStyle("/problems")}
          >
            Problems
          </Link>
          
          {/* Public Link: No login check, routes straight through */}
          <Link 
            to="/compiler" 
            className={getLinkStyle("/compiler")}
          >
            Online Compiler
          </Link>
          
          <Link 
            to="/leaderboard" 
            onClick={(e) => handleProtectedNavigation(e, "/leaderboard")} 
            className={getLinkStyle("/leaderboard")}
          >
            Leaderboard
          </Link>

          {user && isAdmin && (
            <Link 
              to="/admin/problems" 
              className={getLinkStyle("/admin/problems")}
            >
              Manage
            </Link>
          )}
        </div>
      </div>

      {/* Right Section: Action Profiles / Auth Triggers */}
      <div className="flex items-center gap-5">
        {user ? (
          <div className="flex items-center gap-4">
            <Link 
              to="/profile" 
              className={`text-sm font-mono font-medium px-4 py-1.5 rounded-xl border transition-all duration-300 ${
                location.pathname === "/profile"
                  ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-950/40"
                  : "bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white"
              }`}
            >
              ~/{user.firstname?.toLowerCase() || "user"}
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs uppercase font-bold tracking-wider bg-transparent hover:bg-red-950/20 text-gray-400 hover:text-red-400 border border-gray-800 hover:border-red-900/40 px-4 py-2 rounded-xl transition-all duration-200"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-950/60 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

    </nav>
  );
}