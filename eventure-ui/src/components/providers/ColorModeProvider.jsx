'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

const ColorModeCtx = createContext({ mode:'light', toggle: ()=>{} });
export function useColorMode(){ return useContext(ColorModeCtx); }

const baseTokens = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ['Inter','Roboto','Helvetica','Arial','sans-serif'].join(','),
    h1: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-.01em' },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingInline: 16 } }
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.divider}`
        })
      }
    },
    MuiTextField: {
      defaultProps: { size: 'medium' }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& fieldset': { borderColor: theme.palette.divider },
          '&:hover fieldset': { borderColor: theme.palette.text.secondary },
        })
      }
    }
  }
};

function overlay(opacity) {
  // overlay pentru dark mode (elevations)
  return `linear-gradient(rgba(255,255,255,${opacity}), rgba(255,255,255,${opacity}))`;
}

function makeTheme(mode) {
  const isDark = mode === 'dark';
  const palette = isDark
    ? {
        primary:{ main:'#90caf9' }, secondary:{ main:'#f48fb1' },
        divider:'rgba(255,255,255,.08)',
        background:{ default:'#0b0f14', paper:'#11161c' },
        text:{ primary:'#e5e7eb', secondary:'#94a3b8' }
      }
    : {
        primary:{ main:'#3f51b5' }, secondary:{ main:'#ff4081' },
        divider:'rgba(0,0,0,.08)',
        background:{ default:'#f7f8fa', paper:'#ffffff' },
        text:{ primary:'#0b0f14', secondary:'#64748b' }
      };

  const theme = createTheme({
    palette: { mode, ...palette },
    ...baseTokens
  });

  if (isDark) {
    const overlays = [0,0,0.02,0.04,0.06,0.08,0.09,0.10,0.11,0.12];
    theme.components.MuiPaper = theme.components.MuiPaper || {};
    theme.components.MuiPaper.styleOverrides = theme.components.MuiPaper.styleOverrides || {};
    theme.components.MuiPaper.styleOverrides.root = (owner) => {
      const base = typeof baseTokens.components.MuiPaper.styleOverrides.root === 'function'
        ? baseTokens.components.MuiPaper.styleOverrides.root(owner)
        : baseTokens.components.MuiPaper.styleOverrides.root || {};
      const { elevation = 0 } = owner.ownerState || {};
      const ov = overlays[Math.min(elevation, overlays.length-1)];
      return {
        ...base,
        backgroundImage: ov ? overlay(ov) : 'none'
      };
    };
  }
  return theme;
}

export default function ColorModeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(()=>{
    const saved = localStorage.getItem('evt_color_mode');
    if (saved) return setMode(saved);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setMode(prefersDark ? 'dark' : 'light');
  },[]);

  const value = useMemo(()=>({
    mode,
    toggle: () => {
      setMode(prev => {
        const next = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('evt_color_mode', next);
        document.documentElement.setAttribute('data-theme', next);
        return next;
      });
    }
  }),[mode]);

  useEffect(()=>{ document.documentElement.setAttribute('data-theme', mode); },[mode]);

  const theme = useMemo(()=> makeTheme(mode), [mode]);

  return (
    <ColorModeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeCtx.Provider>
  );
}
