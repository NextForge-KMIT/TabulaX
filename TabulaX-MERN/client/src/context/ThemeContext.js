import React, { createContext, useState, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';

export const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  theme: createTheme(), // Default empty theme
});

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');

  const colorMode = useMemo(
    () => ({
      toggleTheme: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(() => {
    // Your existing theme can be the base for the light theme
    const lightPalette = {
      primary: {
        main: '#3A86FF', 
        light: '#79AFFF',
        dark: '#0059CB',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#FF8C00',
        light: '#FFB84D',
        dark: '#C76F00',
        contrastText: '#000000',
      },
      background: {
        default: '#F8F9FA',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#212529',
        secondary: '#6C757D',
      },
    };

    const darkPalette = {
      primary: {
        main: '#3A86FF', // Keep primary vibrant or adjust as needed for dark mode
        light: '#79AFFF',
        dark: '#0059CB',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#FF8C00', // Keep secondary vibrant or adjust
        light: '#FFB84D',
        dark: '#C76F00',
        contrastText: '#000000',
      },
      background: {
        default: '#121212', // Common dark mode background
        paper: '#1E1E1E',   // Slightly lighter paper for dark mode
      },
      text: {
        primary: '#E0E0E0', // Light gray for primary text on dark background
        secondary: '#A0A0A0', // Medium gray for secondary text
      },
    };

    return createTheme({
      palette: {
        mode: mode, // This is crucial for MUI to know the mode
        ...(mode === 'light' ? lightPalette : darkPalette),
        // Common palette items can be defined outside if they don't change with mode
        error: { main: '#D32F2F' },
        warning: { main: '#FFA000' },
        info: { main: '#1976D2' },
        success: { main: '#2E7D32' },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2.8rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.015em' },
        h2: { fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
        h3: { fontSize: '1.8rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.005em' },
        h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.35 },
        h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
        h6: { fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.45 },
        body1: { fontSize: '1rem', lineHeight: 1.6 },
        body2: { fontSize: '0.875rem', lineHeight: 1.5 },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
      },
      shape: {
        borderRadius: 10,
      },
      // You can also define mode-specific component overrides here if needed
      // For example, shadows might need to be adjusted for dark mode
      shadows: mode === 'light' ? [
        'none',
        '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.03)',
        '0px 3px 5px -1px rgba(0,0,0,0.06), 0px 5px 8px 0px rgba(0,0,0,0.04), 0px 1px 14px 0px rgba(0,0,0,0.03)',
        '0px 3px 6px -1px rgba(0,0,0,0.07), 0px 6px 10px 0px rgba(0,0,0,0.05), 0px 1px 18px 0px rgba(0,0,0,0.04)',
        '0px 4px 8px -1px rgba(0,0,0,0.07), 0px 8px 12px 0px rgba(0,0,0,0.05), 0px 1px 20px 0px rgba(0,0,0,0.04)',
        '0px 5px 10px -1px rgba(0,0,0,0.08), 0px 10px 15px 0px rgba(0,0,0,0.06), 0px 1px 24px 0px rgba(0,0,0,0.05)',
        '0px 5px 12px -2px rgba(0,0,0,0.08), 0px 12px 17px 0px rgba(0,0,0,0.06), 0px 2px 30px 0px rgba(0,0,0,0.05)',
        '0px 6px 13px -2px rgba(0,0,0,0.09), 0px 13px 19px 0px rgba(0,0,0,0.07), 0px 2px 34px 0px rgba(0,0,0,0.06)',
        '0px 6px 14px -2px rgba(0,0,0,0.09), 0px 14px 21px 0px rgba(0,0,0,0.07), 0px 2px 38px 0px rgba(0,0,0,0.06)',
        '0px 7px 15px -3px rgba(0,0,0,0.1), 0px 15px 23px 0px rgba(0,0,0,0.08), 0px 3px 42px 0px rgba(0,0,0,0.07)',
        '0px 7px 16px -3px rgba(0,0,0,0.1), 0px 16px 25px 0px rgba(0,0,0,0.08), 0px 3px 46px 0px rgba(0,0,0,0.07)',
        '0px 8px 17px -3px rgba(0,0,0,0.11), 0px 17px 27px 0px rgba(0,0,0,0.09), 0px 3px 50px 0px rgba(0,0,0,0.08)',
        '0px 8px 18px -4px rgba(0,0,0,0.11), 0px 18px 29px 0px rgba(0,0,0,0.09), 0px 4px 54px 0px rgba(0,0,0,0.08)',
        '0px 9px 19px -4px rgba(0,0,0,0.12), 0px 19px 31px 0px rgba(0,0,0,0.1), 0px 4px 58px 0px rgba(0,0,0,0.09)',
        '0px 9px 20px -4px rgba(0,0,0,0.12), 0px 20px 33px 0px rgba(0,0,0,0.1), 0px 4px 62px 0px rgba(0,0,0,0.09)',
        '0px 10px 21px -4px rgba(0,0,0,0.13), 0px 21px 35px 0px rgba(0,0,0,0.11), 0px 5px 66px 0px rgba(0,0,0,0.1)',
        '0px 10px 22px -5px rgba(0,0,0,0.13), 0px 22px 37px 0px rgba(0,0,0,0.11), 0px 5px 70px 0px rgba(0,0,0,0.1)',
        '0px 11px 23px -5px rgba(0,0,0,0.14), 0px 23px 39px 0px rgba(0,0,0,0.12), 0px 5px 74px 0px rgba(0,0,0,0.11)',
        '0px 11px 24px -5px rgba(0,0,0,0.14), 0px 24px 41px 0px rgba(0,0,0,0.12), 0px 6px 78px 0px rgba(0,0,0,0.11)',
        '0px 12px 25px -6px rgba(0,0,0,0.15), 0px 25px 43px 0px rgba(0,0,0,0.13), 0px 6px 82px 0px rgba(0,0,0,0.12)',
        '0px 12px 26px -6px rgba(0,0,0,0.15), 0px 26px 45px 0px rgba(0,0,0,0.13), 0px 6px 86px 0px rgba(0,0,0,0.12)',
        '0px 13px 27px -6px rgba(0,0,0,0.16), 0px 27px 47px 0px rgba(0,0,0,0.14), 0px 7px 90px 0px rgba(0,0,0,0.13)',
        '0px 13px 28px -7px rgba(0,0,0,0.16), 0px 28px 49px 0px rgba(0,0,0,0.14), 0px 7px 94px 0px rgba(0,0,0,0.13)',
        '0px 14px 29px -7px rgba(0,0,0,0.17), 0px 29px 51px 0px rgba(0,0,0,0.15), 0px 7px 98px 0px rgba(0,0,0,0.14)',
        '0px 14px 30px -8px rgba(0,0,0,0.17), 0px 30px 53px 0px rgba(0,0,0,0.15), 0px 8px 102px 0px rgba(0,0,0,0.14)',
      ] : [
        // Dark mode shadows (often more subtle or use different colors)
        'none',
        '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)', // Example dark shadow
        // ... (define all 24 shadow levels for dark mode or use MUI defaults by not specifying)
        // For brevity, I'm only showing one example. You'd typically define all or let MUI handle dark shadows.
        ...Array(23).fill('0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)')
      ],
      components: {
        // You can copy MuiButton, MuiCard, etc. overrides from your App.js
        // and potentially adjust them for dark mode if needed.
        // For example, hover effects might need different colors.
        MuiButton: {
          styleOverrides: {
            root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
            containedPrimary: { '&:hover': { backgroundColor: mode === 'light' ? '#0059CB' : '#79AFFF' } }, // Adjusted hover for dark
            containedSecondary: { '&:hover': { backgroundColor: mode === 'light' ? '#C76F00' : '#FFB84D' } }, // Adjusted hover for dark
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: mode === 'light' 
                ? '0px 10px 15px -3px rgba(0,0,0,0.07), 0px 4px 6px -2px rgba(0,0,0,0.05)' 
                : '0px 10px 15px -3px rgba(0,0,0,0.3), 0px 4px 6px -2px rgba(0,0,0,0.25)', // Darker shadow for dark mode
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E', // Dark AppBar
              color: mode === 'light' ? '#212529' : '#E0E0E0',
              boxShadow: mode === 'light' 
                ? '0px 2px 4px -1px rgba(0,0,0,0.06)' 
                : '0px 2px 4px -1px rgba(0,0,0,0.5)', // Darker shadow for dark AppBar
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: mode === 'light' ? '#3A86FF' : '#79AFFF' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: mode === 'light' ? '#3A86FF' : '#79AFFF', borderWidth: '1px' },
              },
              '& .MuiInputLabel-outlined.Mui-focused': { color: mode === 'light' ? '#3A86FF' : '#79AFFF' },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: { borderRadius: 10 }
          }
        }
      }
    });
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme: colorMode.toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
