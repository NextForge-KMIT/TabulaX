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
        elevation={4} // Slightly increased elevation
        sx={{
          p: { xs: 3, md: 4 }, // Responsive padding
          mb: 5, // Increased margin bottom
          borderRadius: 3, // Softer border radius
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'primary.contrastText',
          boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
          Hello, {user?.username || 'User'}!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Welcome to your TabulaX dashboard. Here you can access all the tools to streamline your data transformation tasks.
        </Typography>
      </Paper>

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
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                {feature.icon}
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
                >
                  {feature.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, mb: 2 }}>
        <Divider />
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          About TabulaX
        </Typography>
        <Typography variant="body1" paragraph>
          TabulaX is a powerful tool for data transformation and joining. It uses machine learning to understand and 
          generate transformations between columns, making data preparation faster and more efficient.
        </Typography>
        <Typography variant="body1" paragraph>
          With support for various data sources including CSV, Excel, MySQL, and MongoDB, TabulaX streamlines 
          your data processing workflow.
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard;
