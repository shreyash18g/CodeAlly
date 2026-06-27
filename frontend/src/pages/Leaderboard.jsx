import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../apis/auth';
import { Link } from 'react-router-dom';

// A simple skeleton loader component for the table rows
const SkeletonRow = () => (
  <div className="bg-slate-800/20 rounded-lg p-4 mb-3 animate-pulse border border-slate-700/30">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-slate-700/50 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-700/50 rounded w-24"></div>
        <div className="h-2 bg-slate-700/50 rounded w-16"></div>
      </div>
      <div className="text-right space-y-1">
        <div className="h-3 bg-slate-700/50 rounded w-12"></div>
        <div className="h-2 bg-slate-700/50 rounded w-8"></div>
      </div>
    </div>
  </div>
);

const getRankClass = (rank) => {
  if (rank === 1) return 'bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border-amber-400/20';
  if (rank === 2) return 'bg-gradient-to-r from-slate-400/5 to-slate-500/5 border-slate-400/20';
  if (rank === 3) return 'bg-gradient-to-r from-orange-400/5 to-orange-500/5 border-orange-400/20';
  return 'bg-slate-800/10 border-slate-700/20 hover:bg-slate-800/20';
};

const avatarColors = [
  'bg-gradient-to-br from-blue-500/80 to-blue-600/80',
  'bg-gradient-to-br from-emerald-500/80 to-emerald-600/80',
  'bg-gradient-to-br from-purple-500/80 to-purple-600/80',
  'bg-gradient-to-br from-rose-500/80 to-rose-600/80',
  'bg-gradient-to-br from-amber-500/80 to-amber-600/80',
  'bg-gradient-to-br from-cyan-500/80 to-cyan-600/80',
  'bg-gradient-to-br from-indigo-500/80 to-indigo-600/80',
  'bg-gradient-to-br from-teal-500/80 to-teal-600/80',
];

const getAvatarInfo = (name) => {
  if (!name) return { initials: '?', color: 'bg-gradient-to-br from-gray-500/80 to-gray-600/80' };

  const parts = name.split(' ').filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name.substring(0, 2);

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = avatarColors[Math.abs(hash % avatarColors.length)];

  return { initials: initials.toUpperCase(), color };
};

const RankBadge = ({ rank }) => {
  if (rank === 1) return (
    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full border border-amber-400/30">
      <span className="text-xs font-bold text-amber-400">1</span>
    </div>
  );
  if (rank === 2) return (
    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-slate-300/20 to-slate-400/20 rounded-full border border-slate-400/30">
      <span className="text-xs font-bold text-slate-300">2</span>
    </div>
  );
  if (rank === 3) return (
    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-full border border-orange-400/30">
      <span className="text-xs font-bold text-orange-400">3</span>
    </div>
  );
  return (
    <div className="flex items-center justify-center w-8 h-8 bg-slate-700/30 rounded-full border border-slate-600/30">
      <span className="text-xs font-medium text-slate-400">{rank}</span>
    </div>
  );
};

const TopThreeDisplay = ({ users }) => {
  if (!users || users.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {users.slice(0, 3).map((user, index) => {
        const rank = index + 1;
        const avatar = getAvatarInfo(user.username);
        const isFirst = rank === 1;

        return (
          <div
            key={user.userId}
            className={`relative p-4 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${
              isFirst
                ? 'bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-400/20 md:order-2'
                : rank === 2
                  ? 'bg-gradient-to-br from-slate-400/5 to-slate-500/5 border-slate-400/20 md:order-1'
                  : 'bg-gradient-to-br from-orange-400/5 to-orange-500/5 border-orange-400/20 md:order-3'
            }`}
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <RankBadge rank={rank} />
              </div>

              <Link to={`/profile/${user.userId}`} className="group">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-sm mx-auto mb-3 transition-transform group-hover:scale-105 ${avatar.color} text-white`}>
                  {avatar.initials}
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2 group-hover:text-blue-400 transition-colors">
                  {user.username}
                </h3>
              </Link>

              <div className="space-y-1">
                <div className="text-xs text-slate-400">
                  {user.problemsSolved} solved
                </div>
                <div className="text-lg font-bold text-slate-300">
                  {user.score}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getLeaderboardData = async () => {
      try {
        setLoading(true);
        const response = await fetchLeaderboard();
        setLeaderboard(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setError("Could not load the leaderboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getLeaderboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            Top performers ranked by coding excellence and problem-solving skills.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {/* Top 3 Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-800/20 rounded-lg p-4 animate-pulse border border-slate-700/30">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 bg-slate-700/50 rounded-full mx-auto"></div>
                    <div className="w-12 h-12 bg-slate-700/50 rounded-full mx-auto"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-20 mx-auto"></div>
                    <div className="h-3 bg-slate-700/50 rounded w-16 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Rest of list skeleton */}
            {[...Array(7)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-400/60 text-4xl mb-4">⚠</div>
            <p className="text-red-400/80 text-sm font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600/80 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-slate-500 text-4xl mb-4">🏆</div>
            <p className="text-slate-500 text-sm">The leaderboard is empty. Be the first to solve problems!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <TopThreeDisplay users={leaderboard} />

            {/* All Rankings */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-400 mb-4 px-1">
                All Rankings
              </h2>

              {leaderboard.map((user, index) => {
                const rank = index + 1;
                const avatar = getAvatarInfo(user.username);

                return (
                  <div
                    key={user.userId}
                    className={`rounded-lg p-4 border backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] ${getRankClass(rank)}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <RankBadge rank={rank} />

                      {/* User Info */}
                      <Link to={`/profile/${user.userId}`} className="flex items-center gap-3 flex-1 group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs transition-transform group-hover:scale-105 ${avatar.color} text-white`}>
                          {avatar.initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                            {user.username}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {user.problemsSolved} problems
                          </p>
                        </div>
                      </Link>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-300">
                          {user.score}
                        </div>
                        <div className="text-xs text-slate-500">
                          score
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;