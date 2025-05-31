import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx'; // Import xlsx library
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const LearnTransformation = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false); // General loading for classification/saving
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [success, setSuccess] = useState(false);
  const [transformationDetails, setTransformationDetails] = useState(null); // Not currently used, but was in original code

  // --- Data Source Type State ---
  const [sourceInputType, setSourceInputType] = useState('file'); // 'file', 'mongodb', 'mysql'
  const [targetInputType, setTargetInputType] = useState('file'); // 'file', 'mongodb', 'mysql'

  // --- File Upload State (Existing) ---
  const [sourceFile, setSourceFile] = useState(null);
  const [targetFile, setTargetFile] = useState(null);
  const [sourceData, setSourceData] = useState([]); // Data from source file
  const [targetData, setTargetData] = useState([]); // Data from target file
  const [sourceColumns, setSourceColumns] = useState([]); // Columns from source file
  const [targetColumns, setTargetColumns] = useState([]); // Columns from target file

  // --- MongoDB State ---
  const [mongoDBSourceURI, setMongoDBSourceURI] = useState('');
  const [mongoDBSourceCollection, setMongoDBSourceCollection] = useState('');
  const [mongoDBTargetURI, setMongoDBTargetURI] = useState('');
  const [mongoDBTargetCollection, setMongoDBTargetCollection] = useState('');

  // --- MySQL State ---
  const [mySQLSourceHost, setMySQLSourceHost] = useState('');
  const [mySQLSourceUser, setMySQLSourceUser] = useState('');
  const [mySQLSourcePassword, setMySQLSourcePassword] = useState('');
  const [mySQLSourceDatabase, setMySQLSourceDatabase] = useState('');
  const [mySQLSourcePort, setMySQLSourcePort] = useState('3306');
  const [mySQLSourceTable, setMySQLSourceTable] = useState('');

  const [mySQLTargetHost, setMySQLTargetHost] = useState('');
  const [mySQLTargetUser, setMySQLTargetUser] = useState('');
  const [mySQLTargetPassword, setMySQLTargetPassword] = useState('');
  const [mySQLTargetDatabase, setMySQLTargetDatabase] = useState('');
  const [mySQLTargetPort, setMySQLTargetPort] = useState('3306');
  const [mySQLTargetTable, setMySQLTargetTable] = useState('');

  // --- DB Fetched Data State ---
  const [sourceDBData, setSourceDBData] = useState([]);
  const [targetDBData, setTargetDBData] = useState([]);
  const [sourceDBColumns, setSourceDBColumns] = useState([]);
  const [targetDBColumns, setTargetDBColumns] = useState([]);

  // --- DB Fetching Status State ---
  const [isSourceDBLoading, setIsSourceDBLoading] = useState(false);
  const [isTargetDBLoading, setIsTargetDBLoading] = useState(false);
  const [sourceDBError, setSourceDBError] = useState('');
  const [targetDBError, setTargetDBError] = useState('');

  // --- Column Selection State (Existing, may need to adapt source of columns) ---
  const [selectedSourceColumn, setSelectedSourceColumn] = useState('');
  const [selectedTargetColumn, setSelectedTargetColumn] = useState('');

  // --- Transformation Result State (Existing) ---
  const [transformationType, setTransformationType] = useState('');
  const [transformationCode, setTransformationCode] = useState('');

  // --- Save Transformation State (Existing) ---
  const [transformationName, setTransformationName] = useState('');
  const [transformationDescription, setTransformationDescription] = useState('');

  // Steps for the stepper
  const steps = ['Provide Data', 'Select Columns', 'Learn Transformation', 'Save Transformation']; // Renamed first step

  // Dropzone configuration for source file
  const sourceDropzone = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (!file) return;

      setSourceFile(file);
      setSourceData([]);
      setSourceColumns([]);
      setSelectedSourceColumn('');
      setError(''); 
      setSourceDBError('');

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target.result;
          if (file.name.endsWith('.csv')) {
            // Try parsing with different delimiters
            const tryDelimiters = (delimiters, index = 0) => {
              if (index >= delimiters.length) {
                setError('Unable to parse CSV with any common delimiter. Please check your file format.');
                return;
              }
              
              const currentDelimiter = delimiters[index];
              console.log(`Trying delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}'`);
              
              Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                delimiter: currentDelimiter,
                complete: (results) => {
                  // Check if parsing was successful
                  if (results.errors.length === 0 && results.data.length > 0 && 
                      results.meta.fields && results.meta.fields.length > 0) {
                    console.log(`Successfully parsed with delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}'`);
                    setSourceData(results.data);
                    setSourceColumns(results.meta.fields || []);
                  } else {
                    // Try the next delimiter
                    console.log(`Failed with delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}', trying next...`);
                    tryDelimiters(delimiters, index + 1);
                  }
                },
                error: () => {
                  // Try the next delimiter
                  tryDelimiters(delimiters, index + 1);
                }
              });
            };
            
            // Start trying delimiters
            tryDelimiters([',', '\t', ';', '|', ':', ' ']);
          } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(fileContent, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
              const headers = jsonData[0];
              const dataRows = jsonData.slice(1).map(rowArray => {
                let rowObject = {};
                headers.forEach((header, index) => {
                  rowObject[header] = rowArray[index];
                });
                return rowObject;
              });
              setSourceData(dataRows);
              setSourceColumns(headers);
            } else {
              setError('Source Excel file is empty or has no headers.');
              setSourceData([]);
              setSourceColumns([]);
            }
          } else {
            setError('Unsupported file type for source. Please use CSV or Excel.');
          }
        } catch (e) {
          console.error('File parsing error:', e);
          setError(`Error processing source file: ${e.message}`);
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        reader.readAsBinaryString(file);
      } else {
        setError('Unsupported file type for source. Please use CSV or Excel.');
      }
    }
  });

  // Dropzone configuration for target file
  const targetDropzone = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (!file) return;

      setTargetFile(file);
      setTargetData([]);
      setTargetColumns([]);
      setSelectedTargetColumn('');
      setError('');
      setTargetDBError('');

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target.result;
          if (file.name.endsWith('.csv')) {
            // Try parsing with different delimiters
            const tryDelimiters = (delimiters, index = 0) => {
              if (index >= delimiters.length) {
                setError('Unable to parse CSV with any common delimiter. Please check your file format.');
                return;
              }
              
              const currentDelimiter = delimiters[index];
              console.log(`Trying delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}'`);
              
              Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                delimiter: currentDelimiter,
                complete: (results) => {
                  // Check if parsing was successful
                  if (results.errors.length === 0 && results.data.length > 0 && 
                      results.meta.fields && results.meta.fields.length > 0) {
                    console.log(`Successfully parsed with delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}'`);
                    setTargetData(results.data);
                    setTargetColumns(results.meta.fields || []);
                  } else {
                    // Try the next delimiter
                    console.log(`Failed with delimiter: '${currentDelimiter === '\t' ? 'tab' : currentDelimiter}', trying next...`);
                    tryDelimiters(delimiters, index + 1);
                  }
                },
                error: () => {
                  // Try the next delimiter
                  tryDelimiters(delimiters, index + 1);
                }
              });
            };
            
            // Start trying delimiters
            tryDelimiters([',', '\t', ';', '|', ':', ' ']);
          } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(fileContent, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length > 0) {
              const headers = jsonData[0];
              const dataRows = jsonData.slice(1).map(rowArray => {
                let rowObject = {};
                headers.forEach((header, index) => {
                  rowObject[header] = rowArray[index];
                });
                return rowObject;
              });
              setTargetData(dataRows);
              setTargetColumns(headers);
            } else {
              setError('Target Excel file is empty or has no headers.');
              setTargetData([]);
              setTargetColumns([]);
            }
          } else {
            setError('Unsupported file type for target. Please use CSV or Excel.');
          }
        } catch (e) {
          console.error('File parsing error:', e);
          setError(`Error processing target file: ${e.message}`);
        }
      };
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        reader.readAsBinaryString(file);
      } else {
        setError('Unsupported file type for target. Please use CSV or Excel.');
      }
    }
  });

  // Handle data source type change
  const handleSourceInputTypeChange = (event) => {
    setSourceInputType(event.target.value);
    // Reset relevant states when changing source type
    setSourceFile(null);
    setSourceData([]);
    setSourceColumns([]);
    setSelectedSourceColumn('');
    setSourceDBData([]);
    setSourceDBColumns([]);
    setSourceDBError('');
    setError(''); // Clear general error
  };

  const handleTargetInputTypeChange = (event) => {
    setTargetInputType(event.target.value);
    // Reset relevant states when changing target type
    setTargetFile(null);
    setTargetData([]);
    setTargetColumns([]);
    setSelectedTargetColumn('');
    setTargetDBData([]);
    setTargetDBColumns([]);
    setTargetDBError('');
    setError(''); // Clear general error
  };

  // Function to handle fetching data from MongoDB or MySQL
  const handleDBFetch = async (dataType, dbType) => {
    const isSource = dataType === 'source';
    const setLoading = isSource ? setIsSourceDBLoading : setIsTargetDBLoading;
    const setErrorState = isSource ? setSourceDBError : setTargetDBError;
    const setData = isSource ? setSourceDBData : setTargetDBData;
    const setColumns = isSource ? setSourceDBColumns : setTargetDBColumns;

    setLoading(true);
    setErrorState('');
    setData([]);
    setColumns([]);

    let payload = {};
    let url = '';
    if (dbType === 'mongodb') {
      url = '/api/data-sources/mongodb/fetch';
      payload = {
        mongoURI: isSource ? mongoDBSourceURI : mongoDBTargetURI,
        collectionName: isSource ? mongoDBSourceCollection : mongoDBTargetCollection,
      };
      if (!payload.mongoURI || !payload.collectionName) {
        setErrorState('MongoDB URI and Collection Name are required.');
        setLoading(false);
        return;
      }
    } else if (dbType === 'mysql') {
      url = '/api/data-sources/mysql/fetch';
      payload = {
        host: isSource ? mySQLSourceHost : mySQLTargetHost,
        user: isSource ? mySQLSourceUser : mySQLTargetUser,
        password: isSource ? mySQLSourcePassword : mySQLTargetPassword,
        database: isSource ? mySQLSourceDatabase : mySQLTargetDatabase,
        port: parseInt(isSource ? mySQLSourcePort : mySQLTargetPort, 10),
        tableName: isSource ? mySQLSourceTable : mySQLTargetTable,
      };
      if (!payload.host || !payload.user || !payload.database || !payload.tableName) {
        setErrorState('MySQL Host, User, Database, and Table Name are required.');
        setLoading(false);
        return;
      }
    }
    try {
      const response = await axios.post(url, payload);
      if (response.status === 200 && Array.isArray(response.data.data)) {
        const fetchedData = response.data.data;
        setData(fetchedData);
        if (fetchedData.length > 0) {
          setColumns(Object.keys(fetchedData[0]));
        } else {
          setColumns([]);
          setErrorState('No data returned from the database.');
        }
      } else {
        setErrorState(response.data.message || `Failed to fetch ${dbType} data.`);
      }
    } catch (err) {
      console.error(`Error fetching ${dbType} data:`, err);
      setErrorState(err.response?.data?.message || err.message || `An unknown error occurred while fetching ${dbType} data.`);
    }
    setLoading(false);
  };


  // Handle source column selection
  const handleSourceColumnChange = (event) => {
    setSelectedSourceColumn(event.target.value);
  };

  // Handle target column selection
  const handleTargetColumnChange = (event) => {
    setSelectedTargetColumn(event.target.value);
  };

  // Handle learning transformation
  const handleLearnTransformation = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorDetails('');
      setSuccess(false);
      // setTransformationDetails(null); // This state is not used for setting

      // Validate inputs
      if (!selectedSourceColumn || !selectedTargetColumn) {
        setError('Please select both source and target columns');
        setLoading(false);
        return;
      }

      let finalSourceDataForAPI, finalTargetDataForAPI;

      // Determine source data for API
      if (sourceInputType === 'file') {
        if (sourceData.length === 0) {
          setError('Source file data is empty or not loaded correctly.');
          setLoading(false);
          return;
        }
        finalSourceDataForAPI = sourceData.map(row => row[selectedSourceColumn]).filter(val => val !== undefined && val !== null && val !== '');
      } else {
        if (sourceDBData.length === 0) {
          setError('Source database data is empty or not fetched correctly.');
          setLoading(false);
          return;
        }
        finalSourceDataForAPI = sourceDBData.map(row => row[selectedSourceColumn]).filter(val => val !== undefined && val !== null && val !== '');
      }

      // Determine target data for API
      if (targetInputType === 'file') {
        if (targetData.length === 0) {
          setError('Target file data is empty or not loaded correctly.');
          setLoading(false);
          return;
        }
        finalTargetDataForAPI = targetData.map(row => row[selectedTargetColumn]).filter(val => val !== undefined && val !== null && val !== '');
      } else {
        if (targetDBData.length === 0) {
          setError('Target database data is empty or not fetched correctly.');
          setLoading(false);
          return;
        }
        finalTargetDataForAPI = targetDBData.map(row => row[selectedTargetColumn]).filter(val => val !== undefined && val !== null && val !== '');
      }

      // Ensure we have data to work with
      if (finalSourceDataForAPI.length === 0 || finalTargetDataForAPI.length === 0) {
        setError('Selected columns do not contain enough data, or data from the chosen source is missing.');
        setLoading(false);
        return;
      }

      // Call the API to classify transformation
      const response = await axios.post('/api/transformations/classify', {
        sourceData: finalSourceDataForAPI,
        targetData: finalTargetDataForAPI
      });

      if (response.data.success) {
        setTransformationType(response.data.transformationType);
        setTransformationCode(response.data.transformationCode || '');
      setTransformationDetails(response.data.transformation_details || null);
        setSuccess(`Transformation classified as: ${response.data.transformationType}`);
        setActiveStep(2); // Move to the next step
      } else {
        setError('Failed to classify transformation');
      }
    } catch (err) {
      console.error('Error learning transformation:', err);
      let errorMessage = 'Error learning transformation. Please try again.';
      let errorDetailsMessage = '';
      
      // Extract more detailed error information if available
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        if (err.response.data.error) {
          errorDetailsMessage = err.response.data.error;
        }
        // If we have raw results from Python, show them for debugging
        if (err.response.data.rawResults) {
          errorDetailsMessage += '\nRaw output: ' + JSON.stringify(err.response.data.rawResults);
        }
      }
      
      setError(errorMessage);
      setErrorDetails(errorDetailsMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle saving transformation
  const handleSaveTransformation = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorDetails('');
      setSuccess(false);
      // setTransformationDetails(null); // This state is not used for setting

      // Validate inputs
      if (!transformationName) {
        setError('Please enter a name for the transformation');
        setLoading(false);
        return;
      }

      let finalSourceDataForAPI, finalTargetDataForAPI;

      // Determine source data for API
      if (sourceInputType === 'file') {
        if (sourceData.length === 0) {
          setError('Source file data is empty or not loaded correctly.');
          setLoading(false);
          return;
        }
        finalSourceDataForAPI = sourceData.map(row => row[selectedSourceColumn]).filter(val => val !== undefined && val !== null && val !== '');
      } else {
        if (sourceDBData.length === 0) {
          setError('Source database data is empty or not fetched correctly.');
          setLoading(false);
          return;
        }
        finalSourceDataForAPI = sourceDBData.map(row => row[selectedSourceColumn]).filter(val => val !== undefined && val !== null && val !== '');
      }

      // Determine target data for API
      if (targetInputType === 'file') {
        if (targetData.length === 0) {
          setError('Target file data is empty or not loaded correctly.');
          setLoading(false);
          return;
        }
        finalTargetDataForAPI = targetData.map(row => row[selectedTargetColumn]).filter(val => val !== undefined && val !== null && val !== '');
      } else {
        if (targetDBData.length === 0) {
          setError('Target database data is empty or not fetched correctly.');
          setLoading(false);
          return;
        }
        finalTargetDataForAPI = targetDBData.map(row => row[selectedTargetColumn]).filter(val => val !== undefined && val !== null && val !== '');
      }

      // Extract example data for saving
      const sourceExamples = finalSourceDataForAPI.slice(0, 10);
      const targetExamples = finalTargetDataForAPI.slice(0, 10);

      // Call the API to save transformation
      const response = await axios.post('/api/transformations', {
        name: transformationName,
        description: transformationDescription,
        transformationType,
        transformationCode,
        sourceExamples,
        targetExamples
      });

      if (response.data.success) {
        setSuccess('Transformation saved successfully');
        setTimeout(() => {
          navigate('/saved');
        }, 2000);
      } else {
        setError('Failed to save transformation');
      }
    } catch (err) {
      console.error('Error saving transformation:', err);
      let errorMessage = 'Error saving transformation. Please try again.';
      let errorDetailsMessage = '';
      
      // Extract more detailed error information if available
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        if (err.response.data.error) {
          errorDetailsMessage = err.response.data.error;
        }
        // If we have raw results from Python, show them for debugging
        if (err.response.data.rawResults) {
          errorDetailsMessage += '\nRaw output: ' + JSON.stringify(err.response.data.rawResults);
        }
      }
      
      setError(errorMessage);
      setErrorDetails(errorDetailsMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep === 1) {
      handleLearnTransformation();
    } else if (activeStep === 3) {
      handleSaveTransformation();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Define column getter functions to handle multiple data sources
  const getAvailableSourceColumns = () => {
    if (sourceInputType === 'file' && sourceColumns.length > 0) {
      return sourceColumns;
    } else if ((sourceInputType === 'mongodb' || sourceInputType === 'mysql') && sourceDBColumns.length > 0) {
      return sourceDBColumns;
    }
    return [];
  };

  const getAvailableTargetColumns = () => {
    if (targetInputType === 'file' && targetColumns.length > 0) {
      return targetColumns;
    } else if ((targetInputType === 'mongodb' || targetInputType === 'mysql') && targetDBColumns.length > 0) {
      return targetDBColumns;
    }
    return [];
  };

  // Get available columns for UI rendering
  const availableSourceColumns = getAvailableSourceColumns();
  const availableTargetColumns = getAvailableTargetColumns();

  // Step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Provide Data
        return (
          <Box>
            {/* Source Type Selection */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Source Data Type</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="source-input-type-label">Source Type</InputLabel>
                    <Select
                      labelId="source-input-type-label"
                      id="source-input-type"
                      value={sourceInputType}
                      label="Source Type"
                      onChange={handleSourceInputTypeChange}
                    >
                      <MenuItem value="file">File Upload (CSV/Excel)</MenuItem>
                      <MenuItem value="mongodb">MongoDB</MenuItem>
                      <MenuItem value="mysql">MySQL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Source MongoDB Options */}
            {sourceInputType === 'mongodb' && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>MongoDB Source Details</Typography>
                <TextField
                  label="MongoDB URI"
                  fullWidth
                  value={mongoDBSourceURI}
                  onChange={(e) => setMongoDBSourceURI(e.target.value)}
                  sx={{ mb: 1 }}
                  placeholder="mongodb://username:password@host:port/database"
                  helperText="Example: mongodb://localhost:27017/mydb"
                />
                <TextField
                  label="Collection Name"
                  fullWidth
                  value={mongoDBSourceCollection}
                  onChange={(e) => setMongoDBSourceCollection(e.target.value)}
                  sx={{ mb: 1 }}
                  placeholder="collection_name"
                />
                <Button 
                  variant="contained" 
                  onClick={() => handleDBFetch('source', 'mongodb')}
                  disabled={isSourceDBLoading || !mongoDBSourceURI || !mongoDBSourceCollection}
                  title={!mongoDBSourceURI || !mongoDBSourceCollection ? 'Please fill both URI and Collection Name' : ''}
                  sx={{ mt: 1 }}
                >
                  {isSourceDBLoading ? <CircularProgress size={24} /> : 'Fetch Source MongoDB Data'}
                </Button>
                {sourceDBError && <Alert severity="error" sx={{ mt: 1 }}>{sourceDBError}</Alert>}
              </Paper>
            )}
            
            {/* Source MySQL Options */}
            {sourceInputType === 'mysql' && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>MySQL Source Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Host"
                      fullWidth
                      value={mySQLSourceHost}
                      onChange={(e) => setMySQLSourceHost(e.target.value)}
                      sx={{ mb: 1 }}
                      placeholder="localhost"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Port"
                      fullWidth
                      value={mySQLSourcePort}
                      onChange={(e) => setMySQLSourcePort(e.target.value)}
                      sx={{ mb: 1 }}
                      placeholder="3306"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Database"
                      fullWidth
                      value={mySQLSourceDatabase}
                      onChange={(e) => setMySQLSourceDatabase(e.target.value)}
                      sx={{ mb: 1 }}
                      placeholder="mydatabase"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Table"
                      fullWidth
                      value={mySQLSourceTable}
                      onChange={(e) => setMySQLSourceTable(e.target.value)}
                      sx={{ mb: 1 }}
                      placeholder="mytable"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Username"
                      fullWidth
                      value={mySQLSourceUser}
                      onChange={(e) => setMySQLSourceUser(e.target.value)}
                      sx={{ mb: 1 }}
                      placeholder="root"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Password"
                      fullWidth
                      type="password"
                      value={mySQLSourcePassword}
                      onChange={(e) => setMySQLSourcePassword(e.target.value)}
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                </Grid>
                <Button 
                  variant="contained" 
                  onClick={() => handleDBFetch('source', 'mysql')}
                  disabled={isSourceDBLoading || !mySQLSourceHost || !mySQLSourceUser || !mySQLSourceDatabase || !mySQLSourceTable}
                  title={!mySQLSourceHost || !mySQLSourceUser || !mySQLSourceDatabase || !mySQLSourceTable ? 'Please fill all required fields' : ''}
                  sx={{ mt: 1 }}
                >
                  {isSourceDBLoading ? <CircularProgress size={24} /> : 'Fetch Source MySQL Data'}
                </Button>
                {sourceDBError && <Alert severity="error" sx={{ mt: 1 }}>{sourceDBError}</Alert>}
              </Paper>
            )}

            {/* Source File Upload */}
            {sourceInputType === 'file' && (
              <Paper
                {...sourceDropzone.getRootProps()}
                sx={{
                  p: 3,
                  mb: 2,
                  border: '2px dashed #cccccc',
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <input {...sourceDropzone.getInputProps()} />
                {sourceFile ? (
                  <Typography>{sourceFile.name}</Typography>
                ) : (
                  <Typography>
                    Drag & drop source CSV/Excel file, or click to select
                  </Typography>
                )}
              </Paper>
            )}

          {/* Source Data Preview */}
          {(sourceInputType === 'file' && sourceData.length > 0) || ((sourceInputType === 'mongodb' || sourceInputType === 'mysql') && sourceDBData.length > 0) ? (
            <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', mb:2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Source Data Preview (First 5 rows)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {(sourceInputType === 'file' ? sourceColumns : sourceDBColumns).map((col) => (
                      <TableCell key={col}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sourceInputType === 'file' ? sourceData : sourceDBData).slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      {(sourceInputType === 'file' ? sourceColumns : sourceDBColumns).map((col) => (
                        <TableCell key={col}>{row[col] !== undefined ? String(row[col]) : ''}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {((sourceInputType === 'file' && sourceColumns.length === 0) || ((sourceInputType === 'mongodb' || sourceInputType === 'mysql') && sourceDBColumns.length === 0)) && (
                <Typography variant="body2" color="textSecondary">No columns to display.</Typography>
              )}
            </Paper>
          ) : null}

          {/* Target Type Selection */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Target Data Type</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="target-input-type-label">Target Type</InputLabel>
                  <Select
                    labelId="target-input-type-label"
                    id="target-input-type"
                    value={targetInputType}
                    label="Target Type"
                    onChange={handleTargetInputTypeChange}
                  >
                    <MenuItem value="file">File Upload (CSV/Excel)</MenuItem>
                    <MenuItem value="mongodb">MongoDB</MenuItem>
                    <MenuItem value="mysql">MySQL</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Target File Upload */}
          {targetInputType === 'file' && (
            <Paper
              {...targetDropzone.getRootProps()}
              sx={{
                p: 3,
                mb: 2,
                border: '2px dashed #cccccc',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <input {...targetDropzone.getInputProps()} />
              {targetFile ? (
                <Typography>{targetFile.name}</Typography>
              ) : (
                <Typography>
                  Drag & drop target CSV/Excel file, or click to select
                </Typography>
              )}
            </Paper>
          )}




          
          {targetInputType === 'mongodb' && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>MongoDB Target Details</Typography>
              <TextField
                label="MongoDB URI"
                fullWidth
                value={mongoDBTargetURI}
                onChange={(e) => setMongoDBTargetURI(e.target.value)}
                sx={{ mb: 1 }}
                placeholder="mongodb://username:password@host:port/database"
                helperText="Example: mongodb://localhost:27017/mydb"
              />
              <TextField
                label="Collection Name"
                fullWidth
                value={mongoDBTargetCollection}
                onChange={(e) => setMongoDBTargetCollection(e.target.value)}
                sx={{ mb: 1 }}
                placeholder="collection_name"
              />
              <Button 
                variant="contained" 
                onClick={() => handleDBFetch('target', 'mongodb')}
                disabled={isTargetDBLoading || !mongoDBTargetURI || !mongoDBTargetCollection}
                title={!mongoDBTargetURI || !mongoDBTargetCollection ? 'Please fill both URI and Collection Name' : ''}
                sx={{ mt: 1 }}
              >
                {isTargetDBLoading ? <CircularProgress size={24} /> : 'Fetch Target MongoDB Data'}
              </Button>
              {targetDBError && <Alert severity="error" sx={{ mt: 1 }}>{targetDBError}</Alert>}
            </Paper>
          )}
          
          {targetInputType === 'mysql' && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>MySQL Target Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Host"
                    fullWidth
                    value={mySQLTargetHost}
                    onChange={(e) => setMySQLTargetHost(e.target.value)}
                    sx={{ mb: 1 }}
                    placeholder="localhost"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Port"
                    fullWidth
                    value={mySQLTargetPort}
                    onChange={(e) => setMySQLTargetPort(e.target.value)}
                    sx={{ mb: 1 }}
                    placeholder="3306"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Database"
                    fullWidth
                    value={mySQLTargetDatabase}
                    onChange={(e) => setMySQLTargetDatabase(e.target.value)}
                    sx={{ mb: 1 }}
                    placeholder="mydatabase"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Table"
                    fullWidth
                    value={mySQLTargetTable}
                    onChange={(e) => setMySQLTargetTable(e.target.value)}
                    sx={{ mb: 1 }}
                    placeholder="mytable"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Username"
                    fullWidth
                    value={mySQLTargetUser}
                    onChange={(e) => setMySQLTargetUser(e.target.value)}
                    sx={{ mb: 1 }}
                    placeholder="root"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Password"
                    fullWidth
                    type="password"
                    value={mySQLTargetPassword}
                    onChange={(e) => setMySQLTargetPassword(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                </Grid>
              </Grid>
              <Button 
                variant="contained" 
                onClick={() => handleDBFetch('target', 'mysql')}
                disabled={isTargetDBLoading || !mySQLTargetHost || !mySQLTargetUser || !mySQLTargetDatabase || !mySQLTargetTable}
                title={!mySQLTargetHost || !mySQLTargetUser || !mySQLTargetDatabase || !mySQLTargetTable ? 'Please fill all required fields' : ''}
                sx={{ mt: 1 }}
              >
                {isTargetDBLoading ? <CircularProgress size={24} /> : 'Fetch Target MySQL Data'}
              </Button>
              {targetDBError && <Alert severity="error" sx={{ mt: 1 }}>{targetDBError}</Alert>}
            </Paper>
          )}

          {(targetInputType === 'file' && targetData.length > 0) || ((targetInputType === 'mongodb' || targetInputType === 'mysql') && targetDBData.length > 0) ? (
            <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', mb:2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Target Data Preview (First 5 rows)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {(targetInputType === 'file' ? targetColumns : targetDBColumns).map((col) => (
                      <TableCell key={col}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(targetInputType === 'file' ? targetData : targetDBData).slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      {(targetInputType === 'file' ? targetColumns : targetDBColumns).map((col) => (
                        <TableCell key={col}>{row[col] !== undefined ? String(row[col]) : ''}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {((targetInputType === 'file' && targetColumns.length === 0) || ((targetInputType === 'mongodb' || targetInputType === 'mysql') && targetDBColumns.length === 0)) && (
                <Typography variant="body2" color="textSecondary">No columns to display.</Typography>
              )}
            </Paper>
          ) : null}
          </Box>
        );
        
      case 1: // Select Columns
        return (
          <Box>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Select Columns for Transformation</Typography>
              <Typography variant="body2" paragraph>
                Select the source column that you want to transform and the target column that represents the desired output.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="source-column-label">Source Column</InputLabel>
                    <Select
                      labelId="source-column-label"
                      id="source-column"
                      value={selectedSourceColumn}
                      label="Source Column"
                      onChange={handleSourceColumnChange}
                      disabled={availableSourceColumns.length === 0}
                    >
                      {availableSourceColumns.map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {availableSourceColumns.length === 0 && <Typography variant="caption" color="error">No source data loaded or columns found.</Typography>}
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="target-column-label">Target Column</InputLabel>
                    <Select
                      labelId="target-column-label"
                      id="target-column"
                      value={selectedTargetColumn}
                      label="Target Column"
                      onChange={handleTargetColumnChange}
                      disabled={availableTargetColumns.length === 0}
                    >
                      {availableTargetColumns.map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {availableTargetColumns.length === 0 && <Typography variant="caption" color="error">No target data loaded or columns found.</Typography>}
                </Grid>
              </Grid>
            </Paper>
            
            {selectedSourceColumn && selectedTargetColumn && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Selected Data Preview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Source Column: {selectedSourceColumn}</Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      <List dense>
                        {(sourceInputType === 'file' ? sourceData : sourceDBData).slice(0, 10).map((row, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={row[selectedSourceColumn]} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Target Column: {selectedTargetColumn}</Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      <List dense>
                        {(targetInputType === 'file' ? targetData : targetDBData).slice(0, 10).map((row, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={row[selectedTargetColumn]} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        );

      case 2: // Learn Transformation
        return (
          <Box>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transformation Result
                </Typography>
                <Typography variant="body1" color="primary" fontWeight="bold">
                  {transformationType || 'Not classified yet'}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Transformation Description:
                </Typography>
                <Typography variant="body2" paragraph>
                  {transformationType === 'String-based' && 'Uses string manipulation functions like splitting, case conversion, abbreviation, etc.'}
                  {transformationType === 'Numerical' && 'Applies mathematical functions to transform values.'}
                  {transformationType === 'Algorithmic' && 'Uses specific algorithms without external knowledge for transformations.'}
                  {/* For General type, description is handled below if available */}
                  {transformationType === 'General' && !(transformationDetails && transformationDetails.description) && 'This is a general transformation. The specific relationship will be determined by the AI model during execution.'}
                </Typography>
                {/* Display dynamic description for General transformation if available */}
                {transformationType === 'General' && transformationDetails && transformationDetails.description && (
                  <Box sx={{ mt: 1, p: 2, border: '1px dashed #ccc', borderRadius: 1, backgroundColor: 'rgba(230, 247, 255, 0.5)' }}> {/* Light blueish background */}
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium', color: '#0d47a1' }}> {/* Darker blue for title */}
                      AI-Generated Relationship:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#1565c0' }}> {/* Slightly lighter blue for text */}
                      {transformationDetails.description}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {transformationCode && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Generated Transformation Code
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <SyntaxHighlighter language="python" style={vscDarkPlus} showLineNumbers>
                    {transformationCode}
                  </SyntaxHighlighter>
                </Paper>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Transformation Examples
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
                    {sourceData.slice(0, 5).map((_, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {sourceData[index]?.[selectedSourceColumn] || ''}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {targetData[index]?.[selectedTargetColumn] || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Paper>
            </Box>
          </Box>
        );
      case 3: // Save Transformation
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Save this transformation to reuse it later or apply it to new data.
            </Typography>
            <TextField
              fullWidth
              label="Transformation Name"
              variant="outlined"
              value={transformationName}
              onChange={(e) => setTransformationName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              variant="outlined"
              value={transformationDescription}
              onChange={(e) => setTransformationDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Transformation Type:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {transformationType}
              </Typography>
            </Box>
            {transformationCode && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Transformation Code:
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <SyntaxHighlighter language="python" style={vscDarkPlus} showLineNumbers>
                    {transformationCode}
                  </SyntaxHighlighter>
                </Paper>
              </Box>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Learn Table Transformation
      </Typography>
      <Typography variant="body1" paragraph align="center">
        Upload source and target data to learn column transformations.
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body1">{error}</Typography>
            {errorDetails && (
              <Box mt={1}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                  {errorDetails}
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              loading ||
              (activeStep === 0 && 
                ((sourceInputType === 'file' && !sourceFile) || 
                 (sourceInputType === 'mongodb' && sourceDBData.length === 0) ||
                 (sourceInputType === 'mysql' && sourceDBData.length === 0) ||
                 (targetInputType === 'file' && !targetFile) ||
                 (targetInputType === 'mongodb' && targetDBData.length === 0) ||
                 (targetInputType === 'mysql' && targetDBData.length === 0)
                )
              ) ||
              (activeStep === 1 && (!selectedSourceColumn || !selectedTargetColumn)) ||
              (activeStep === 3 && !transformationName)
            }
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'Save'
            ) : activeStep === 1 ? (
              'Learn'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LearnTransformation;
