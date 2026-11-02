import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar"; // Ensure your Navbar path is correct
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ProblemList from "./pages/ProblemList";
import ProblemDetails from "./components/ProblemDetails";
import OnlineCompiler from "./pages/OnlineCompiler";
import SubmissionHistory from "./pages/SubmissionHistory";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import AdminProblems from "./pages/AdminProblems";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <>
      {/* Persistent Global Navigation Header */}
      <Navbar />

      {/* Dynamic Application Page Routing Grid */}
      <Routes>
        {/* Public Guest Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/compiler" element={<OnlineCompiler />} />

        {/* Secured Authenticated Core Routes */}
        <Route
          path="/problems"
          element={
            <ProtectedRoute>
              <ProblemList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems/:problemNumber"
          element={
            <ProtectedRoute>
              <ProblemDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <SubmissionHistory />
            </ProtectedRoute>
          }
        />
        <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>


<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />


<Route
  path="/profile/:id"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        /> 
        <Route
  path="/admin/problems"
  element={
    <ProtectedRoute>
      <AdminProblems />
    </ProtectedRoute>
  }
/>

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;