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
  Divider
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ApplyIcon from '@mui/icons-material/PlayArrow';
import SavedIcon from '@mui/icons-material/Bookmark';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import WidgetsIcon from '@mui/icons-material/Widgets';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Learn Transformations',
      description: 'Automatically classify and generate transformation functions from example data.',
      icon: <SchoolIcon />,
      link: '/learn',
      buttonText: 'Start Learning'
    },
    {
      title: 'Apply Transformations',
      description: 'Apply your saved or learned transformations to new datasets with a single click.',
      icon: <ApplyIcon />,
      link: '/apply',
      buttonText: 'Apply Now'
    },
    {
        title: 'Fuzzy Join',
        description: 'Intelligently join datasets on non-exact keys, perfect for linking varied data sources.',
        icon: <MergeTypeIcon />,
        link: '/fuzzy-join',
        buttonText: 'Perform Join'
    },
    {
      title: 'Saved Transformations',
      description: 'Browse, manage, and reuse your library of powerful, custom transformations.',
      icon: <SavedIcon />,
      link: '/saved',
      buttonText: 'View Saved'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          p: { xs: 3, md: 6 },
          mb: 5,
          borderRadius: 3,
          color: 'common.white',
          position: 'relative',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'url(https://images.unsplash.com/photo-1487058792275-0ad4624ca1c5?auto=format&fit=crop&w=1350)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 3,
            zIndex: 1,
          },
          '& > *': {
            position: 'relative',
            zIndex: 2,
          },
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Hello, {user?.username || 'User'}!
        </Typography>
        <Typography variant="h5" paragraph>
          Welcome to your TabulaX dashboard. Let's get started.
        </Typography>
        <Button variant="contained" color="secondary" size="large" component={RouterLink} to="/learn" startIcon={<SchoolIcon />}>
          Learn a New Transformation
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <WidgetsIcon color="primary" sx={{ fontSize: '2.5rem', mr: 1.5 }} />
        <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
          Key Features
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: (theme) => theme.shadows[12],
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pt: 3,
                pb: 1
              }}>
                <Box sx={{
                  p: 2.5,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                  borderRadius: '50%',
                }}>
                  {React.cloneElement(feature.icon, { sx: { fontSize: '2.5rem', color: 'secondary.main' } })}
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2 }}>
                <Button 
                  size="medium" 
                  variant="contained" 
                  fullWidth
                  component={RouterLink} 
                  to={feature.link}
                  endIcon={<ArrowForwardIcon />}
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
          borderRadius: 2,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.15) : alpha(theme.palette.primary.light, 0.15),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoOutlinedIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: '1.75rem' }} />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            About TabulaX
          </Typography>
        </Box>
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
          TabulaX is a powerful tool designed to simplify and accelerate your data transformation and joining tasks. 
          By leveraging intelligent algorithms, it automatically understands and generates the necessary transformations 
          between columns, making your data preparation workflow significantly faster and more efficient.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Dashboard;
