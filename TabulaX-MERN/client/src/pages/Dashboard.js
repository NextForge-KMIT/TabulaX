import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Divider
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ApplyIcon from '@mui/icons-material/PlayArrow';
import SavedIcon from '@mui/icons-material/Bookmark';
import InsightsIcon from '@mui/icons-material/Insights'; // Or other suitable icon for dashboard welcome
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // For About section
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Learn Transformations',
      description: 'Upload source and target data to learn column transformations. TabulaX automatically classifies and generates transformation functions.',
      icon: <SchoolIcon sx={{ fontSize: '3rem' }} color="secondary" />,
      link: '/learn',
      buttonText: 'Learn Transformation'
    },
    {
      title: 'Apply Transformations',
      description: 'Apply learned transformations to new data. Transform columns and prepare them for joining with target tables.',
      icon: <ApplyIcon sx={{ fontSize: '3rem' }} color="secondary" />,
      link: '/apply',
      buttonText: 'Apply Transformation'
    },
    {
      title: 'Saved Transformations',
      description: 'View and manage your saved transformations. Reuse transformations across different datasets.',
      icon: <SavedIcon sx={{ fontSize: '3rem' }} color="secondary" />,
      link: '/saved',
      buttonText: 'View Saved'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to TabulaX
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Smart Column Transformer
        </Typography>
        <Typography variant="body1" paragraph>
          Learn, apply, and save table transformations with ease. TabulaX helps you transform and join data from various sources.
        </Typography>
      </Box>

      <Paper
        elevation={6} // Increased elevation for better theme-adaptive shadow
        sx={{
          p: { xs: 3, md: 5 }, // Slightly increased padding
          mb: 5, 
          borderRadius: 3, 
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          color: (theme) => theme.palette.primary.contrastText, 
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <InsightsIcon sx={{ fontSize: { xs: '2.5rem', md: '3rem' }, mr: 2, opacity: 0.8 }} />
        <div>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 0.5 }}>
            Hello, {user?.username || 'User'}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Welcome to your TabulaX dashboard. Here you can access all the tools to streamline your data transformation tasks.
          </Typography>
        </div>
      </Paper>

      <Divider sx={{ my: 5 }} />
      <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 4, fontWeight: 700, color: 'primary.dark', textAlign: 'center' }}>
        Key Features
      </Typography>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)', // Increased lift
                  boxShadow: (theme) => theme.shadows[12], // Using theme shadow for consistency
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pt: 3, // Add padding top to the card for the icon circle
                pb: 1
              }}>
                <Box sx={{
                  p: 2.5, // Padding inside the circle
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                  borderRadius: '50%',
                  width: { xs: 60, md: 70 }, // Responsive size for the circle
                  height: { xs: 60, md: 70 },
                }}>
                  {React.cloneElement(feature.icon, { sx: { fontSize: { xs: '2rem', md: '2.5rem' }, color: 'secondary.main' } })}
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3" align="center" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="medium" 
                  variant="contained" 
                  fullWidth
                  component={RouterLink} 
                  to={feature.link}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ py: 1.2, mt: 1 }} // Add some top margin to button
                >
                  {feature.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 5 }} />
      <Paper 
        elevation={3}
        sx={{
          p: { xs: 2, md: 3 }, 
          mt: 5, 
          mb: 4,
          borderRadius: 2,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.7) : theme.palette.background.default, // Subtle background
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoOutlinedIcon sx={{ mr: 1.5, color: 'secondary.main', fontSize: '1.75rem' }} />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: 'primary.dark' }}>
            About TabulaX
          </Typography>
        </Box>
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
          TabulaX is a powerful tool designed to simplify and accelerate your data transformation and joining tasks. 
          By leveraging intelligent algorithms, it automatically understands and generates the necessary transformations 
          between columns, making your data preparation workflow significantly faster and more efficient.
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 0 }}>
          With seamless support for a variety of data sources including CSV, Excel, MySQL, and MongoDB, TabulaX 
          is your comprehensive solution for streamlining complex data processing challenges.
        </Typography>
        {/* Optional: Add a Learn More button here if desired in the future */}
        {/* <Button variant="outlined" component={RouterLink} to="/about-us-page" sx={{ mt: 2 }}>Learn More</Button> */}
      </Paper>
    </Container>
  );
};

export default Dashboard;
