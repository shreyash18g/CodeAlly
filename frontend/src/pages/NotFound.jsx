import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () =>{
    const navigate = useNavigate();
    const [isRedirecting, setIsRedirecting] = useState(false);//
    const gohome = () =>{
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/home');
        }, 1000);
    }
    return (
        <div className=" flex flex-col items-center justify-center h-screen ">
          <h1 className="text-4xl font-bold mb-4">Oops!</h1>
          <p className="text-lg mb-3">The page you are looking for does not exist.</p>

          <button
            onClick={gohome}
            disabled={isRedirecting}
            className={`bg-white text-blue-600 font-semibold px-4 py-2 rounded-md shadow hover:bg-white/80 transition-all duration-200 flex items-center gap-2 justify-center border border-blue-600 ${
                isRedirecting ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {isRedirecting ? "Redirecting..." : "🏠 Go Home"}
          </button>
        </div>
      );
};

export default NotFound;