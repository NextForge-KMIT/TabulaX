import React, { useState } from 'react';
import {
  Container, Box, Typography, Button, TextField, Paper, Grid, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert, Divider
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import Papa from 'papaparse';
import { useDropzone } from 'react-dropzone';

const transformationClasses = [
  { value: 'String-based', label: 'String-based' },
  { value: 'Algorithmic', label: 'Algorithmic' },
  { value: 'Numerical', label: 'Numerical' },
  { value: 'General', label: 'General' }
];

function parseCSVFile(file, cb) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => cb(results.data),
    error: () => cb([])
  });
}

const FuzzyJoin = () => {
  const [sourceFile, setSourceFile] = useState(null);
  const [targetFile, setTargetFile] = useState(null);
  const [sourceData, setSourceData] = useState([]);
  const [targetData, setTargetData] = useState([]);
  const [sourceCol, setSourceCol] = useState('');
  const [targetCol, setTargetCol] = useState('');
  const [transformationClass, setTransformationClass] = useState('String-based');
  const [threshold, setThreshold] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropzone handlers
  const onDropSource = React.useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      setSourceFile(file);
      parseCSVFile(file, setSourceData);
    }
  }, []);

  const { getRootProps: getSourceRootProps, getInputProps: getSourceInputProps, isDragActive: isSourceDragActive } = useDropzone({
    onDrop: onDropSource,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false
  });

  const onDropTarget = React.useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      setTargetFile(file);
      parseCSVFile(file, setTargetData);
    }
  }, []);

  const { getRootProps: getTargetRootProps, getInputProps: getTargetInputProps, isDragActive: isTargetDragActive } = useDropzone({
    onDrop: onDropTarget,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false
  });

  // const handleFileChange = (setter, dataSetter) => (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setter(file);
  //     parseCSVFile(file, dataSetter);
  //   }
  // };

  const getColumnOptions = (data) => {
    if (!data.length) return [];
    return Object.keys(data[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/fuzzy-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_data: sourceData,
          target_data: targetData,
          transformed_source_col: sourceCol,
          target_col_to_join_on: targetCol,
          transformation_class: transformationClass,
          max_distance_threshold: threshold
        })
      });

      const responseText = await response.text();
      console.log("Response Status:", response.status);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));
      console.log("Raw Response Text from Server:", responseText);

      // Now try to parse it as JSON
      const data = JSON.parse(responseText); 

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Fuzzy join failed.');
      }
    } catch (err) {
      console.error("Error in handleSubmit catch block:", err); // Log the actual error
      // Also log the response text if available on the error object (some fetch errors might attach it)
      if (err.response && typeof err.response.text === 'function') {
        err.response.text().then(text => console.error("Response text on error:", text));
      }
      setError('Error processing server response. Check console for details.'); // Updated error message
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // header row
      ...data.map(row => 
        headers.map(fieldName => 
          JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value) // handle nulls and ensure strings are quoted
        ).join(',')
      )
    ];
    return csvRows.join('\r\n');
  };

  const handleDownload = () => {
    if (!result || result.length === 0) return;
    const csvData = convertToCSV(result);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'fuzzy_join_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        Fuzzy Join Tool
      </Typography>
      <Typography variant="h6" color="text.secondary" paragraph textAlign="center" sx={{ mb: 4 }}>
        Upload source and target CSV files, select columns, and configure parameters to perform a fuzzy join.
      </Typography>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, mt: 1, fontWeight: 500 }}>
            1. Upload Data Files
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 400, color: 'text.secondary', mb:1.5 }}>Source Data</Typography>
              <Paper
                {...getSourceRootProps()}
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderStyle: 'dashed',
                  borderColor: isSourceDragActive ? 'primary.main' : 'grey.500',
                  backgroundColor: isSourceDragActive ? 'action.hover' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.light',
                  }
                }}
              >
                <input {...getSourceInputProps()} />
                <UploadFileIcon sx={{ fontSize: 40, mb: 1, color: 'grey.600' }} />
                {isSourceDragActive ? (
                  <Typography>Drop the source file here ...</Typography>
                ) : (
                  <Typography>Drag 'n' drop source CSV here, or click to select</Typography>
                )}
                {sourceFile && <Typography variant="body2" sx={{ mt: 1 }}>Selected: {sourceFile.name}</Typography>}
              </Paper>
              {sourceData.length > 0 && (
                <TextField
                  select
                  label="Source Column"
                  value={sourceCol}
                  onChange={e => setSourceCol(e.target.value)}
                  fullWidth
                  margin="normal"
                >
                  {getColumnOptions(sourceData).map(col => (
                    <MenuItem key={col} value={col}>{col}</MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 400, color: 'text.secondary', mb:1.5 }}>Target Data</Typography>
              <Paper
                {...getTargetRootProps()}
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderStyle: 'dashed',
                  borderColor: isTargetDragActive ? 'primary.main' : 'grey.500',
                  backgroundColor: isTargetDragActive ? 'action.hover' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.light',
                  }
                }}
              >
                <input {...getTargetInputProps()} />
                <UploadFileIcon sx={{ fontSize: 40, mb: 1, color: 'grey.600' }} />
                {isTargetDragActive ? (
                  <Typography>Drop the target file here ...</Typography>
                ) : (
                  <Typography>Drag 'n' drop target CSV here, or click to select</Typography>
                )}
                {targetFile && <Typography variant="body2" sx={{ mt: 1 }}>Selected: {targetFile.name}</Typography>}
              </Paper>
              {targetData.length > 0 && (
                <TextField
                  select
                  label="Target Column"
                  value={targetCol}
                  onChange={e => setTargetCol(e.target.value)}
                  fullWidth
                  margin="normal"
                >
                  {getColumnOptions(targetData).map(col => (
                    <MenuItem key={col} value={col}>{col}</MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
            2. Configure Join Parameters
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Transformation Class"
                value={transformationClass}
                onChange={e => setTransformationClass(e.target.value)}
                fullWidth
                margin="normal"
              >
                {transformationClasses.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max Distance Threshold"
                type="number"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                fullWidth
                margin="normal"
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mt: 4, mb: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: 'sm', mx: 'auto' }}>
            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !sourceCol || !targetCol}
              >
                {loading ? <CircularProgress size={24} /> : 'Run Fuzzy Join'}
              </Button>
          </Box>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {result && (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Join Results</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(result[0] || {}).map(col => (
                    <TableCell key={col}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {result.map((row, i) => (
                  <TableRow key={i}>
                    {Object.keys(result[0] || {}).map(col => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          {result && result.length > 0 && (
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download Results as CSV
            </Button>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default FuzzyJoin;
