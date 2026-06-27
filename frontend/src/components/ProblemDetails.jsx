import NotFound from "../pages/NotFound.jsx";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Split from "react-split";
import { fetchProblemByNumber } from '../apis/auth.js';
import Compiler from '../components/Compiler.jsx';

// Converts a numeric difficulty rating into a label for the badge.
// Thresholds match the original ProblemList/ProblemDetails behavior.
const getDifficultyLabel = (rating) => {
  if (rating == null) return 'Medium';
  if (rating < 1200) return 'Easy';
  if (rating < 1600) return 'Medium';
  return 'Hard';
};

const DifficultyBadge = ({ difficulty }) => {
  const label = getDifficultyLabel(difficulty);
  const styles = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10',
    Hard: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10',
  };
  const style = styles[label] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <span className={`px-4 py-1.5 text-xs font-medium rounded-full border backdrop-blur-sm shadow-lg ${style}`}>
      {label} · {difficulty}
    </span>
  );
};

const ProblemDetails = () => {
  const { problemNumber } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch problem data
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchProblemByNumber(problemNumber);
        setProblem(response.data);
      } catch (error) {
        if (error.response && (error.response.status === 404 || error.response.status === 400)) {
          setProblem(null);
          setError("notfound");
        } else {
          setError("other");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemNumber]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [problemNumber]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500"></div>
        <p className="text-slate-400 font-medium">Loading Problem...</p>
      </div>
    </div>
  );

  if (error === "notfound") return <NotFound />;

  if (error === "other") return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <p className="text-red-400 font-medium">Something went wrong. Please try again.</p>
      </div>
    </div>
  );

  if (!problem) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <p className="text-slate-400 font-medium">Problem data is not available.</p>
    </div>
  );

  const difficultyValue = problem.difficulty;

  return (
    <div className="bg-slate-950 antialiased text-slate-200 h-screen overflow-hidden">
      <Split
        sizes={[50, 50]}
        minSize={[500, 400]}
        gutterSize={12}
        gutterStyle={() => ({
          backgroundColor: '#0f172a',
          border: '2px solid #1e293b',
          borderRadius: '6px',
          cursor: 'col-resize',
        })}
        className="h-full flex"
      >
        {/* Problem Details Panel */}
        <div className="bg-slate-900 p-8 overflow-y-auto border-r border-slate-800 h-full">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-slate-100 leading-tight">{problem.title}</h1>
            <DifficultyBadge difficulty={difficultyValue} />
          </div>

          {problem.tags && problem.tags.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {problem.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <span className="mr-2">📝</span> Problem Description
              </h2>
              <div className="whitespace-normal font-mono text-slate-300 text-sm leading-relaxed bg-slate-800 p-4 rounded-xl border border-slate-700">
                {(problem.description || "No description available.").split('\n').map((line, idx) => (
                  <p key={idx} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <span className="mr-2">📥</span> Input Format
              </h2>
              <div className="whitespace-normal font-mono text-slate-300 text-sm leading-relaxed bg-slate-800 p-4 rounded-xl border border-slate-700">
                {(problem.input || "No input format specified.").split('\n').map((line, idx) => (
                  <p key={idx} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <span className="mr-2">📤</span> Output Format
              </h2>
              <div className="whitespace-normal font-mono text-slate-300 text-sm leading-relaxed bg-slate-800 p-4 rounded-xl border border-slate-700">
                {(problem.output || "No output format specified.").split('\n').map((line, idx) => (
                  <p key={idx} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Code Editor Panel */}
        <Compiler problem={problem} problemNumber={problemNumber} />
      </Split>
    </div>
  );
};

export default ProblemDetails;