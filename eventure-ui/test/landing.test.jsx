import {render, screen} from '@testing-library/react';
import Landing from '@/app/[locale]/(public)/page';

jest.mock('next-intl', ()=>({
  useTranslations: ()=> (k)=> k,
  useLocale: ()=> 'en'
}));

test('landing renders hero text', ()=>{
  render(<Landing />);
  expect(screen.getByText('landing.hero.title')).toBeInTheDocument();
});
