import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';

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
import Footer from './components/Footer';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3A86FF', // A vibrant, modern blue
      light: '#79AFFF',
      dark: '#0059CB',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF8C00', // A warm, energetic orange
      light: '#FFB84D',
      dark: '#C76F00',
      contrastText: '#000000',
    },
    background: {
      default: '#F8F9FA', // Very light gray for a clean, airy feel
      paper: '#FFFFFF',   // Ensure paper elements like Cards are white
    },
    text: {
      primary: '#212529', // Dark gray for primary text, better than pure black
      secondary: '#6C757D', // Lighter gray for secondary text
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#FFA000',
    },
    info: {
      main: '#1976D2',
    },
    success: {
      main: '#2E7D32',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif', // Added Inter as preferred font
    h1: {
      fontSize: '2.8rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.015em',
    },
    h2: {
      fontSize: '2.2rem',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.8rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.005em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 600,
      lineHeight: 1.45,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none', // Already there, good!
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 10, // Slightly increased default border radius for a softer look
  },
  shadows: [
    'none',
    '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.03)', // Softer small shadow
    '0px 3px 5px -1px rgba(0,0,0,0.06), 0px 5px 8px 0px rgba(0,0,0,0.04), 0px 1px 14px 0px rgba(0,0,0,0.03)',
    '0px 3px 6px -1px rgba(0,0,0,0.07), 0px 6px 10px 0px rgba(0,0,0,0.05), 0px 1px 18px 0px rgba(0,0,0,0.04)', // Softer medium shadow
    '0px 4px 8px -1px rgba(0,0,0,0.07), 0px 8px 12px 0px rgba(0,0,0,0.05), 0px 1px 20px 0px rgba(0,0,0,0.04)',
    '0px 5px 10px -1px rgba(0,0,0,0.08), 0px 10px 15px 0px rgba(0,0,0,0.06), 0px 1px 24px 0px rgba(0,0,0,0.05)', // Softer large shadow
    '0px 5px 12px -2px rgba(0,0,0,0.08), 0px 12px 17px 0px rgba(0,0,0,0.06), 0px 2px 30px 0px rgba(0,0,0,0.05)',
    '0px 6px 13px -2px rgba(0,0,0,0.09), 0px 13px 19px 0px rgba(0,0,0,0.07), 0px 2px 34px 0px rgba(0,0,0,0.06)',
    '0px 6px 14px -2px rgba(0,0,0,0.09), 0px 14px 21px 0px rgba(0,0,0,0.07), 0px 2px 38px 0px rgba(0,0,0,0.06)',
    '0px 7px 15px -3px rgba(0,0,0,0.1), 0px 15px 23px 0px rgba(0,0,0,0.08), 0px 3px 42px 0px rgba(0,0,0,0.07)',
    '0px 7px 16px -3px rgba(0,0,0,0.1), 0px 16px 25px 0px rgba(0,0,0,0.08), 0px 3px 46px 0px rgba(0,0,0,0.07)',
    '0px 8px 17px -3px rgba(0,0,0,0.11), 0px 17px 27px 0px rgba(0,0,0,0.09), 0px 3px 50px 0px rgba(0,0,0,0.08)',
    '0px 8px 18px -4px rgba(0,0,0,0.11), 0px 18px 29px 0px rgba(0,0,0,0.09), 0px 4px 54px 0px rgba(0,0,0,0.08)',
    '0px 9px 19px -4px rgba(0,0,0,0.12), 0px 19px 31px 0px rgba(0,0,0,0.1), 0px 4px 58px 0px rgba(0,0,0,0.09)',
    '0px 9px 20px -4px rgba(0,0,0,0.12), 0px 20px 33px 0px rgba(0,0,0,0.1), 0px 4px 62px 0px rgba(0,0,0,0.09)',
    '0px 10px 21px -5px rgba(0,0,0,0.13), 0px 21px 35px 0px rgba(0,0,0,0.11), 0px 5px 66px 0px rgba(0,0,0,0.1)',
    '0px 10px 22px -5px rgba(0,0,0,0.13), 0px 22px 37px 0px rgba(0,0,0,0.11), 0px 5px 70px 0px rgba(0,0,0,0.1)',
    '0px 11px 23px -5px rgba(0,0,0,0.14), 0px 23px 39px 0px rgba(0,0,0,0.12), 0px 5px 74px 0px rgba(0,0,0,0.11)',
    '0px 11px 24px -6px rgba(0,0,0,0.14), 0px 24px 41px 0px rgba(0,0,0,0.12), 0px 6px 78px 0px rgba(0,0,0,0.11)',
    '0px 12px 25px -6px rgba(0,0,0,0.15), 0px 25px 43px 0px rgba(0,0,0,0.13), 0px 6px 82px 0px rgba(0,0,0,0.12)',
    '0px 12px 26px -6px rgba(0,0,0,0.15), 0px 26px 45px 0px rgba(0,0,0,0.13), 0px 6px 86px 0px rgba(0,0,0,0.12)',
    '0px 13px 27px -7px rgba(0,0,0,0.16), 0px 27px 47px 0px rgba(0,0,0,0.14), 0px 7px 90px 0px rgba(0,0,0,0.13)',
    '0px 13px 28px -7px rgba(0,0,0,0.16), 0px 28px 49px 0px rgba(0,0,0,0.14), 0px 7px 94px 0px rgba(0,0,0,0.13)',
    '0px 14px 29px -7px rgba(0,0,0,0.17), 0px 29px 51px 0px rgba(0,0,0,0.15), 0px 7px 98px 0px rgba(0,0,0,0.14)',
    '0px 14px 30px -8px rgba(0,0,0,0.17), 0px 30px 53px 0px rgba(0,0,0,0.15), 0px 8px 102px 0px rgba(0,0,0,0.14)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Kept your button border radius
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px', // Slightly larger padding for better click targets
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)', // Subtle shadow for buttons
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', // Smooth transitions
          '&:hover': {
            transform: 'translateY(-2px)', // Lift effect on hover
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)', // Enhanced shadow on hover
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#0059CB', // Darken primary on hover
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#C76F00', // Darken secondary on hover
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Kept your card border radius
          boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.07), 0px 4px 6px -2px rgba(0,0,0,0.05)', // Modern, soft shadow
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            // transform: 'translateY(-4px)', // Optional: lift card on hover
            // boxShadow: '0px 15px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)', // Enhanced shadow on hover
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF', // White AppBar for a clean look
          color: '#212529', // Dark text on white AppBar
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.06)', // Subtle shadow below AppBar
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8, // Consistent border radius
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3A86FF', // Primary color border on hover
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3A86FF', // Primary color border when focused
              borderWidth: '1px', // Ensure border width is consistent
            },
          },
          '& .MuiInputLabel-outlined.Mui-focused': {
            color: '#3A86FF', // Primary color for label when focused
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10, // Consistent with theme.shape.borderRadius
        }
        // Removing specific elevation overrides as theme.shadows should apply globally
      }
    }
  }
});

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

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
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
          <Footer />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
