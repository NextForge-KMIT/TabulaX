import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Container,
  Box,
  Chip,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import InfoIcon from '@mui/icons-material/Info';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SavedTransformations = () => {
  const navigate = useNavigate();
  const [transformations, setTransformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTransformation, setSelectedTransformation] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch saved transformations on component mount
  useEffect(() => {
    const fetchTransformations = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found in localStorage. User may not be logged in.');
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching saved transformations...');
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get('/api/transformations', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.success) {
          console.log('Full API response:', response.data);
          if (Array.isArray(response.data.transformations)) {
            setTransformations(response.data.transformations);
            console.log('Set transformations:', response.data.transformations);
          } else {
            setTransformations([]);
            setError('API returned no valid transformations array');
            console.error('API returned unexpected structure:', response.data);
          }
        } else {
          setError('Failed to fetch transformations');
          console.error('API response error:', response.data);
        }
      } catch (err) {
        setError('Error fetching transformations');
        console.error('Error fetching transformations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransformations();
  }, []);

  // Handle opening delete confirmation dialog
  const handleOpenDeleteDialog = (transformation) => {
    setSelectedTransformation(transformation);
    setDeleteDialogOpen(true);
  };

  // Handle closing delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedTransformation(null);
  };

  // Handle opening details dialog
  const handleOpenDetailsDialog = (transformation) => {
    setSelectedTransformation(transformation);
    setDetailsDialogOpen(true);
  };

  // Handle closing details dialog
  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedTransformation(null);
  };

  // Handle deleting a transformation
  const handleDeleteTransformation = async () => {
    console.log('Deleting transformation:', selectedTransformation?.id);
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/transformations/${selectedTransformation?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log('Deleted:', selectedTransformation?.id);
        setTransformations(transformations.filter(t => t.id !== selectedTransformation.id));
        setSuccess('Transformation deleted successfully');
        handleCloseDeleteDialog();
      } else {
        setError('Failed to delete transformation');
      }
    } catch (err) {
      setError('Error deleting transformation');
      console.error('Error deleting transformation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle applying a transformation
  const handleApplyTransformation = (transformationId) => {
    navigate('/apply', { state: { selectedTransformationId: transformationId } });
  };

  // Get chip color based on transformation type
  const getChipColor = (type) => {
    switch (type) {
      case 'String-based':
        return 'primary';
      case 'Numerical':
        return 'success';
      case 'Algorithmic':
        return 'warning';
      case 'General':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Handle success/error message dismissal
  const handleMessageDismiss = () => {
    setSuccess('');
    setError('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Saved Transformations
      </Typography>
      <Typography variant="body1" paragraph align="center">
        View and manage your saved transformations.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={handleMessageDismiss}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={handleMessageDismiss}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : !Array.isArray(transformations) || transformations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No saved transformations found
          </Typography>
          <Typography variant="body1" paragraph>
            You haven't saved any transformations yet. Learn a new transformation to get started.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/learn')}
          >
            Learn Transformation
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {transformations.map((transformation) => (
            <Grid item xs={12} md={6} lg={4} key={transformation.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="h2" noWrap>
                      {transformation.name || `Transformation ${transformation.id}`}
                    </Typography>
                    <Chip 
                      label={transformation.transformationType || 'General'} 
                      size="small" 
                      color={getChipColor(transformation.transformationType)}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: '40px', overflow: 'hidden' }}>
                    {transformation.description || 'No description provided'}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="caption" display="block" color="text.secondary">
                    Created: {new Date(transformation.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Example:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ width: '48%' }}>
                        <Typography variant="caption" fontWeight="bold">Source</Typography>
                        <Typography variant="body2" noWrap>
                          {(transformation.sourceExamples && transformation.sourceExamples[0]) || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ width: '48%' }}>
                        <Typography variant="caption" fontWeight="bold">Target</Typography>
                        <Typography variant="body2" noWrap>
                          {(transformation.targetExamples && transformation.targetExamples[0]) || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<InfoIcon />}
                    onClick={() => handleOpenDetailsDialog(transformation)}
                  >
                    Details
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleApplyTransformation(transformation.id)}
                    color="primary"
                  >
                    Apply
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleOpenDeleteDialog(transformation)}
                    color="error"
                    sx={{ marginLeft: 'auto' }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the transformation "{selectedTransformation?.name || selectedTransformation?.id}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteTransformation} color="error" autoFocus disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transformation Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedTransformation?.name || selectedTransformation?.id}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {selectedTransformation?.description || 'No description provided'}
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Transformation Type:
            </Typography>
            <Chip 
              label={selectedTransformation?.transformationType || 'General'} 
              color={getChipColor(selectedTransformation?.transformationType)}
            />
          </Box>
          
          {selectedTransformation?.transformationCode && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Transformation Code:
              </Typography>
              <SyntaxHighlighter language="python" style={vscDarkPlus} showLineNumbers>
                {selectedTransformation.transformationCode}
              </SyntaxHighlighter>
            </Box>
          )}
          
          {selectedTransformation?.sourceExamples && selectedTransformation?.targetExamples && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Example Transformations:
              </Typography>
              <Paper sx={{ p: 2 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Source</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransformation.sourceExamples.map((source, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {source}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {selectedTransformation.targetExamples[index] || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Paper>
            </Box>
          )}
          
          <Typography variant="caption" display="block" color="text.secondary">
            Created: {selectedTransformation && new Date(selectedTransformation.createdAt).toLocaleString()}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
          <Button 
            onClick={() => {
              handleCloseDetailsDialog();
              handleApplyTransformation(selectedTransformation?.id);
            }} 
            color="primary"
          >
            Apply This Transformation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SavedTransformations;