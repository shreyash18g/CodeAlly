import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProblems, fetchSolvedProblems } from "../apis/auth";

// Cookie utility functions
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

// Moved outside the component to prevent re-creation on every render.
const getDifficultyInfo = (d) => {
  if (d < 1200) return { label: 'Easy', color: 'text-emerald-400', bgColor: 'bg-emerald-900/30', borderColor: 'border-emerald-700/50' };
  if (d < 1600) return { label: 'Medium', color: 'text-amber-400', bgColor: 'bg-amber-900/30', borderColor: 'border-amber-700/50' };
  if (d < 2000) return { label: 'Hard', color: 'text-rose-400', bgColor: 'bg-rose-900/30', borderColor: 'border-rose-700/50' };
  return { label: 'Expert', color: 'text-violet-400', bgColor: 'bg-violet-900/30', borderColor: 'border-violet-700/50' };
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Deterministic problem of the day based on current date
const getProblemOfTheDay = (problems) => {
  if (!problems.length) return null;

  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Check if we have a cached problem for today
  const cachedData = getCookie('problemOfTheDay');
  if (cachedData) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cachedData));
      if (parsed.date === dateString && parsed.problem) {
        // Verify the problem still exists in the current problems list
        const problemExists = problems.find(p => p.problemNumber === parsed.problem.problemNumber);
        if (problemExists) {
          return parsed.problem;
        }
      }
    } catch (e) {
      console.log('Failed to parse cached problem of the day');
    }
  }

  // Generate a deterministic seed from the date
  let seed = 0;
  for (let i = 0; i < dateString.length; i++) {
    seed = ((seed << 5) - seed + dateString.charCodeAt(i)) & 0xffffffff;
  }

  // Use the seed to select a problem deterministically
  const index = Math.abs(seed) % problems.length;
  const selectedProblem = problems[index];

  // Cache the problem for today
  const cacheData = {
    date: dateString,
    problem: selectedProblem
  };
  setCookie('problemOfTheDay', encodeURIComponent(JSON.stringify(cacheData)), 1);

  return selectedProblem;
};

