'use client';
import { useTranslations } from 'next-intl';
import { Stack, Typography, Alert } from '@mui/material';
import Form from '@/components/forms/Form';
import { TextInput } from '@/components/forms/Fields';
import SubmitButton from '@/components/forms/SubmitButton';
import { schemaForgot } from '@/lib/validation';
import { forgotPassword } from '@/lib/auth';
import { useNotify } from '@/components/providers/NotificationProvider';

export default function ForgotPage() {
  const t = useTranslations();
  const { notify } = useNotify();

  async function handleSubmit({ email }) {
    await forgotPassword({ email });
    notify('Dacă email-ul există, ți-am trimis instrucțiuni.','info');
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 480, mx:'auto' }}>
      <Typography variant="h4">{t('auth.forgot')}</Typography>
      <Form schema={schemaForgot} onSubmit={handleSubmit} initialValues={{ email:'' }}>
        {({ values, errors, loading, setField, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {errors._form && <Alert severity="error">{errors._form}</Alert>}
              <TextInput label={t('auth.email')} name="email" value={values.email} onChange={setField} error={errors.email} />
              <SubmitButton loading={loading}>{t('auth.forgot')}</SubmitButton>
            </Stack>
          </form>
        )}
      </Form>
    </Stack>
  );
}
