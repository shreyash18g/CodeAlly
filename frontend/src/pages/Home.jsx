import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [typedText, setTypedText] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef(null);
  const fullText = 'Master algorithms, get AI-driven insights, and track your progress.';

  // Connect component status to the global Auth state
  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Ensure page scrolls to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsVisible(true), 200);
  }, []);

  // Enhanced typewriter effect with pause at commas and backspace effect
  useEffect(() => {
    let index = 0;
    const typingSpeed = 40;
    const pauseAtComma = 400;
    const startDelay = 600;

    const startTyping = setTimeout(() => {
      const timer = setInterval(() => {
        if (index < fullText.length) {
          setTypedText(fullText.slice(0, index + 1));
          index++;
          if (fullText[index] === ',') {
            clearInterval(timer);
            setTimeout(() => {
              const nextTimer = setInterval(() => {
                if (index < fullText.length) {
                  setTypedText(fullText.slice(0, index + 1));
                  index++;
                } else {
                  clearInterval(nextTimer);
                }
              }, typingSpeed);
            }, pauseAtComma);
          }
        } else {
          clearInterval(timer);
        }
      }, typingSpeed);
      return () => clearInterval(timer);
    }, startDelay);

    return () => clearTimeout(startTyping);
  }, []);

  // Dynamic gradient based on mouse position
  const getMouseGradient = () => {
    const x = (mousePosition.x / window.innerWidth) * 100;
    const y = (mousePosition.y / window.innerHeight) * 100;
    return {
      background: `radial-gradient(600px circle at ${x}% ${y}%, rgba(16, 185, 129, 0.15), transparent 50%)`
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Interactive Mouse Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
        style={getMouseGradient()}
      />

      {/* Animated Background Elements with Enhanced Parallax */}
      <div className="absolute inset-0">
        {/* Large Gradient Orbs with Smooth Parallax */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-glow transform-gpu will-change-transform"
          style={{ transform: `translate(${mousePosition.x * -0.04}px, ${mousePosition.y * -0.04}px)` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-glow delay-800 transform-gpu will-change-transform"
          style={{ transform: `translate(${mousePosition.x * 0.04}px, ${mousePosition.y * 0.04}px)` }}
        />
        <div 
          className="absolute top-3/4 left-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl animate-glow delay-400 transform-gpu will-change-transform"
          style={{ transform: `translate(${mousePosition.x * -0.03}px, ${mousePosition.y * -0.03}px)` }}
        />
        
        {/* Animated Lines with Subtle Pulse */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent animate-line-pulse will-change-transform" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-line-pulse delay-600 will-change-transform" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Hero Section */}
        <section ref={heroRef} className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-6xl mx-auto">
            
            {/* Main Headline with Enhanced Staggered Animation */}
            <div className="mb-8">
              <h1 className={`text-5xl sm:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400 mb-6 leading-tight transition-all duration-1200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isVisible 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-12 scale-95'
              }`}>
                {['C', 'o', 'd', 'e', 'A', 'l', 'l', 'y'].map((char, i) => (
                  <span
                    key={i}
                    className="inline-block animate-spring"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {char}
                  </span>
                ))}
              </h1>
              
              <div className={`h-20 flex items-center justify-center transition-all duration-1200 delay-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}>
                <p className="text-xl sm:text-2xl lg:text-3xl text-gray-200 font-light tracking-wide">
                  {typedText}
                  <span className="animate-pulse text-emerald-400 ml-2">|</span>
                </p>
              </div>
            </div>

            {/* Action Buttons with Enhanced Staggered Entrance */}
            <div className={`flex flex-col items-center gap-6 mb-12 transition-all duration-1200 delay-600 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-12'
            }`}>
              {isLoggedIn === true && (
                <div className="text-emerald-300 text-xl font-medium animate-spring">
                  <span className="inline-block animate-wave mr-2">👋</span>Welcome back!
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {isLoggedIn === null ? (
                  // Enhanced Loading State
                  <div className="flex gap-4">
                    <div className="px-8 py-4 bg-gray-800/50 rounded-full animate-pulse border border-gray-700/50">
                      <div className="w-20 h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-shimmer"></div>
                    </div>
                    <div className="px-8 py-4 bg-gray-800/50 rounded-full animate-pulse border border-gray-700/50">
                      <div className="w-32 h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-shimmer"></div>
                    </div>
                  </div>
                ) : isLoggedIn === false ? (
                  // Enhanced Login Buttons
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-blue-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-emerald-600/50 hover:shadow-xl transform hover:scale-105 transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] hover:from-emerald-500 hover:to-blue-500 overflow-hidden will-change-transform animate-pulse-subtle"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 opacity-0 group-hover:opacity-40 transition-opacity duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
                      <span className="relative flex items-center gap-2 group-hover:scale-103 transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
                        Sign In
                        <svg className="w-5 h-5 group-hover:translate-x-3 transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                        </svg>
                      </span>
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="group relative px-8 py-4 border-2 border-emerald-400 text-emerald-300 rounded-full font-semibold text-lg hover:bg-emerald-400 hover:text-white transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] transform hover:scale-105 overflow-hidden will-change-transform animate-pulse-subtle"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-800 ease-[cubic-bezier(0.4,0,0.2,1)] origin-left"></div>
                      <span className="relative group-hover:scale-103 transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">Get Started Free</span>
                    </button>
                  </>
                ) : null}
                
                {/* Enhanced Start Coding Button */}
                {isLoggedIn !== null && (
                  <button
                    onClick={() => navigate('/problems')}
                    className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 via-blue-500 to-emerald-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-emerald-600/50 hover:shadow-xl transform hover:scale-105 transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden will-change-transform animate-pulse-subtle"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 opacity-0 group-hover:opacity-40 transition-opacity duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
                    <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-800 ease-[cubic-bezier(0.4,0,0.2,1)] origin-left"></div>
                    <span className="relative flex items-center gap-2 group-hover:scale-103 transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
                      Start Coding
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Feature Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto transition-all duration-1200 delay-900 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-16'
            }`}>
              
              {/* Feature 1 - Enhanced */}
              <div className="group relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-6 hover:bg-gray-800/80 transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/30 transform hover:scale-105 hover:-translate-y-3 overflow-hidden will-change-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-emerald-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-115 group-hover:rotate-8 transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-lg group-hover:shadow-emerald-500/60">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">Curated Problems</h3>
                  <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
                    Practice with carefully selected coding challenges
                  </p>
                </div>
              </div>

              {/* Feature 2 - Enhanced */}
              <div className="group relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-6 hover:bg-gray-800/80 transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-105 hover:-translate-y-3 overflow-hidden will-change-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-blue-500 to-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-115 group-hover:rotate-8 transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-lg group-hover:shadow-blue-500/60">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-200 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">AI Feedback</h3>
                  <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
                    Get instant, intelligent code reviews and suggestions
                  </p>
                </div>
              </div>

              {/* Feature 3 - Enhanced */}
              <div className="group relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-6 hover:bg-gray-800/80 transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/30 transform hover:scale-105 hover:-translate-y-3 overflow-hidden will-change-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-emerald-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-115 group-hover:rotate-8 transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-lg group-hover:shadow-emerald-500/60">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">Progress Tracking</h3>
                  <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
                    Visualize your growth with detailed analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Footer with Fade-In */}
        <footer className={`py-6 px-4 text-center border-t border-gray-700/50 bg-gray-900/60 backdrop-blur-xl transition-all duration-1200 delay-1100 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}>
          <div className="max-w-6xl mx-auto">
            <p className="text-gray-300 text-sm hover:text-white transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
               CodeAlly Made with <span className="text-red-500 animate-pulse">❤️</span> for developers.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;