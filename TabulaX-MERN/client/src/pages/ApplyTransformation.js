import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
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
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState(''); // Keep for detailed errors
  const [success, setSuccess] = useState('');

  const [savedTransformations, setSavedTransformations] = useState([]);
  const [selectedTransformation, setSelectedTransformation] = useState(''); // ID of the selected transformation
  const [transformationDetails, setTransformationDetails] = useState(null); // Full details of selected transformation (includes .code)
  
  const auth = useAuth();

  // States for single file upload and configuration for applying transformation
  const [fileForTransformation, setFileForTransformation] = useState(null); // The uploaded file object
  const [dataForTransformation, setDataForTransformation] = useState([]); // Parsed data from fileForTransformation
  const [columnsForTransformation, setColumnsForTransformation] = useState([]); // Columns from dataForTransformation
  const [selectedInputColumn, setSelectedInputColumn] = useState(''); // Name of the column to apply transformation to
  const [outputColumnName, setOutputColumnName] = useState(''); // Desired name for the new transformed column
  
  const [transformedData, setTransformedData] = useState([]); // Data after transformation is applied

  // --- Existing states that might be for other functionalities (e.g., learning, joining) ---
  // These might be refactored or removed if this page becomes solely for applying transformations
  const [dataSource, setDataSource] = useState('csv'); // Potentially simplify if only file upload for apply
  const [sourceFile, setSourceFile] = useState(null); // Potentially merge with fileForTransformation
  const [targetFile, setTargetFile] = useState(null);
  const [sourceData, setSourceData] = useState([]); // Potentially merge with dataForTransformation
  const [targetData, setTargetData] = useState([]);
  const [excelSourceFile, setExcelSourceFile] = useState(null);
  const [excelTargetFile, setExcelTargetFile] = useState(null);
  const [dbConfig, setDbConfig] = useState({
    host: '', port: '', user: '', password: '', database: '', query: '',
    uri: '', collection: '' 
  });
  const [sourceColumns, setSourceColumns] = useState([]); // Potentially merge with columnsForTransformation
  const [targetColumns, setTargetColumns] = useState([]);
  // const [selectedSourceColumn, setSelectedSourceColumn] = useState(''); // Merged to selectedInputColumn
  const [selectedTargetColumn, setSelectedTargetColumn] = useState('');
  // const [transformedColumnName, setTransformedColumnName] = useState(''); // Merged to outputColumnName
  const [maxDistanceThreshold, setMaxDistanceThreshold] = useState(3);
  const [joinedData, setJoinedData] = useState([]);
  // DB specific states (Mongo, MySQL) - keep for now, might be part of a larger component
  const [mongoURI, setMongoURI] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [externalMongoData, setExternalMongoData] = useState([]);
  const [isFetchingExternalMongo, setIsFetchingExternalMongo] = useState(false);
  const [externalMongoError, setExternalMongoError] = useState(null);
  const [mysqlHost, setMysqlHost] = useState(''); 
  const [mysqlUser, setMysqlUser] = useState('');
  const [mysqlPassword, setMysqlPassword] = useState('');
  const [mysqlDatabase, setMysqlDatabase] = useState('');
  const [mysqlPort, setMysqlPort] = useState('3306');
  const [mysqlTableName, setMysqlTableName] = useState('');
  const [externalMysqlData, setExternalMysqlData] = useState([]);
  const [isFetchingExternalMysql, setIsFetchingExternalMysql] = useState(false);
  const [externalMysqlError, setExternalMysqlError] = useState(null);
  // --- End of existing states ---

  const theme = useTheme(); // For dropzone style

  const steps = ['1. Select Transformation', '2. Upload Data & Configure Execution', '3. View Transformed Data'];

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
          // If no transformation is selected, or if the selected one is not in the new list, select the first one.
          if (!selectedTransformation || !response.data.transformations.find(t => String(t.id) === selectedTransformation)) {
            const firstTransformationId = String(response.data.transformations[0].id);
            setSelectedTransformation(firstTransformationId);
            fetchTransformationDetails(firstTransformationId); // Fetch details for the auto-selected one
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
  }, [auth.token, fetchTransformationDetails]); // Removed selectedTransformation from deps to avoid loop, rely on explicit fetchTransformationDetails call

  // Handler for selecting a transformation from the dropdown
  const handleTransformationChange = (event) => {
    const newId = event.target.value;
    setSelectedTransformation(newId);
    fetchTransformationDetails(newId); // Fetch details when selection changes
  };

  const onDropSingleFile = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileForTransformation(file);
      setError('');
      setSuccess(`File "${file.name}" selected.`);
      setTransformedData([]); // Clear previous results
      setSelectedInputColumn(''); // Reset column selection
      setOutputColumnName(''); // Reset output column name

      const reader = new FileReader();
      reader.onabort = () => setError('File reading was aborted.');
      reader.onerror = () => setError('File reading has failed.');
      reader.onload = () => {
        try {
          let parsedData;
          if (file.name.endsWith('.csv')) {
            // Try parsing with different delimiters
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
              
              // Check if parsing was successful
              if (result.errors.length === 0 && result.data.length > 0 && 
                  result.meta.fields && result.meta.fields.length > 0) {
                console.log(`Successfully parsed with delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}'`);
                parsedData = result.data;
                processData();
              } else {
                // Try the next delimiter
                console.log(`Failed with delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}', trying next...`);
                tryDelimiters(delimiters, index + 1);
              }
            };
            
            // Function to process the successfully parsed data
            const processData = () => {
              if (parsedData && parsedData.length > 0) {
                setDataForTransformation(parsedData);
                setColumnsForTransformation(Object.keys(parsedData[0]));
                if (Object.keys(parsedData[0]).length > 0) {
                  setSelectedInputColumn(Object.keys(parsedData[0])[0]); // Auto-select first column
                }
                setOutputColumnName(`transformed_${Object.keys(parsedData[0])[0] || 'column'}`);
              } else {
                setError('File is empty or could not be parsed.');
              }
            };
            
            // Start trying delimiters
            tryDelimiters([',', '\t', ';', '|', ':', ' ']);
            return; // Early return since we're handling the data processing in the tryDelimiters function
          } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
            const XLSX = require('xlsx');
            const workbook = XLSX.read(reader.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
            // Convert array of arrays to array of objects if header: 1 was used for dynamic headers
            if (parsedData.length > 0 && Array.isArray(parsedData[0])) {
                const headers = parsedData[0];
                const jsonData = parsedData.slice(1).map(row => {
                    let obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index];
                    });
                    return obj;
                });
                parsedData = jsonData;
            }
          } else {
            setError('Unsupported file type. Please upload CSV or Excel.');
            return;
          }
          
          if (parsedData && parsedData.length > 0) {
            setDataForTransformation(parsedData);
            setColumnsForTransformation(Object.keys(parsedData[0]));
            if (Object.keys(parsedData[0]).length > 0) {
                setSelectedInputColumn(Object.keys(parsedData[0])[0]); // Auto-select first column
            }
            setOutputColumnName(`transformed_${Object.keys(parsedData[0])[0] || 'column'}`); // Suggest an output column name
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
    if (!selectedTransformation || !transformationDetails || !transformationDetails.transformationCode) {
      setError('Please select a valid transformation first.');
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
      const response = await axios.post('/api/transformations/execute', 
        {
          tableData: dataForTransformation,
          transformationCode: transformationDetails.transformationCode,
          inputColumnName: selectedInputColumn,
          outputColumnName: outputColumnName.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTransformedData(response.data.data);
        setSuccess('Transformation applied successfully!');
        setActiveStep(2); // Move to results view
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

  const handleNext = () => {
    setError(''); // Clear errors when moving between steps
    if (activeStep === 0 && !selectedTransformation) {
        setError("Please select a transformation before proceeding.");
        return;
    }
    if (activeStep === 1 && (dataForTransformation.length === 0 || !selectedInputColumn || !outputColumnName)) {
        setError("Please upload data, select an input column, and specify an output column name before applying.");
        // Note: actual execution happens via a separate button in step 1's content
        // This check is more for proceeding to the 'View Results' step if we change flow
        // For now, let's allow proceeding to step 1 to configure, execution is manual.
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Select Transformation
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
            {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
            {transformationDetails && (
              <Paper elevation={2} sx={{ p: 2, mt: 2, backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f9f9f9' }}>
                <Typography variant="subtitle1" gutterBottom>Transformation Details:</Typography>
                <Typography variant="body2"><strong>Name:</strong> {transformationDetails.name}</Typography>
                <Typography variant="body2"><strong>Type:</strong> {transformationDetails.transformationType}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Code:</strong></Typography>
                <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.8rem' }}>
                  {transformationDetails.transformationCode || "// No code available"}
                </SyntaxHighlighter>
              </Paper>
            )}
          </Box>
        );
      case 1: // Upload Data & Configure Execution
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
          </Box>
        );
      case 2: // View Transformed Data
        const handleDownloadTransformed = () => {
          if (!transformedData || transformedData.length === 0) return;
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
        };
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>Transformed Data</Typography>
              {transformedData.length > 0 && (
                <Button variant="contained" color="primary" onClick={handleDownloadTransformed}>
                  Download Transformed Data
                </Button>
              )}
            </Box>
            {transformedData.length > 0 ? (
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
                      {transformedData.slice(0, 100).map((row, index) => ( // Display up to 100 rows for performance
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
            ) : (
              <Typography>No transformed data to display. Apply a transformation in the previous step.</Typography>
            )}
          </Box>
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
          Apply Transformation
        </Typography>

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
          {activeStep !== 1 && /* Hide Next button on step 1 as execution is manual */
            <Button onClick={handleNext} disabled={loading || (activeStep === 0 && !selectedTransformation)}>
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          }
        </Box>
      </Paper>
    </Container>
  );
};

export default ApplyTransformation;
