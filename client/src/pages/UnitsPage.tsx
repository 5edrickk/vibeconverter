import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { api, Category, UnitConvertResult } from "../api";
import { colors, fontMono } from "../theme";

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(n);
}

export default function UnitsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [value, setValue] = useState<string>("1");
  const [result, setResult] = useState<UnitConvertResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  useEffect(() => {
    api
      .getCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) {
          const first = cats[0];
          setCategoryId(first.id);
          setFrom(first.units[0]?.id ?? "");
          setTo(first.units[1]?.id ?? first.units[0]?.id ?? "");
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!category || !from || !to) return;
    const numeric = Number(value);
    if (value.trim() === "" || !Number.isFinite(numeric)) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .convertUnit(category.id, from, to, numeric)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, from, to, value]);

  const selectCategory = (next: string) => {
    const cat = categories.find((c) => c.id === next);
    if (!cat) return;
    setCategoryId(next);
    setFrom(cat.units[0]?.id ?? "");
    setTo(cat.units[1]?.id ?? cat.units[0]?.id ?? "");
    setResult(null);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const fromUnit = category?.units.find((u) => u.id === from);
  const toUnit = category?.units.find((u) => u.id === to);

  return (
    <Box>
      <Typography
        sx={{
          fontFamily: fontMono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.accent,
          mb: 1.75,
        }}
      >
        Unit Conversion
      </Typography>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: { xs: 26, sm: 34 },
          lineHeight: 1.2,
          color: colors.text,
          mb: 5,
          maxWidth: 640,
        }}
      >
        Convert between length, volume, weight, temperature and area.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
        {categories.map((c) => {
          const active = c.id === categoryId;
          return (
            <Box
              key={c.id}
              component="button"
              onClick={() => selectCategory(c.id)}
              sx={{
                border: active ? "none" : `1px solid ${colors.borderStrong}`,
                cursor: "pointer",
                fontFamily: fontMono,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                borderRadius: "4px",
                px: 2.25,
                py: 1.25,
                bgcolor: active ? colors.accent : "transparent",
                color: active ? colors.bg : colors.textSecondary,
              }}
            >
              {c.label}
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ bgcolor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 2, p: { xs: 3, sm: 5 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
            gap: { xs: 3, sm: 3.5 },
            alignItems: "end",
          }}
        >
          <Stack spacing={1.75}>
            <Typography
              sx={{ fontFamily: fontMono, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: colors.textMuted }}
            >
              From
            </Typography>
            <TextField
              select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              fullWidth
              size="small"
            >
              {category?.units.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.label} ({u.symbol})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              fullWidth
              inputProps={{
                style: {
                  fontFamily: fontMono,
                  fontSize: 32,
                  fontWeight: 600,
                  textAlign: "right",
                  color: colors.text,
                  padding: "14px 4px",
                },
              }}
            />
          </Stack>

          <Box sx={{ display: "flex", justifyContent: "center", pb: { xs: 0, sm: 0.5 } }}>
            <Tooltip title="Swap">
              <IconButton
                onClick={swap}
                aria-label="swap units"
                sx={{
                  width: 52,
                  height: 52,
                  border: `1.5px solid ${colors.accent}`,
                  color: colors.accent,
                }}
              >
                <SwapHorizIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Stack spacing={1.75}>
            <Typography
              sx={{ fontFamily: fontMono, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: colors.textMuted }}
            >
              To
            </Typography>
            <TextField
              select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              fullWidth
              size="small"
            >
              {category?.units.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.label} ({u.symbol})
                </MenuItem>
              ))}
            </TextField>
            <Box
              sx={{
                bgcolor: colors.bg,
                border: `1px solid ${colors.borderStrong}`,
                borderRadius: "6px",
                px: "16px",
                py: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                minHeight: 56,
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: colors.accent }} />
              ) : (
                <Typography sx={{ fontFamily: fontMono, fontSize: 32, fontWeight: 600, color: colors.accent }}>
                  {result ? formatNumber(result.result) : "–"}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mt: 3.5, pt: 3, borderTop: `1px solid ${colors.border}` }}>
          <Typography sx={{ fontFamily: fontMono, fontSize: 13, color: colors.textMuted }}>
            {result
              ? `${formatNumber(result.value)} ${fromUnit?.symbol} = ${formatNumber(result.result)} ${toUnit?.symbol} · ${result.formula}`
              : "Enter an amount to see the conversion."}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
