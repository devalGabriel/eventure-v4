'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotify } from '@/components/providers/NotificationProvider';

const EVENT_TYPES = [
  { value: 'wedding', label: 'Nuntă' },
  { value: 'baptism', label: 'Botez' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Alt tip' },
];

function emptyTemplate() {
  return {
    id: null,
    type: 'wedding',
    name: '',
    description: '',
    tasks: [],
  };
}

export default function EventTemplatesAdminPage() {
  const { notify } = useNotify();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyTemplate());
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (search.trim()) params.set('q', search.trim());

      const r = await fetch(`/api/admin/event-templates?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!r.ok) throw new Error(await r.text().catch(() => 'Failed'));

      const d = await r.json();
      const list = d.rows || [];

      setRows(list);
      // dacă ai un template selectat, resetează-l cu datele actualizate
      if (selectedId) {
        const found = list.find((t) => t.id === selectedId);
        if (found) {
          setForm({
            id: found.id,
            type: found.type,
            name: found.name,
            description: found.description || '',
            tasks: Array.isArray(found.taskJson) ? found.taskJson : [],
          });
        } else {
          setSelectedId(null);
          setForm(emptyTemplate());
        }
      }
    } catch (e) {
      console.error(e);
      notify('Nu s-au putut încărca șabloanele.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectTemplate(tpl) {
    setSelectedId(tpl.id);
    setForm({
      id: tpl.id,
      type: tpl.type,
      name: tpl.name,
      description: tpl.description || '',
      tasks: Array.isArray(tpl.taskJson) ? tpl.taskJson : [],
    });
  }

  function handleNewTemplate() {
    setSelectedId(null);
    setForm(emptyTemplate());
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTask(index, key, value) {
    setForm((prev) => {
      const tasks = [...(prev.tasks || [])];
      const t = { ...(tasks[index] || {}) };
      t[key] = value;
      tasks[index] = t;
      return { ...prev, tasks };
    });
  }

  function addTaskRow() {
    setForm((prev) => ({
      ...prev,
      tasks: [
        ...(prev.tasks || []),
        { title: '', daysBefore: '', offsetDays: '', section: '', optional: false, order: '' },
      ],
    }));
  }

  function removeTaskRow(index) {
    setForm((prev) => {
      const tasks = [...(prev.tasks || [])];
      tasks.splice(index, 1);
      return { ...prev, tasks };
    });
  }

  async function saveTemplate() {
    const type = form.type?.toString().trim();
    const name = form.name?.toString().trim();

    if (!type || !name) {
      notify('Tipul și numele șablonului sunt obligatorii.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type,
        name,
        description: form.description?.toString() || '',
        tasks: form.tasks || [],
      };

      let r;
      if (form.id) {
        r = await fetch(`/api/admin/event-templates/${form.id}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        r = await fetch('/api/admin/event-templates', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(txt || 'Save failed');
      }

      notify('Șablon salvat.', 'success');
      await load();
    } catch (e) {
      console.error(e);
      notify('Nu s-a putut salva șablonul.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate() {
    if (!form.id) return;
    if (!confirm('Sigur vrei să ștergi acest șablon?')) return;

    try {
      const r = await fetch(`/api/admin/event-templates/${form.id}`, {
        method: 'DELETE',
      });
      if (!r.ok && r.status !== 204) {
        const txt = await r.text().catch(() => '');
        throw new Error(txt || 'Delete failed');
      }

      notify('Șablon șters.', 'success');
      setSelectedId(null);
      setForm(emptyTemplate());
      await load();
    } catch (e) {
      console.error(e);
      notify('Nu s-a putut șterge șablonul.', 'error');
    }
  }

  const filteredRows = useMemo(() => {
    // filtrarea principală o face backend-ul, aici doar fallback vizual
    return rows;
  }, [rows]);

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Șabloane de taskuri pentru evenimente</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewTemplate}>
            Șablon nou
          </Button>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Aici adminul definește șabloanele de taskuri pentru tipurile de evenimente (nuntă, botez,
        corporate). Clientul poate apoi să genereze automat timeline-ul din aceste șabloane.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        {/* LISTA ȘABLOANELOR */}
        <Card sx={{ flex: 1, minWidth: 260 }}>
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                label="Filtru tip"
                select
                size="small"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">Toate</MenuItem>
                {EVENT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Căutare"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={load}
              />
            </Stack>

            <Divider sx={{ mb: 1 }} />

            <List dense sx={{ maxHeight: 440, overflow: 'auto' }}>
              {filteredRows.map((tpl) => (
                <ListItemButton
                  key={tpl.id}
                  selected={tpl.id === selectedId}
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <ListItemText
                    primary={tpl.name}
                    secondary={`${tpl.type} • ${Array.isArray(tpl.taskJson) ? tpl.taskJson.length : 0
                      } taskuri`}
                  />
                </ListItemButton>
              ))}
              {!filteredRows.length && (
                <Box sx={{ p: 1.5, color: 'text.secondary', fontSize: 13 }}>
                  Nu există încă șabloane. Creează primul șablon din butonul „Șablon nou”.
                </Box>
              )}
            </List>
          </CardContent>
        </Card>

        {/* EDITOR ȘABLON */}
        <Card sx={{ flex: 2, minWidth: 320 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  {form.id ? 'Editează șablon' : 'Șablon nou'}
                </Typography>
                {form.id && (
                  <IconButton onClick={deleteTemplate} disabled={saving}>
                    <DeleteIcon color="error" />
                  </IconButton>
                )}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Nume șablon"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Tip eveniment"
                  select
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  {EVENT_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <TextField
                label="Descriere (opțional)"
                multiline
                minRows={2}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />

              <Divider />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Taskuri în șablon</Typography>
                <Button size="small" variant="outlined" onClick={addTaskRow}>
                  Adaugă task
                </Button>
              </Stack>

              {(!form.tasks || form.tasks.length === 0) && (
                <Box sx={{ p: 1, color: 'text.secondary', fontSize: 13 }}>
                  Nu există taskuri în acest șablon. Adaugă câteva taskuri pentru a genera timeline-ul
                  implicit al evenimentului.
                </Box>
              )}

              <Stack spacing={1}>
                {(form.tasks || []).map((t, idx) => (
                  <Card key={idx} variant="outlined" sx={{ p: 1 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Task #{idx + 1}
                        </Typography>
                        <IconButton size="small" onClick={() => removeTaskRow(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      <TextField
                        label="Titlu"
                        value={t.title || ''}
                        onChange={(e) => updateTask(idx, 'title', e.target.value)}
                        fullWidth
                      />

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          label="Zile înainte de eveniment"
                          type="number"
                          value={t.daysBefore ?? ''}
                          onChange={(e) => updateTask(idx, 'daysBefore', e.target.value)}
                          helperText="Ex: 30 înseamnă cu 30 de zile înainte de data evenimentului"
                        />
                        <TextField
                          label="Offset după eveniment (zile)"
                          type="number"
                          value={t.offsetDays ?? ''}
                          onChange={(e) => updateTask(idx, 'offsetDays', e.target.value)}
                          helperText="De obicei 0 sau gol (rareori pentru follow-up)"
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          label="Secțiune (ex: Planning, Ziua evenimentului)"
                          value={t.section || ''}
                          onChange={(e) => updateTask(idx, 'section', e.target.value)}
                          fullWidth
                        />
                        <TextField
                          label="Ordine"
                          type="number"
                          value={t.order ?? ''}
                          onChange={(e) => updateTask(idx, 'order', e.target.value)}
                          sx={{ maxWidth: 120 }}
                        />
                      </Stack>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(t.optional)}
                            onChange={(e) => updateTask(idx, 'optional', e.target.checked)}
                          />
                        }
                        label="Task opțional"
                      />
                    </Stack>
                  </Card>
                ))}
              </Stack>

              <Divider />

              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={saveTemplate} disabled={saving}>
                  Salvează șablonul
                </Button>
                <Button variant="outlined" onClick={load} disabled={loading}>
                  Reîncarcă
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
