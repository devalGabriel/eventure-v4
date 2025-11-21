'use client';
import { useLocale, useTranslations } from 'next-intl';
import { Stack, Typography, Alert } from '@mui/material';
import Form from '@/components/forms/Form';
import { TextInput, PasswordInput } from '@/components/forms/Fields';
import SubmitButton from '@/components/forms/SubmitButton';
import { schemaRegister } from '@/lib/validation';
import { signUp } from '@/lib/auth';
import { useNotify } from '@/components/providers/NotificationProvider';

export default function RegisterPage() {
  const locale = useLocale();
  console.log('Locale register page:', locale);
  const t = useTranslations();
  const { notify } = useNotify();

  async function handleSubmit({ name, email, password }) {
    await signUp({ name, email, password }, locale);
    notify('Cont creat','success');
    window.location.href = `/${locale}/dashboard`;
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 480, mx:'auto' }}>
      <Typography variant="h4">{t('nav.register')}</Typography>
      <Form schema={schemaRegister} onSubmit={handleSubmit} initialValues={{ name:'', email:'', password:'' }}>
        {({ values, errors, loading, setField, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {errors._form && <Alert severity="error">{errors._form}</Alert>}
              <TextInput label={t('auth.name')} name="name" value={values.name} onChange={setField} error={errors.name} />
              <TextInput label={t('auth.email')} name="email" value={values.email} onChange={setField} error={errors.email} />
              <PasswordInput label={t('auth.password')} name="password" value={values.password} onChange={setField} error={errors.password} />
              <SubmitButton loading={loading}>{t('auth.signup')}</SubmitButton>
            </Stack>
          </form>
        )}
      </Form>
    </Stack>
  );
}
