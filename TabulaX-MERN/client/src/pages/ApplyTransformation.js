import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper, 
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Slider,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Icon, 
  Tooltip 
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StorageIcon from '@mui/icons-material/Storage'; 
import DescriptionIcon from '@mui/icons-material/Description'; 
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

const dropzoneBaseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column', 
  alignItems: 'center',
  justifyContent: 'center', 
  padding: '30px',
  borderWidth: 2,
  borderRadius: (theme) => theme.shape.borderRadius, 
  borderColor: (theme) => theme.palette.divider, 
  borderStyle: 'dashed',
  backgroundColor: (theme) => theme.palette.background.paper, 
  color: (theme) => theme.palette.text.secondary,
  outline: 'none',
  transition: 'border .24s ease-in-out, background-color .24s ease-in-out',
  cursor: 'pointer',
  textAlign: 'center',
  minHeight: 150, 
};

const dropzoneActiveStyle = {
  borderColor: (theme) => theme.palette.primary.main,
  backgroundColor: (theme) => theme.palette.action.hover, 
};

const dropzoneAcceptStyle = {
  borderColor: (theme) => theme.palette.success.main,
  backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
};

const dropzoneRejectStyle = {
  borderColor: (theme) => theme.palette.error.main,
  backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
};

const getDropzoneStyle = (isDragActive, isDragAccept, isDragReject, theme) => {
  let style = { ...dropzoneBaseStyle };
  if (isDragActive) style = { ...style, ...dropzoneActiveStyle };
  if (isDragAccept) style = { ...style, ...dropzoneAcceptStyle };
  if (isDragReject) style = { ...style, ...dropzoneRejectStyle };
  
  Object.keys(style).forEach(key => {
    if (typeof style[key] === 'function') {
      style[key] = style[key](theme);
    }
  });
  return style;
};

