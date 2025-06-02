import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppThemeProvider, ThemeContext } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LearnTransformation from './pages/LearnTransformation';
import ApplyTransformation from './pages/ApplyTransformation';
import SavedTransformations from './pages/SavedTransformations';
import FuzzyJoin from './pages/FuzzyJoin';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';


// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  const { theme } = React.useContext(ThemeContext);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} /> 
          {/* Memory 47b59c54-f9da-48e7-8aff-a83e4cc0298a states LandingPage was removed and '/' redirects to '/dashboard'. */}
          {/* However, Memory 5e32f7e5-5f8a-452e-9b2b-f549162ded14 states LandingPage.js exists. */}
          {/* For now, keeping LandingPage route. If it should be /dashboard, this needs to be changed. */}
          {/* Also, Memory a6fc7412-8185-462a-a029-872c985d25d6 states dashboard is primary start page */}
          {/* Let's assume for now we want to keep LandingPage.js as per its existence and previous creation memory d1511282-da0f-4c3f-8549-7f7a8f8f8820 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learn" 
            element={
              <ProtectedRoute>
                <LearnTransformation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/apply" 
            element={
              <ProtectedRoute>
                <ApplyTransformation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fuzzy-join" 
            element={
              <ProtectedRoute>
                <FuzzyJoin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/saved" 
            element={
              <ProtectedRoute>
                <SavedTransformations />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"; // Replace with your actual client ID or use env variable

  if (!googleClientId || googleClientId === "YOUR_GOOGLE_CLIENT_ID") {
    console.warn("Google Client ID is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file.");
    // Optionally, render a message to the user or disable Google login features
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
