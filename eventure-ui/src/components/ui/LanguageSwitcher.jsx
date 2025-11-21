'use client';
import {useLocale} from 'next-intl';
import {usePathname, useRouter} from 'next/navigation';
import {ToggleButton, ToggleButtonGroup} from '@mui/material';

export default function LanguageSwitcher() {
  const locale = useLocale();             // 'ro' | 'en'
  const pathname = usePathname() || '/';  // ex: '/ro', '/ro/dashboard'
  const router = useRouter();

  const handleChange = (_e, next) => {
    if (!next || next === locale) return;

    // înlocuiește primul segment (locale)
    const segs = pathname.split('/'); // ["", "ro", "dashboard", ...]
    if (segs.length > 1) {
      segs[1] = next;
    } else {
      segs.push(next);
    }
    const nextPath = segs.join('/') || '/';
    router.replace(nextPath); // păstrează exact aceeași cale, cu alt prefix de locale
  };

  return (
    <ToggleButtonGroup size="small" value={locale} exclusive onChange={handleChange}>
      <ToggleButton value="ro">RO</ToggleButton>
      <ToggleButton value="en">EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
