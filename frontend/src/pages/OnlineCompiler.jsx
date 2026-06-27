import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Sparkles, Copy, Terminal, Code2 } from 'lucide-react';
import { getGeminiFeedback , runCode } from '../apis/auth';

const getBoilerplateCode = (lang) => {
  switch (lang) {
    case 'cpp':
      return `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Start coding here
    cout << "Hello, World!" << endl;

    return 0;
}`;
    case 'python':
      return `# Start coding here

def solve():
    print("Hello, World!")
    # Your solution here
    pass

if __name__ == "__main__":
    solve()`;
    case 'javascript':
      return `// Start coding here

function solve() {
    console.log("Hello, World!");
    // Your solution here
}

solve();`;
    default:
      return `// Start coding here
console.log("Hello, World!");`;
  }
};

const OnlineCompiler = () => {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [isRunning, setIsRunning] = useState(false);
  const [aiFeedback, setAIFeedback] = useState('');
  const [aiFeedbackLoading, setAIFeedbackLoading] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('input');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const boilerplate = getBoilerplateCode('cpp');
    setCode(boilerplate);
  }, []);

  useEffect(() => {
    const listener = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [code, input]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const boilerplate = getBoilerplateCode(newLang);
    setCode(boilerplate);
    setInput('');
    setOutput('');
  };

  const handleResetCode = () => {
    const boilerplate = getBoilerplateCode(language);
    setCode(boilerplate);
    setInput('');
    setOutput('');
  };

  const handleRunCode = async () => {
    setActiveConsoleTab('output');
    setIsRunning(true);
    setOutput('');
    try {
      const start = Date.now();
      const { data } = await runCode(code, input, language);
      const duration = Date.now() - start;
      setOutput(data.output)
    } catch (error) {
      setOutput('❌ Failed to run code. Please check the console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleAIFeedback = async () => {
    setIsAiModalOpen(true);
    setAIFeedbackLoading(true);
    setAIFeedback('');
    try {
      const response = await getGeminiFeedback({ code, language, input, output });
      setAIFeedback(response.data.feedback || 'No suggestions from AI.');
    } catch (err) {
      setAIFeedback('❌ Failed to get feedback.');
    } finally {
      setAIFeedbackLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const startY = e.clientY;
    const startHeight = consoleHeight;
    
    const handleMouseMove = (e) => {
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
      setConsoleHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-violet-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                AI Code Analysis
              </h2>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                  {aiFeedbackLoading ? (
                    <div className="flex items-center gap-3 text-violet-400">
                      <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                      Analyzing your code...
                    </div>
                  ) : aiFeedback}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Code Compiler</h1>
            </div>
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-600 transition-colors"
            >
              <option value="cpp" className="bg-gray-700 text-white">C++</option>
              <option value="python" className="bg-gray-700 text-white">Python</option>
              <option value="javascript" className="bg-gray-700 text-white">JavaScript</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:opacity-70"
            >
              {isRunning ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
            <button
              onClick={handleResetCode}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleAIFeedback}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              AI Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 bg-gray-900 border-b border-gray-700 overflow-hidden">
          <div className="h-full p-4">
            <div className="h-full bg-gray-950 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
              <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                </div>
                <span className="text-gray-300 text-sm font-medium">main.{language}</span>
                <div className="ml-auto text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                  Ctrl+Enter to run
                </div>
              </div>
              <div className="h-full" style={{ height: 'calc(100% - 48px)' }}>
                <Editor
                  language={language === 'cpp' ? 'cpp' : language}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: 'Fira Code, Monaco, Consolas, monospace',
                    tabSize: 4,
                    insertSpaces: true,
                    folding: true,
                    matchBrackets: 'always',
                    autoIndent: 'full'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className={`h-2 bg-gray-700 hover:bg-blue-600 cursor-row-resize flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-600' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1 bg-gray-500 rounded-full"></div>
        </div>

        {/* Console */}
        <div 
          className="bg-gray-800 border-t border-gray-700 flex flex-col shadow-xl"
          style={{ height: `${consoleHeight}px`, minHeight: '200px', maxHeight: '600px' }}
        >
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveConsoleTab('input')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeConsoleTab === 'input' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700 bg-gray-750'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Input
              </button>
              <button
                onClick={() => setActiveConsoleTab('output')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeConsoleTab === 'output' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Output
              </button>
            </div>
            {activeConsoleTab === 'output' && output && (
              <button
                onClick={() => copyToClipboard(output)}
                className="flex items-center gap-2 text-gray-300 hover:text-white text-sm hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors border border-gray-600 hover:border-gray-500"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            )}
          </div>

          <div className="flex-1 p-4 overflow-hidden">
            {activeConsoleTab === 'input' && (
              <textarea
                className="w-full h-full bg-gray-900 text-gray-100 font-mono text-sm p-4 rounded-lg border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                placeholder="Enter your input here..."
              />
            )}
            {activeConsoleTab === 'output' && (
              <div className="h-full bg-gray-900 rounded-lg border border-gray-600 overflow-auto shadow-inner">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-100 p-4 h-full">
                  {output || (
                    <span className="text-gray-500 italic">
                      Run your code to see the output here...
                    </span>
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineCompiler;