import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AIInsights from "./pages/AIInsights";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ClassroomsList from "./pages/ClassroomsList";
import CreateClassroom from "./pages/CreateClassroom";
import Attendance from "./pages/Attendance";
import Analytics from "./pages/Analytics";
import Grades from "./pages/Grades";

function MainAppContent() {
  const { user, loading } = useAuth();

  // If user is logged in, render with Layout elements (Navbar, Sidebar, responsive padding)
  const renderLayout = (element: React.ReactNode) => {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex flex-1 min-h-[calc(100vh-64px)]">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            {element}
          </main>
        </div>
      </div>
    );
  };

  return (
    <Routes>
      {/* Unprotected Auth routes */}
      <Route
        path="/login"
        element={
          !user ? <Login /> : <Navigate to={user.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"} replace />
        }
      />
      <Route
        path="/register"
        element={
          !user ? <Register /> : <Navigate to={user.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"} replace />
        }
      />
      <Route
        path="/forgot-password"
        element={
          !user ? <ForgotPassword /> : <Navigate to={user.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"} replace />
        }
      />
      <Route
        path="/reset-password"
        element={
          !user ? <ResetPassword /> : <Navigate to={user.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"} replace />
        }
      />

      {/* Protected routes wrapped in layouts */}
      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute allowedRole="teacher">
            {renderLayout(<TeacherDashboard />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            {renderLayout(<StudentDashboard />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/classrooms"
        element={
          <ProtectedRoute>
            {renderLayout(<ClassroomsList />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-classroom"
        element={
          <ProtectedRoute allowedRole="teacher">
            {renderLayout(<CreateClassroom />)}
          </ProtectedRoute>
        }
      />
      
      {/* Dual routes for Attendance: select general or particular classroom ID */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute allowedRole="teacher">
            {renderLayout(<Attendance />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/:id"
        element={
          <ProtectedRoute allowedRole="teacher">
            {renderLayout(<Attendance />)}
          </ProtectedRoute>
        }
      />

      {/* Dual routes for Classroom specific analytics summaries */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            {renderLayout(<Analytics />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/:id"
        element={
          <ProtectedRoute>
            {renderLayout(<Analytics />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/grades"
        element={
          <ProtectedRoute>
            {renderLayout(<Grades />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/grades/:classroomId"
        element={
          <ProtectedRoute>
            {renderLayout(<Grades />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-insights"
        element={
          <ProtectedRoute>
            {renderLayout(<AIInsights />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-insights/:classroomId"
        element={
          <ProtectedRoute>
            {renderLayout(<AIInsights />)}
          </ProtectedRoute>
        }
      />

      {/* Wildcard redirect fallback depending on authenticated role */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate to={user.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