const ApplyTransformation = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [success, setSuccess] = useState('');

  const [savedTransformations, setSavedTransformations] = useState([]);
  const [selectedTransformation, setSelectedTransformation] = useState('');
  const [transformationDetails, setTransformationDetails] = useState(null);
  
  const auth = useAuth();

  // States for single file upload and configuration for applying transformation
  const [fileForTransformation, setFileForTransformation] = useState(null);
  const [dataForTransformation, setDataForTransformation] = useState([]);
  const [columnsForTransformation, setColumnsForTransformation] = useState([]);
  const [selectedInputColumn, setSelectedInputColumn] = useState('');
  const [outputColumnName, setOutputColumnName] = useState('');
  
  const [transformedData, setTransformedData] = useState([]);

  const theme = useTheme();

  const steps = ['1. Select Transformation', '2. Upload Data, Configure & Execute'];

  const fetchTransformationDetails = useCallback(async (transformationId) => {
    if (!transformationId) {
      setTransformationDetails(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/transformations/${transformationId}`, {
        headers: { Authorization: `Bearer ${auth.token || localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setTransformationDetails(response.data.transformation);
      } else {
        setError(response.data.message || 'Failed to fetch transformation details');
        setTransformationDetails(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch transformation details');
      setTransformationDetails(null);
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  useEffect(() => {
    const fetchTransformations = async () => {
      const token = (auth && auth.token) ? auth.token : localStorage.getItem('token');
      if (!token) return;
      setLoading(true);
      try {
        const response = await axios.get('/api/transformations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.transformations && response.data.transformations.length > 0) {
          setSavedTransformations(response.data.transformations);
          if (!selectedTransformation || !response.data.transformations.find(t => String(t.id) === selectedTransformation)) {
            const firstTransformationId = String(response.data.transformations[0].id);
            setSelectedTransformation(firstTransformationId);
            fetchTransformationDetails(firstTransformationId);
          }
        } else {
          setSavedTransformations([]);
          setSelectedTransformation('');
          setTransformationDetails(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch saved transformations');
        setSavedTransformations([]);
        setSelectedTransformation('');
        setTransformationDetails(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTransformations();
  }, [auth.token, fetchTransformationDetails]);

  const handleTransformationChange = (event) => {
    const newId = event.target.value;
    setSelectedTransformation(newId);
    fetchTransformationDetails(newId);
  };

  const onDropSingleFile = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileForTransformation(file);
      setError('');
      setSuccess(`File "${file.name}" selected.`);
      setTransformedData([]);
      setSelectedInputColumn('');
      setOutputColumnName('');

      const reader = new FileReader();
      reader.onabort = () => setError('File reading was aborted.');
      reader.onerror = () => setError('File reading has failed.');
      reader.onload = () => {
        try {
          let parsedData;
          if (file.name.endsWith('.csv')) {
            const tryDelimiters = (delimiters, index = 0) => {
              if (index >= delimiters.length) {
                setError('Unable to parse CSV with any common delimiter. Please check your file format.');
                return;
              }
              
              const currentDelimiter = delimiters[index];
              console.log(`Trying delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}'`);
              
              const result = Papa.parse(reader.result, {
                header: true,
                skipEmptyLines: true,
                delimiter: currentDelimiter
              });
              
              if (result.errors.length === 0 && result.data.length > 0 && 
                  result.meta.fields && result.meta.fields.length > 0) {
                console.log(`Successfully parsed with delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}'`);
                parsedData = result.data;
                processData();
              } else {
                console.log(`Failed with delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}', trying next...`);
                tryDelimiters(delimiters, index + 1);
              }
            };
            
            const processData = () => {
              if (parsedData && parsedData.length > 0) {
                setDataForTransformation(parsedData);
                setColumnsForTransformation(Object.keys(parsedData[0]));
                if (Object.keys(parsedData[0]).length > 0) {
                  setSelectedInputColumn(Object.keys(parsedData[0])[0]);
                }
                setOutputColumnName(`transformed_${Object.keys(parsedData[0])[0] || 'column'}`);
              } else {
                setError('File is empty or could not be parsed.');
              }
            };
            
            tryDelimiters([',', '\t', ';', '|', ':', ' ']);
            return;
          } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
            // Note: This requires xlsx library to be installed
            // import * as XLSX from 'xlsx';
            // For now, we'll handle this as an error since XLSX is not imported
            setError('Excel file support requires the xlsx library. Please convert to CSV or add xlsx dependency.');
            return;
          } else {
            setError('Unsupported file type. Please upload CSV or Excel.');
            return;
          }
          
          if (parsedData && parsedData.length > 0) {
            setDataForTransformation(parsedData);
            setColumnsForTransformation(Object.keys(parsedData[0]));
            if (Object.keys(parsedData[0]).length > 0) {
                setSelectedInputColumn(Object.keys(parsedData[0])[0]);
            }
            setOutputColumnName(`transformed_${Object.keys(parsedData[0])[0] || 'column'}`);
          } else {
            setError('File is empty or could not be parsed.');
            setDataForTransformation([]);
            setColumnsForTransformation([]);
          }
        } catch (e) {
          setError('Error parsing file: ' + e.message);
          setDataForTransformation([]);
          setColumnsForTransformation([]);
        }
      };
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        reader.readAsBinaryString(file);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop: onDropSingleFile,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const dropzoneStyle = getDropzoneStyle(isDragActive, isDragAccept, isDragReject, theme);

  const handleExecuteTransformation = async () => {
    if (!selectedTransformation || !transformationDetails) {
      setError('Please select valid transformation details first.');
      return;
    }
    if (transformationDetails.transformationType !== 'General' && !transformationDetails.transformationCode) {
      setError('The selected transformation type requires a script, but it seems to be missing. Please check the transformation definition.');
      return;
    }
    if (dataForTransformation.length === 0) {
      setError('Please upload data to transform.');
      return;
    }
    if (!selectedInputColumn) {
      setError('Please select an input column to transform.');
      return;
    }
    if (!outputColumnName.trim()) {
      setError('Please provide a name for the output column.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setTransformedData([]);

    try {
      const token = auth.token || localStorage.getItem('token');
      const payload = {
        tableData: dataForTransformation,
        transformationId: selectedTransformation,
        transformationType: transformationDetails.transformationType,
        inputColumnName: selectedInputColumn,
        outputColumnName: outputColumnName.trim(),
      };

      if (transformationDetails.transformationType !== 'General' && transformationDetails.transformationCode) {
        payload.transformationCode = transformationDetails.transformationCode;
      }

      const response = await axios.post('/api/transformations/execute',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTransformedData(response.data.data);
        setSuccess('Transformation executed successfully!');
      } else {
        setError(response.data.message || 'Failed to apply transformation.');
        setErrorDetails(response.data.details || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while applying the transformation.');
      setErrorDetails(err.response?.data?.details || '');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    setSuccess('');
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleNext = () => {
    setError('');
    setSuccess('');
    if (activeStep === 0) {
      if (!selectedTransformation) {
        setError('Please select a transformation first.');
        return;
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      navigate('/dashboard');
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Select a Saved Transformation</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="select-transformation-label">Transformation</InputLabel>
              <Select
                labelId="select-transformation-label"
                value={selectedTransformation}
                label="Transformation"
                onChange={handleTransformationChange}
                disabled={loading || savedTransformations.length === 0}
              >
                {savedTransformations.length === 0 && <MenuItem value="" disabled>No transformations saved</MenuItem>}
                {savedTransformations.map((transform) => (
                  <MenuItem key={transform.id} value={String(transform.id)}>
                    {transform.name} (Type: {transform.transformationType || 'N/A'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loading && !transformationDetails && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress /></Box>}
            {transformationDetails && (
              <Card elevation={2} sx={{ mt: 3 }}>
                <CardHeader 
                  title={transformationDetails.name || 'Transformation Details'}
                  subheader={`Type: ${transformationDetails.transformationType || 'N/A'}`}
                />
                <CardContent>
                  {/* Description Section */}
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Description:</Typography>
                  {transformationDetails.transformationType === 'General' && transformationDetails.description ? (
                    <Box sx={{
                      p: 1.5,
                      mb: 2,
                      borderRadius: 1,
                      backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.2) : alpha(theme.palette.primary.light, 0.2),
                      border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light}`
                    }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {transformationDetails.description}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" paragraph sx={{ color: transformationDetails.description ? 'text.primary' : 'text.secondary' }}>
                      {transformationDetails.description || 'No description provided.'}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Code Section */}
                  {transformationDetails.transformationCode && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Transformation Logic/Code:</Typography>
                      <SyntaxHighlighter 
                        language="python" 
                        style={vscDarkPlus} 
                        customStyle={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.8rem', borderRadius: '4px' }}
                        showLineNumbers
                      >
                        {transformationDetails.transformationCode}
                      </SyntaxHighlighter>
                    </Box>
                  )}
                  
                  {/* Examples Section */}
                  {transformationDetails.sourceExamples && transformationDetails.sourceExamples.length > 0 && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Examples:</Typography>
                      <TableContainer component={Paper} elevation={1} sx={{ maxHeight: 200 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'medium' }}>Source Example</TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>Target Example</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {transformationDetails.sourceExamples.map((source, index) => (
                              <TableRow key={index}>
                                <TableCell>{source}</TableCell>
                                <TableCell>{transformationDetails.targetExamples?.[index] || ''}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Upload Data File (CSV/Excel)</Typography>
            <Paper {...getRootProps({ style: dropzoneStyle })} elevation={isDragActive ? 4 : 1} sx={{ mb: 2}}>
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, mb: 1, color: isDragAccept ? 'success.main' : (isDragReject ? 'error.main' : 'action.active') }} />
              {isDragActive ? (
                <Typography>Drop the file here ...</Typography>
              ) : (
                <Typography>Drag 'n' drop a CSV or Excel file here, or click to select file</Typography>
              )}
              {fileForTransformation && <Typography sx={{mt:1, color: 'success.main'}}><CheckCircleOutlineIcon fontSize='small' sx={{verticalAlign: 'middle'}}/> {fileForTransformation.name}</Typography>}
            </Paper>

            {dataForTransformation.length > 0 && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="select-input-column-label">Input Column to Transform</InputLabel>
                    <Select
                      labelId="select-input-column-label"
                      value={selectedInputColumn}
                      label="Input Column to Transform"
                      onChange={(e) => setSelectedInputColumn(e.target.value)}
                    >
                      {columnsForTransformation.map((colName) => (
                        <MenuItem key={colName} value={colName}>{colName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Output Column Name"
                    value={outputColumnName}
                    onChange={(e) => setOutputColumnName(e.target.value)}
                    placeholder="e.g., transformed_column"
                  />
                </Grid>
              </Grid>
            )}
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleExecuteTransformation}
              disabled={loading || dataForTransformation.length === 0 || !selectedInputColumn || !outputColumnName.trim() || !selectedTransformation}
              sx={{ mt: 3, display: dataForTransformation.length > 0 ? 'inline-flex' : 'none' }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'inherit'}} /> : 'Execute Transformation'}
            </Button>

            {transformedData.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Transformed Data</Typography>
                  <Button variant="contained" color="primary" onClick={() => {
                    const headers = Object.keys(transformedData[0]);
                    const csvRows = [headers.join(',')];
                    for (const row of transformedData) {
                      const values = headers.map(h => {
                        const val = row[h];
                        if (val === null || val === undefined) return '';
                        const str = String(val).replace(/"/g, '""');
                        return /[",\n]/.test(str) ? `"${str}"` : str;
                      });
                      csvRows.push(values.join(','));
                    }
                    const csvContent = csvRows.join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'transformed_data.csv');
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  }}>
                    Download Transformed Data
                  </Button>
                </Box>
                <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="sticky table">
                      <TableHead>
                        <TableRow>
                          {Object.keys(transformedData[0]).map((key) => (
                            <TableCell key={key} sx={{ fontWeight: 'bold', backgroundColor: theme.palette.background.default }}>{key}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transformedData.slice(0, 100).map((row, index) => (
                          <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                            {Object.values(row).map((value, i) => (
                              <TableCell key={i}>{String(value)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {transformedData.length > 100 && <Typography sx={{p:1, textAlign:'center', fontSize:'0.9rem'}}>Showing first 100 rows.</Typography>}
                </Paper>
              </Box>
            )}
          </Box>
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Title - Moved outside the main Paper */}
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
        Apply Transformation
      </Typography>

      {/* Main content area with Stepper and Steps */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {setError(''); setErrorDetails('');}}>
            {error}
            {errorDetails && <Typography variant="caption" display="block" sx={{mt:1}}>Details: {errorDetails}</Typography>}
          </Alert>
        )}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 3, mt:3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            color="inherit"
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={handleNext} disabled={loading || (activeStep === 0 && !selectedTransformation)}>
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ApplyTransformation;