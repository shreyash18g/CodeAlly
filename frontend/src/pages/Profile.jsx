
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProfile, getUserProfile } from "../apis/auth";

export default function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setUser(null);
        setError("");

        const res = id
          ? await getUserProfile(id)
          : await getProfile();

        setUser(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load profile"
        );
      }
    };

    loadProfile();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
        <div className="text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Profile unavailable</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/leaderboard" className="text-emerald-400 hover:text-emerald-300">
            Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-gray-300">
        Loading profile...
      </div>
    );
  }

  const name = `${user.firstname || ""} ${user.lastname || ""}`.trim() || "CodeAlly User";
  const solved = user.solvedProblems?.length || 0;
  const initial = user.firstname?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#111c30] to-[#080e1b] text-white px-5 py-12">

      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-2">
            CodeAlly / User Profile
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">
            Profile Overview
          </h1>
          <p className="text-gray-400 mt-2">
            Your coding journey, achievements and activity.
          </p>
        </div>

        <div className="bg-gray-900/70 border border-gray-700/70 rounded-3xl overflow-hidden shadow-2xl shadow-black/30">

          <div className="h-36 bg-gradient-to-r from-emerald-500/30 via-blue-500/30 to-purple-600/30 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
          </div>

          <div className="px-7 pb-8">

            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 relative">

              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-4xl font-bold shadow-xl border-4 border-gray-900">
                {initial}
              </div>

              <div className="flex-1 pb-1">
                <h2 className="text-2xl font-bold">{name}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  CodeAlly Member
                </p>
              </div>

              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 w-fit">
                {user.role || "User"}
              </span>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">

              <div className="bg-[#111c30] border border-gray-700/70 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-2">Email Address</p>
                <p className="font-medium break-all">
                  {user.email || "Private"}
                </p>
              </div>

              <div className="bg-[#111c30] border border-gray-700/70 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-2">User ID</p>
                <p className="font-medium">#{user.id}</p>
              </div>

            </div>

          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-5">Coding Statistics</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            <div className="bg-gray-900/70 border border-gray-700/70 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
              <div className="text-emerald-400 text-2xl mb-4">✓</div>
              <p className="text-gray-400 text-sm">Problems Solved</p>
              <h3 className="text-3xl font-bold mt-2">{solved}</h3>
            </div>

            <div className="bg-gray-900/70 border border-gray-700/70 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
              <div className="text-blue-400 text-2xl mb-4">⌘</div>
              <p className="text-gray-400 text-sm">Account Role</p>
              <h3 className="text-2xl font-bold mt-2 capitalize">
                {user.role || "User"}
              </h3>
            </div>

            <div className="bg-gray-900/70 border border-gray-700/70 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
              <div className="text-purple-400 text-2xl mb-4">★</div>
              <p className="text-gray-400 text-sm">Platform</p>
              <h3 className="text-2xl font-bold mt-2">CodeAlly</h3>
            </div>

          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <Link
            to="/leaderboard"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition"
          >
            ← Back to Leaderboard
          </Link>
        </div>

      </div>
    </div>
  );
}
