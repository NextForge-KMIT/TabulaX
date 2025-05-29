import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Button 
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

/**
 * Component for viewing transformed data with download option
 * @param {Object} props - Component props
 * @param {Array} props.data - The transformed data to display
 * @param {Function} props.onDownload - Optional callback when download is clicked
 * @param {String} props.downloadFile - Optional file path for download
 */
const ViewTransformation = ({ data, onDownload, downloadFile }) => {
  const theme = useTheme();

  // Handle download button click
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (downloadFile) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/transformations/download/${downloadFile}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob', // Important for file downloads
        });
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', downloadFile); // Set the file name
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download the file. Please try again.');
      }
      return;
    }

    // If no downloadFile, download data as CSV from frontend
    if (data && data.length > 0) {
      const csvRows = [];
      const headers = Object.keys(data[0]);
      csvRows.push(headers.join(','));
      for (const row of data) {
        const values = headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          // Escape quotes by doubling them, wrap in quotes if needed
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
    }
  };

  if (!data || data.length === 0) {
    return (
      <Typography>No transformed data to display.</Typography>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Transformed Data</Typography>
        {data && data.length > 0 && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download Joined Data
          </Button>
        )}
      </Box>
      
      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {Object.keys(data[0]).map((key) => (
                  <TableCell 
                    key={key} 
                    sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: theme.palette.background.default 
                    }}
                  >
                    {key}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.slice(0, 100).map((row, index) => (
                <TableRow hover tabIndex={-1} key={index}>
                  {Object.values(row).map((value, i) => (
                    <TableCell key={i}>{String(value)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {data.length > 100 && (
          <Typography sx={{ p: 1, textAlign: 'center', fontSize: '0.9rem' }}>
            Showing first 100 rows. Download the file to view all data.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ViewTransformation;
