import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center', 
  color: theme.palette.common.white,
  overflow: 'hidden', 
  '&::before': { 
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.3, 
    zIndex: 1,
  },
  '&::after': { 
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(75deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, 
    opacity: 0.8, 
    zIndex: 2,
  },
}));

const LandingPage = () => {
  return (
    <HeroSection>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ maxWidth: '600px', textAlign: 'left' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ 
            fontWeight: 700, 
            color: 'common.white', 
            mb: 2 
          }}>
            TabulaX
          </Typography>
          <Typography variant="h6" component="p" paragraph sx={{ 
            mb: 4, 
            color: 'common.white', 
            opacity: 0.9, 
            lineHeight: 1.6 
          }}>
            A powerful LLM-based framework for multi-class table transformations. Analyze, transform, and join tabular data with unprecedented ease and intelligence.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/login"
              sx={(theme) => ({
                py: 1.25,
                px: 3.5,
                fontSize: '1rem',
                fontWeight: 600,
                color: theme.palette.primary.main, // Blue text for solid button, as per image
                backgroundColor: theme.palette.common.white,
                borderRadius: theme.shape.borderRadius,
                '&:hover': {
                  backgroundColor: theme.palette.grey[200],
                },
              })}
            >
              Get Started
            </Button>
          </Box>
        </Box>
      </Container>
    </HeroSection>
  );
};

export default LandingPage;
