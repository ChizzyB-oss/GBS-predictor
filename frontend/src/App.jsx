import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./Context/AuthContext";

import LandingPage from "./Pages/LandingPage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import MFAChallenge from "./Pages/MFAChallenge";

import ClinicianDashboard from "./Pages/Clinician/ClinicianDashboard";
import PredictionForm from "./Pages/Clinician/PredictionForm";
import PredictionHistory from "./Pages/Clinician/PredictionHistory";
import ProfileSettings from "./Pages/Clinician/ProfileSettings";
import ReviewOutbox from "./Pages/Clinician/ReviewOutbox";
import ReviewInbox from "./Pages/Clinician/ReviewInbox";

import AdminDashboard from "./Pages/Admin/AdminDashboard";
import ManageUsers from "./Pages/Admin/ManageUsers";
import ViewPredictions from "./Pages/Admin/ViewPredictions";
import SystemSettings from "./Pages/Admin/SystemSettings";
import AdminMonitoring from "./Pages/Admin/AdminMonitoring";

import ProtectedRoute from "./Components/ProtectedRoute";
import PredictionResultPage from "./Components/PredictionResultModal";
import { AuthProvider } from "./Context/AuthContext";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null; // Optional loader

  return (
    <Routes>

      {/* PUBLIC ROOT ROUTE WITH REDIRECT */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={user.role === "admin" ? "/admin/dashboard" : "/clinician/dashboard"}
              replace
            />
          ) : (
            <LandingPage />
          )
        }
      />

      {/* LOGIN ROUTE */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate 
              to={user.role === "admin" ? "/admin/dashboard" : "/clinician/dashboard"} 
              replace 
            />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* REGISTER ROUTE */}
      <Route
        path="/register"
        element={
          user ? (
            <Navigate 
              to={user.role === "admin" ? "/admin/dashboard" : "/clinician/dashboard"} 
              replace 
            />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* CLINICIAN ROUTES */}
      <Route
        path="/clinician/dashboard"
        element={
          <ProtectedRoute allowed={["clinician"]}>
            <ClinicianDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clinician/predict"
        element={
          <ProtectedRoute allowed={["clinician"]}>
            <PredictionForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clinician/history"
        element={
          <ProtectedRoute allowed={["clinician"]}>
            <PredictionHistory />
          </ProtectedRoute>
        }
      />

      <Route 
        path="/clinician/reviews" 
        element={
          <ProtectedRoute allowed={["clinician"]}>
            <ReviewInbox /> 
          </ProtectedRoute>
        }
       />

       <Route 
        path="/clinician/reviews/sent" 
        element={
          <ProtectedRoute allowed={["clinician"]}>
            <ReviewOutbox />
          </ProtectedRoute>
        }
       />

      <Route
        path="/clinician/profile"
        element={
          <ProtectedRoute allowed={["clinician"]}>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowed={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowed={["admin"]}>
            <ManageUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/predictions"
        element={
          <ProtectedRoute allowed={["admin"]}>
            <ViewPredictions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowed={["admin"]}>
            <SystemSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/monitoring"
        element={
          <ProtectedRoute allowed={["admin"]}>
            <AdminMonitoring />
          </ProtectedRoute>
        }
      />

      <Route path="/mfa" element={<MFAChallenge />} />

<Route
  path="/prediction-result/:id"
  element={
    <ProtectedRoute allowed={["clinician", "admin"]}>
      <PredictionResultPage />
    </ProtectedRoute>
  }
/>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
