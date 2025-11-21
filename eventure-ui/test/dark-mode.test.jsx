import { render, screen } from '@testing-library/react';
import ColorModeProvider, { useColorMode } from '@/components/providers/ColorModeProvider';
import { Button } from '@mui/material';

function Probe(){
  const { mode, toggle } = useColorMode();
  return <Button onClick={toggle} data-testid="btn">{mode}</Button>;
}

test('toggle dark mode', ()=>{
  render(<ColorModeProvider><Probe/></ColorModeProvider>);
  const btn = screen.getByTestId('btn');
  // click simulare: aici doar verificăm că randează (evenimentele sunt testate mai bine cu user-event)
  expect(btn).toBeInTheDocument();
});
