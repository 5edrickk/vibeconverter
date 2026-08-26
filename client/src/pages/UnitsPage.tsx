import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { api, Category, UnitConvertResult } from "../api";

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

  const handleCategoryChange = (_e: unknown, next: string | null) => {
    if (!next) return;
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
    <Stack spacing={3}>
      <Typography variant="h4">Unit conversion</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <ToggleButtonGroup
        value={categoryId}
        exclusive
        onChange={handleCategoryChange}
        color="primary"
        sx={{ flexWrap: "wrap" }}
      >
        {categories.map((c) => (
          <ToggleButton key={c.id} value={c.id}>
            {c.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <TextField
          label="Amount"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          fullWidth
        />
        <TextField
          select
          label="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          fullWidth
        >
          {category?.units.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.label} ({u.symbol})
            </MenuItem>
          ))}
        </TextField>

        <Tooltip title="Swap">
          <IconButton onClick={swap} color="primary" aria-label="swap units">
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>

        <TextField
          select
          label="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          fullWidth
        >
          {category?.units.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.label} ({u.symbol})
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={28} />
            </Box>
          ) : result ? (
            <Stack spacing={1}>
              <Typography variant="h5">
                {formatNumber(result.value)} {fromUnit?.symbol} ={" "}
                {formatNumber(result.result)} {toUnit?.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.formula}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Enter an amount to see the conversion.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
