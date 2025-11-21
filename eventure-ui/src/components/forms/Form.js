'use client';
import { useState } from 'react';

export default function Form({ schema, onSubmit, children, initialValues={} }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function setField(name, value) {
    setValues(v => ({...v, [name]: value}));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    try {
      const parsed = schema.parse(values);
      setLoading(true);
      await onSubmit(parsed);
    } catch (err) {
      // zod error
      if (err?.issues) {
        const byField = {};
        for (const i of err.issues) {
          const k = i.path?.[0];
          if (k && !byField[k]) byField[k] = i.message;
        }
        setErrors(byField);
      } else {
        // eroare neprevăzută
        setErrors({ _form: err.message || 'Eroare' });
      }
    } finally {
      setLoading(false);
    }
  }

  // children: funcție render-props => (helpers)
  return children({
    values, errors, loading,
    setField,
    handleSubmit
  });
}
