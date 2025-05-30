import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Paper, Grid, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import Papa from 'papaparse';

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

  const handleFileChange = (setter, dataSetter) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
      parseCSVFile(file, dataSetter);
    }
  };

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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>Fuzzy Join</Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                fullWidth
              >
                Upload Source CSV
                <input type="file" accept=".csv" hidden onChange={handleFileChange(setSourceFile, setSourceData)} />
              </Button>
              {sourceFile && <Typography variant="body2">{sourceFile.name}</Typography>}
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
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                fullWidth
                color="secondary"
              >
                Upload Target CSV
                <input type="file" accept=".csv" hidden onChange={handleFileChange(setTargetFile, setTargetData)} />
              </Button>
              {targetFile && <Typography variant="body2">{targetFile.name}</Typography>}
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
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !sourceCol || !targetCol}
              >
                {loading ? <CircularProgress size={24} /> : 'Run Fuzzy Join'}
              </Button>
            </Grid>
          </Grid>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {result && (
        <Paper sx={{ p: 2 }}>
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
    </Box>
  );
};

export default FuzzyJoin;
