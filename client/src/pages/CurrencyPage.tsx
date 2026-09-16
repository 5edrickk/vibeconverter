import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  api,
  Currency,
  CurrencyConvertResult,
  History,
  LatestRates,
} from "../api";
import { colors, fontMono } from "../theme";

/** YYYY-MM-DD in the browser's timezone (toISOString would shift to UTC). */
function toLocalIso(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalIso(d);
}

function today(): string {
  return toLocalIso(new Date());
}

function formatNumber(n: number, digits = 4): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(n);
}

const fieldLabelSx = {
  fontFamily: fontMono,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: colors.textMuted,
};

const panelSx = {
  bgcolor: colors.bgElevated,
  border: `1px solid ${colors.border}`,
  borderRadius: 2,
  p: { xs: 3, sm: 4 },
};

export default function CurrencyPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [from, setFrom] = useState<string>("USD");
  const [to, setTo] = useState<string>("EUR");
  const [amount, setAmount] = useState<string>("1");

  const [result, setResult] = useState<CurrencyConvertResult | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const [rates, setRates] = useState<LatestRates | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const [start, setStart] = useState<string>(isoDaysAgo(30));
  const [end, setEnd] = useState<string>(today());
  const [history, setHistory] = useState<History | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // Bumped by the Load button so the history effect re-runs with the current dates.
  const [historyRequest, setHistoryRequest] = useState(0);

  const codes = useMemo(() => currencies.map((c) => c.code), [currencies]);

  // ISO dates compare correctly as plain strings.
  const dateRangeError = useMemo(() => {
    if (!start || !end) return "Pick a start and an end date";
    if (start > end) return "The start date must be on or before the end date";
    if (end > today()) return "The end date cannot be in the future";
    return null;
  }, [start, end]);

  useEffect(() => {
    api
      .getCurrencies()
      .then(setCurrencies)
      .catch((e) => setConvertError(e.message));
  }, []);

  useEffect(() => {
    if (!from || !to) return;
    const numeric = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(numeric)) {
      setResult(null);
      setConvertError(amount.trim() === "" ? null : "Enter a valid amount");
      return;
    }

    // `cancelled` keeps a slow answer from overwriting a newer one.
    let cancelled = false;
    setConverting(true);
    setConvertError(null);
    api
      .convertCurrency(from, to, numeric)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) {
          setConvertError(e.message);
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setConverting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, amount]);

  useEffect(() => {
    if (!from) return;
    let cancelled = false;
    setRatesError(null);
    api
      .getRates(from)
      .then((r) => {
        if (!cancelled) setRates(r);
      })
      .catch((e) => {
        if (!cancelled) setRatesError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [from]);

  useEffect(() => {
    if (!from || !to) return;
    if (dateRangeError) {
      setHistory(null);
      setHistoryError(null);
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    api
      .getHistory(from, to, start, end)
      .then((h) => {
        if (!cancelled) setHistory(h);
      })
      .catch((e) => {
        if (!cancelled) {
          setHistoryError(e.message);
          setHistory(null);
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `start`/`end` are read on purpose only when Load bumps `historyRequest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, historyRequest, dateRangeError]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const rateRows = useMemo(() => {
    if (!rates) return [];
    return Object.entries(rates.rates).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rates]);

  const sparkline = useMemo(() => {
    const pts = history?.points ?? [];
    if (pts.length < 2) return null;
    const values = pts.map((p) => p.rate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const n = pts.length;
    const coords = pts.map((p, i) => ({
      x: (i / (n - 1)) * 400,
      y: 110 - ((p.rate - min) / span) * 100,
      rate: p.rate,
    }));
    return {
      min,
      max,
      last: coords[coords.length - 1],
      pointsAttr: coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" "),
    };
  }, [history]);

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
        Currency Exchange
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
        Convert between currencies at current market rates.
      </Typography>

      {convertError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {convertError}
        </Alert>
      )}

      <Box sx={panelSx}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
            gap: { xs: 3, sm: 3.5 },
            alignItems: "end",
          }}
        >
          <Stack spacing={1.75}>
            <Typography sx={fieldLabelSx}>From</Typography>
            <Box
              onMouseDownCapture={(e) => {
                if (fromOpen) {
                  e.preventDefault();
                  e.stopPropagation();
                  setFromOpen(false);
                }
              }}
            >
              <Autocomplete
                open={fromOpen}
                onOpen={() => setFromOpen(true)}
                onClose={() => setFromOpen(false)}
                options={codes}
                value={from}
                onChange={(_e, v) => v && setFrom(v)}
                disableClearable
                size="small"
                renderInput={(params) => <TextField {...params} />}
              />
            </Box>
            <TextField
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
              sx={{
                "& input[type=number]": { MozAppearance: "textfield" },
                "& input[type=number]::-webkit-outer-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
                "& input[type=number]::-webkit-inner-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
              }}
            />
          </Stack>

          <Box sx={{ display: "flex", justifyContent: "center", pb: { xs: 0, sm: 0.5 } }}>
            <Tooltip title="Swap">
              <IconButton
                onClick={swap}
                aria-label="swap currencies"
                sx={{ width: 52, height: 52, border: `1.5px solid ${colors.accent}`, color: colors.accent }}
              >
                <SwapHorizIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Stack spacing={1.75}>
            <Typography sx={fieldLabelSx}>To</Typography>
            <Box
              onMouseDownCapture={(e) => {
                if (toOpen) {
                  e.preventDefault();
                  e.stopPropagation();
                  setToOpen(false);
                }
              }}
            >
              <Autocomplete
                open={toOpen}
                onOpen={() => setToOpen(true)}
                onClose={() => setToOpen(false)}
                options={codes}
                value={to}
                onChange={(_e, v) => v && setTo(v)}
                disableClearable
                size="small"
                renderInput={(params) => <TextField {...params} />}
              />
            </Box>
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
              {converting ? (
                <CircularProgress size={22} sx={{ color: colors.accent }} />
              ) : (
                <Typography sx={{ fontFamily: fontMono, fontSize: 32, fontWeight: 600, color: colors.accent }}>
                  {result ? formatNumber(result.result, 2) : "–"}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mt: 3.5, pt: 3, borderTop: `1px solid ${colors.border}` }}>
          <Typography sx={{ fontFamily: fontMono, fontSize: 13, color: colors.textMuted }}>
            {result
              ? `1 ${result.from} = ${formatNumber(result.rate, 6)} ${result.to}${result.date ? ` · as of ${result.date}` : ""}`
              : "Choose currencies to see the conversion."}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr" }, gap: 3, mt: 3 }}>
        <Box sx={panelSx}>
          <Typography sx={{ ...fieldLabelSx, mb: 2 }}>
            History · {from} → {to}
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <TextField
              type="date"
              size="small"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              error={Boolean(dateRangeError)}
              inputProps={{ max: end || today(), style: { fontFamily: fontMono, fontSize: 13 } }}
            />
            <TextField
              type="date"
              size="small"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              error={Boolean(dateRangeError)}
              inputProps={{ min: start, max: today(), style: { fontFamily: fontMono, fontSize: 13 } }}
            />
            <Box
              component="button"
              onClick={() => setHistoryRequest((n) => n + 1)}
              disabled={Boolean(dateRangeError)}
              sx={{
                border: `1px solid ${colors.accent}`,
                bgcolor: "transparent",
                color: colors.accent,
                borderRadius: "6px",
                px: 2,
                py: "9px",
                fontFamily: fontMono,
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                cursor: "pointer",
                flexShrink: 0,
                "&:disabled": {
                  borderColor: colors.border,
                  color: colors.textMuted,
                  cursor: "not-allowed",
                },
              }}
            >
              Load
            </Box>
          </Stack>

          {dateRangeError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {dateRangeError}
            </Alert>
          )}

          {historyError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {historyError}
            </Alert>
          )}

          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={26} sx={{ color: colors.accent }} />
            </Box>
          ) : sparkline ? (
            <svg viewBox="0 0 400 130" width="100%" height={130} style={{ overflow: "visible", display: "block" }}>
              <line x1={0} y1={110} x2={400} y2={110} stroke={colors.border} strokeWidth={1} />
              <polyline
                points={sparkline.pointsAttr}
                fill="none"
                stroke={colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={sparkline.last.x} cy={sparkline.last.y} r={4} fill={colors.accent} />
              <text x={0} y={126} fontFamily={fontMono} fontSize={11} fill={colors.textMuted}>
                {formatNumber(sparkline.min, 6)} min
              </text>
              <text x={400} y={126} textAnchor="end" fontFamily={fontMono} fontSize={11} fill={colors.textMuted}>
                {formatNumber(sparkline.max, 6)} max
              </text>
            </svg>
          ) : (
            <Typography sx={{ color: colors.textMuted, fontFamily: fontMono, fontSize: 13, py: 2 }}>
              No data for this range.
            </Typography>
          )}

          {history && history.points.length > 0 && (
            <TableContainer sx={{ maxHeight: 220, mt: 3, border: `1px solid ${colors.border}`, borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: colors.bg }}>Date</TableCell>
                    <TableCell align="right" sx={{ bgcolor: colors.bg }}>
                      Rate
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.points.map((p) => (
                    <TableRow key={p.date}>
                      <TableCell sx={{ color: colors.textSecondary }}>{p.date}</TableCell>
                      <TableCell align="right" sx={{ color: colors.text }}>
                        {formatNumber(p.rate, 6)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Box sx={panelSx}>
          <Typography sx={{ ...fieldLabelSx, mb: 2 }}>Latest Rates · Base {from}</Typography>
          {ratesError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {ratesError}
            </Alert>
          )}
          <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
            {rateRows.map(([code, rate]) => (
              <Box
                key={code}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.375,
                  borderBottom: `1px solid ${colors.border}`,
                  "&:last-of-type": { borderBottom: "none" },
                }}
              >
                <Typography sx={{ fontSize: 14, color: colors.textSecondary }}>{code}</Typography>
                <Typography sx={{ fontFamily: fontMono, fontSize: 14, color: colors.text }}>
                  {formatNumber(rate, 6)}
                </Typography>
              </Box>
            ))}
            {rateRows.length === 0 && !ratesError && (
              <Typography sx={{ color: colors.textMuted, fontFamily: fontMono, fontSize: 13, py: 2 }}>
                Loading rates…
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
