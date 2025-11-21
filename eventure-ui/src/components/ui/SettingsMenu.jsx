'use client';
import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Switch } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LanguageIcon from '@mui/icons-material/Language';
import { useColorMode } from '@/components/providers/ColorModeProvider';
import LanguageSwitcher from './LanguageSwitcher';

export default function SettingsMenu() {
  const { mode, toggle } = useColorMode();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Settings"
        size="small"
      >
        <SettingsIcon />
      </IconButton>

      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 240 } }}
      >
        <MenuItem disableRipple>
          <ListItemIcon><DarkModeIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Dark mode" />
          <Switch size="small" checked={mode === 'dark'} onChange={toggle} />
        </MenuItem>

        <Divider />

        <MenuItem disableRipple sx={{ py: 1.5 }}>
          <ListItemIcon><LanguageIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Language" secondary="Switch site language" />
        </MenuItem>
        {/* LanguageSwitcher e un control complex – îl randăm „inline” sub item */}
        <div style={{ padding: '0 16px 12px 40px' }}>
          <LanguageSwitcher dense />
        </div>
      </Menu>
    </>
  );
}
