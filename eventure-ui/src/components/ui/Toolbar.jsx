'use client';

// Un wrapper simplu peste MUI Toolbar, ca să poți importa
// `@/components/ui/Toolbar` fără să intri în conflict de nume.
import { Toolbar as MuiToolbar } from '@mui/material';

/**
 * Toolbar: expune direct Toolbar-ul MUI.
 * Poți pasa orice prop acceptat de MUI Toolbar (ex: variant="dense", disableGutters, sx, etc.)
 */
export default function Toolbar(props) {
  return <MuiToolbar {...props} />;
}

/**
 * ToolbarOffset: un spacer care are fix înălțimea AppBar-ului curent,
 * util când folosești position="fixed" pe AppBar și vrei să împingi conținutul în jos.
 *
 * Ex:
 *   <AppBar position="fixed" />
 *   <ToolbarOffset />
 *   <main>...</main>
 */
export function ToolbarOffset() {
  return <MuiToolbar />;
}
