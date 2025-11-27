// src/components/provider/invitations/ProviderOfferForm.jsx
"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const lineFieldsConfig = [
  {
    key: "label",
    label: "Serviciu / pachet",
    type: "text",
    flex: 1,
    sx: { minWidth: 220 },
  },
  {
    key: "qty",
    label: "Cant.",
    type: "number",
    sx: { width: 100 },
  },
  {
    key: "amount",
    label: "Preț unitar",
    type: "number",
    sx: { width: 140 },
  },
];

export default function ProviderOfferForm({
  servicesError,
  servicePackages,
  lines,
  currency,
  priceTotal,
  terms,
  saving,
  onLineChange,
  onLinePackageChange,
  onAddLine,
  onRemoveLine,
  onChangeCurrency,
  onChangePriceTotal,
  onChangeTerms,
  onSaveDraft,
  onSaveFinal,
}) {
  return (
    <>
      {servicesError && (
        <Typography color="warning.main" sx={{ mb: 1 }}>
          {servicesError}
        </Typography>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Oferta ta
          </Typography>

          <Stack spacing={2}>
            {lines.map((l) => (
              <Box key={l.id}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <TextField
                    select
                    label="Pachet"
                    value={l.packageId || ""}
                    onChange={(e) =>
                      onLinePackageChange(l.id, e.target.value || null)
                    }
                    sx={{ minWidth: 220 }}
                  >
                    <MenuItem value="">Personalizat</MenuItem>
                    {servicePackages.map((sp) => (
                      <MenuItem key={sp.id} value={sp.id}>
                        {sp.name}
                        {sp.basePrice != null && (
                          <>
                            {" "}
                            (de la {Number(sp.basePrice)}{" "}
                            {sp.currency || currency})
                          </>
                        )}
                        {sp.internalOnly && " • intern"}
                      </MenuItem>
                    ))}
                  </TextField>

                  {lineFieldsConfig.map((field) => (
                    <TextField
                      key={field.key}
                      label={field.label}
                      type={field.type}
                      value={l[field.key]}
                      onChange={(e) =>
                        onLineChange(l.id, field.key, e.target.value)
                      }
                      fullWidth={field.flex === 1}
                      sx={field.sx}
                    />
                  ))}

                  <IconButton onClick={() => onRemoveLine(l.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
                {l.baseAmount != null && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    Preț listă: {Number(l.baseAmount).toFixed(2)} {currency}
                    {Number(l.amount) !== Number(l.baseAmount) &&
                      ` • preț personalizat: ${Number(l.amount).toFixed(
                        2
                      )} ${currency}`}
                  </Typography>
                )}
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={onAddLine}
              sx={{ alignSelf: "flex-start" }}
            >
              Adaugă linie
            </Button>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Total ofertă"
                type="number"
                value={priceTotal}
                onChange={(e) => onChangePriceTotal(e.target.value)}
              />
              <TextField
                label="Monedă"
                value={currency}
                onChange={(e) => onChangeCurrency(e.target.value)}
              />
            </Stack>

            <TextField
              label="Termeni & condiții"
              multiline
              minRows={3}
              value={terms}
              onChange={(e) => onChangeTerms(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <Button
                disabled={saving}
                variant="outlined"
                onClick={onSaveDraft}
              >
                Save draft
              </Button>
              <Button
                disabled={saving}
                variant="contained"
                onClick={onSaveFinal}
              >
                {saving ? "Se salvează..." : "Trimite ofertă"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
