import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { register, isAuthenticated, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Set error message from auth context
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Validate form
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMessage('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Attempt registration
    const success = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password
    });
    
    if (!success) {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          my: { xs: 3, md: 6 },
          p: { xs: 2, md: 3 },
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
            Create an Account
          </Typography>
          
          {errorMessage && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {errorMessage}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                {"Already have an account? Sign In"}
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
