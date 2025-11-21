'use client';
import { useLocale, useTranslations } from 'next-intl';
import { Stack, Typography, Alert } from '@mui/material';
import Link from 'next/link';
import Form from '@/components/forms/Form';
import { TextInput, PasswordInput } from '@/components/forms/Fields';
import SubmitButton from '@/components/forms/SubmitButton';
import { schemaLogin } from '@/lib/validation';
import { signIn, currentUserAuth } from '@/lib/auth';
import { useNotify } from '@/components/providers/NotificationProvider';
import AfterLoginRoles from '@/components/auth/AfterLoginRoles';

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations();
  const { notify } = useNotify();

  async function handleSubmit({ email, password }) {
    await signIn({ email, password }, locale);
    try {
     const me = await currentUserAuth(locale);          // ← AUTH /me
     const roles = me?.role ? [String(me.role).toUpperCase()] : (me?.roles || []);
     window.__evt_roles = roles;
      window.dispatchEvent(new CustomEvent('evt:roles-set'));
    } catch {}
    notify('Autentificare reușită','success');
    window.location.href = `/${locale}/dashboard`;
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 480, mx:'auto' }}>
      <Typography variant="h4">{t('nav.login')}</Typography>
      <AfterLoginRoles />
      <Form schema={schemaLogin} onSubmit={handleSubmit} initialValues={{ email:'', password:'' }}>
        {({ values, errors, loading, setField, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {errors._form && <Alert severity="error">{errors._form}</Alert>}
              <TextInput label={t('auth.email')} name="email" value={values.email} onChange={setField} error={errors.email} />
              <PasswordInput label={t('auth.password')} name="password" value={values.password} onChange={setField} error={errors.password} />
              <SubmitButton loading={loading}>{t('auth.signin')}</SubmitButton>
              <Typography variant="body2">
                <Link href={`/${locale}/forgot`}>{t('auth.forgot')}</Link>
              </Typography>
            </Stack>
          </form>
        )}
      </Form>
    </Stack>
  );
}
