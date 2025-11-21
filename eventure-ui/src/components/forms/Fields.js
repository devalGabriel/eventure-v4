'use client';
import { TextField, InputAdornment, IconButton, Checkbox, FormControlLabel, MenuItem } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

export function TextInput({ label, name, value, onChange, error, type='text', inputProps, ...rest }) {
  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      value={value ?? ''}
      onChange={(e)=>onChange(name, e.target.value)}
      error={!!error}
      helperText={error || ' '}
      type={type}
      inputProps={inputProps}
      {...rest}
    />
  );
}

export function PasswordInput({ label, name, value, onChange, error, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      value={value ?? ''}
      onChange={(e)=>onChange(name, e.target.value)}
      error={!!error}
      helperText={error || ' '}
      type={show ? 'text' : 'password'}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={()=>setShow(s=>!s)} edge="end" aria-label="toggle password">
              {show ? <VisibilityOff/> : <Visibility/>}
            </IconButton>
          </InputAdornment>
        )
      }}
      {...rest}
    />
  );
}

export function CheckboxInput({ label, name, checked, onChange, error }) {
  return (
    <FormControlLabel
      control={<Checkbox checked={!!checked} onChange={(e)=>onChange(name, e.target.checked)} />}
      label={label}
    />
  );
}

export function SelectInput({ label, name, value, onChange, options=[], error, ...rest }) {
  return (
    <TextField
      select
      fullWidth
      label={label}
      name={name}
      value={value ?? ''}
      onChange={(e)=>onChange(name, e.target.value)}
      error={!!error}
      helperText={error || ' '}
      {...rest}
    >
      {options.map(opt => (
        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
      ))}
    </TextField>
  );
}

export function DateInput({ label, name, value, onChange, error, minDate, maxDate }) {
  return (
    <DatePicker
      label={label}
      value={value ? dayjs(value) : null}
      onChange={(v)=>onChange(name, v ? v.toDate() : null)}
      slotProps={{
        textField: {
          fullWidth: true,
          error: !!error,
          helperText: error || ' '
        }
      }}
      minDate={minDate ? dayjs(minDate) : undefined}
      maxDate={maxDate ? dayjs(maxDate) : undefined}
    />
  );
}

/** Mask simplu: pattern HTML5 (ex: ####-##-##) */
export function MaskedInput({ label, name, value, onChange, error, pattern, placeholder }) {
  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      value={value ?? ''}
      onChange={(e)=>onChange(name, e.target.value)}
      error={!!error}
      helperText={error || ' '}
      inputProps={{ pattern }}
      placeholder={placeholder}
    />
  );
}
