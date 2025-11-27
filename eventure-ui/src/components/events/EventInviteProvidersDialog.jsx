// src/components/events/EventInviteProvidersDialog.jsx
"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function EventInviteProvidersDialog({
  open,
  onClose,
  // buget (brief + per-serviciu)
  clientBudget,
  setClientBudget,
  clientBudgetCurrency,
  setClientBudgetCurrency,
  eventBudget,
  eventCurrency,
  // catalog & bulk
  catalogLoading,
  flatCategories,
  bulkCategoryIds,
  setBulkCategoryIds,
  bulkNote,
  setBulkNote,
  bulkLoading,
  bulkMessage,
  // single provider
  singleProviderId,
  setSingleProviderId,
  singleNote,
  setSingleNote,
  // handlers
  onBulkInvite,
  onCreateSingleInvitation,
}) {
  const handleClose = () => {
    if (!bulkLoading && onClose) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Invite providers</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* BULK BY CATEGORIES */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Invitații în masă după categorii
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Buget estimat pentru acest serviciu
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 1 }}
            >
              <TextField
                label="Buget (pentru acest tip de serviciu)"
                type="number"
                value={clientBudget}
                onChange={(e) => setClientBudget(e.target.value)}
                fullWidth
              />
              <TextField
                label="Monedă"
                value={clientBudgetCurrency}
                onChange={(e) => setClientBudgetCurrency(e.target.value)}
                sx={{ width: 120 }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Acest buget este orientativ pentru furnizorii invitați (muzică,
              foto, locație etc.) și poate fi ajustat ulterior pentru fiecare
              ofertă.
            </Typography>

            {eventBudget != null && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Buget total din brief pentru eveniment:{" "}
                {eventBudget.toLocaleString("ro-RO", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}{" "}
                {eventCurrency || clientBudgetCurrency || "RON"}. Poți distribui
                acest buget între tipurile de servicii în funcție de nevoi.
              </Typography>
            )}

            {!catalogLoading && !flatCategories.length && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Catalogul de categorii nu este disponibil momentan. Poți folosi
                în continuare invitațiile punctuale.
              </Typography>
            )}

            {flatCategories.length > 0 && (
              <Stack
                component="form"
                spacing={2}
                onSubmit={onBulkInvite}
                sx={{ mt: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Selectează una sau mai multe categorii de servicii. Eventure
                  va găsi provideri care au pachete în aceste categorii și va
                  trimite invitații către ei pentru acest eveniment.
                </Typography>

                <Select
                  multiple
                  value={bulkCategoryIds}
                  onChange={(e) =>
                    setBulkCategoryIds(
                      typeof e.target.value === "string"
                        ? e.target.value.split(",")
                        : e.target.value
                    )
                  }
                  renderValue={(selected) => {
                    const ids = new Set(selected);
                    const labels = flatCategories
                      .filter((c) => ids.has(c.id))
                      .map((c) => c.name);
                    return labels.join(", ");
                  }}
                >
                  {flatCategories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>

                <TextField
                  label="Mesaj către provideri"
                  placeholder="Ex: Căutăm formație pentru nuntă, interval 19:00–02:00..."
                  multiline
                  minRows={3}
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                />

                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={bulkLoading || !bulkCategoryIds.length}
                  >
                    Trimite invitații în masă
                  </Button>
                </Stack>

                {bulkMessage && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {bulkMessage}
                  </Alert>
                )}
              </Stack>
            )}
          </Box>

          {/* SINGLE PROVIDER */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Invitație punctuală către un provider
            </Typography>
            <Stack
              component="form"
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              onSubmit={onCreateSingleInvitation}
            >
              <TextField
                label="Provider ID"
                value={singleProviderId}
                onChange={(e) => setSingleProviderId(e.target.value)}
                helperText="ID-ul intern al providerului (temporar; în viitor se va trimite direct din pagina providerului)."
                fullWidth
              />
              <TextField
                label="Mesaj"
                value={singleNote}
                onChange={(e) => setSingleNote(e.target.value)}
                fullWidth
              />
              <Button
                type="submit"
                variant="outlined"
                disabled={!singleProviderId.trim()}
              >
                Trimite invitația
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={bulkLoading} onClick={handleClose}>
          Închide
        </Button>
      </DialogActions>
    </Dialog>
  );
}