const ProblemList = () => {
  const [allProblems, setAllProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const [problemOfTheDay, setProblemOfTheDay] = useState(null);
  const [sortOrder, setSortOrder] = useState('none');
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [codeforcesContests, setCodeforcesContests] = useState([]);
  const navigate = useNavigate();

  // Memoize the list of available tags
  const availableTags = useMemo(() => {
    const tags = new Set();
    allProblems.forEach(p => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(tag => tags.add(tag));
      }
    });
    return ['all', ...Array.from(tags).sort()];
  }, [allProblems]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all problems
        const problemsResponse = await fetchProblems();
        const problemsData = problemsResponse.data;
        setAllProblems(problemsData);

        // Set deterministic problem of the day
        const todaysProblem = getProblemOfTheDay(problemsData);
        setProblemOfTheDay(todaysProblem);

        // Try to fetch user's solved problems
        try {
          const solvedResponse = await fetchSolvedProblems();
          setSolvedProblems(new Set(solvedResponse.data));
        } catch (userError) {
          console.log("Could not fetch user stats, assuming user is not logged in.");
        }
      } catch (error) {
        console.error("Failed to fetch problems:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Fetch Codeforces upcoming contests
    const fetchCodeforcesContests = async () => {
      try {
        const response = await fetch('https://codeforces.com/api/contest.list');
        const json = await response.json();
        if (json.status === "OK" && json.result) {
          const upcoming = json.result
            .filter(c => c.phase === 'BEFORE')
            .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
            .slice(0, 2);
          setCodeforcesContests(upcoming);
        }
      } catch (error) {
        console.error("Failed to fetch Codeforces contests:", error);
      }
    };

    fetchCodeforcesContests();
  }, []);

  // Memoize the filtered and sorted problems
  const displayedProblems = useMemo(() => {
    let problems = [...allProblems];

    if (searchTerm) {
      problems = problems.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedTag !== 'all') {
      // Ensure p.tags is an array before using includes to avoid runtime errors.
      problems = problems.filter(p => Array.isArray(p.tags) && p.tags.includes(selectedTag));
    }

    if (sortOrder !== 'none') {
      problems.sort((a, b) => {
        return sortOrder === 'asc' ? a.difficulty - b.difficulty : b.difficulty - a.difficulty;
      });
    }

    return problems;
  }, [allProblems, sortOrder, selectedTag, searchTerm]);

  const handleSortChange = () => {
    setSortOrder(prev => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const handleProblemClick = (problemNumber) => {
    navigate(`/problems/${problemNumber}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent mb-4">
            Problem Collection
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Challenge yourself with our curated collection of programming problems
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Enhanced Filter Controls */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search problems..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                  />
                </div>

                {/* Tag Filter */}
                <div className="relative">
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all text-white"
                  >
                    {availableTags.map(tag => (
                      <option key={tag} value={tag} className="bg-gray-800 text-white">
                        {tag === 'all' ? 'All Tags' : tag}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Sort Button */}
                <button
                  onClick={handleSortChange}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  {sortOrder === 'asc' ? 'Easy → Hard' : sortOrder === 'desc' ? 'Hard → Easy' : 'Default'}
                </button>
              </div>
            </div>

            {/* Enhanced Problem List */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700/50 border-b border-gray-600/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-16">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Problem</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-24">Difficulty</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {displayedProblems.map(({ problemNumber, title, difficulty, tags }) => {
                      const difficultyInfo = getDifficultyInfo(difficulty);
                      const isSolved = solvedProblems.has(problemNumber);

                      return (
                        <tr key={problemNumber} className={`hover:bg-gray-700/30 transition-colors duration-150 ${isSolved ? 'bg-emerald-900/20' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {isSolved ? (
                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-6 h-6 border-2 border-gray-500 rounded-full"></div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              to={`/problems/${problemNumber}`}
                              className="text-gray-200 hover:text-blue-400 font-medium transition-colors duration-150 hover:underline"
                            >
                              {title}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${difficultyInfo.bgColor} ${difficultyInfo.color} border ${difficultyInfo.borderColor}`}>
                              {difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {tags?.slice(0, 3).map((tag, index) => (
                                <span
                                  key={`${problemNumber}-${tag}-${index}`}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-150"
                                >
                                  {tag}
                                </span>
                              ))}
                              {tags?.length > 3 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-400">
                                  +{tags.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Problem of the Day */}
            {problemOfTheDay && (
              <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-2xl p-6 border-2 border-amber-700/50 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🔥</span>
                  <h2 className="text-lg font-bold text-gray-100">Daily Challenge</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Your daily dose of algorithmic thinking
                </p>
                <div className="space-y-3">
                  <Link
                    to={`/problems/${problemOfTheDay.problemNumber}`}
                    className="block font-semibold text-gray-100 hover:text-blue-400 transition-colors duration-150 hover:underline"
                  >
                    {problemOfTheDay.title}
                  </Link>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDifficultyInfo(problemOfTheDay.difficulty).bgColor} ${getDifficultyInfo(problemOfTheDay.difficulty).color} border ${getDifficultyInfo(problemOfTheDay.difficulty).borderColor}`}>
                    {problemOfTheDay.difficulty}
                  </span>
                </div>
              </div>
            )}

            {/* Upcoming Contests */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50">
              <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-xl">🏆</span>
                Upcoming Contests
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <img src="https://sta.codeforces.com/s/12345/favicon.ico" alt="Codeforces" className="w-5 h-5 mt-0.5 rounded" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-200 mb-2">Codeforces</h4>
                    <div className="space-y-3">
                      {codeforcesContests.length === 0 ? (
                        <p className="text-sm text-gray-400">No upcoming contests</p>
                      ) : (
                        codeforcesContests.map((contest) => (
                          <div key={contest.id} className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700/70 transition-colors duration-150">
                            <a
                              href={`https://codeforces.com/contest/${contest.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline block mb-1"
                            >
                              {contest.name}
                            </a>
                            <div className="text-xs text-gray-400 space-y-1">
                              <div>{new Date(contest.startTimeSeconds * 1000).toLocaleString()}</div>
                              <div>Duration: {formatDuration(contest.durationSeconds || 0)}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemList;