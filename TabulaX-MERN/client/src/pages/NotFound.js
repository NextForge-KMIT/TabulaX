import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          404 - Page Not Found
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Oops! The page you're looking for doesn't exist.
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          The page you requested could not be found. It might have been removed, renamed, or is temporarily unavailable.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/dashboard"
            sx={{ mr: 2 }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/"
            size="large"
          >
            Return Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;
