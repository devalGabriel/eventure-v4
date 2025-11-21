// test/design.test.jsx
import { render, screen } from '@testing-library/react';
import Card from '@/components/design/Card';

test('Card renders children', ()=>{
  render(<Card><div>hello</div></Card>);
  expect(screen.getByText('hello')).toBeInTheDocument();
});
