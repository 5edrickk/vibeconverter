import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
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

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatNumber(n: number, digits = 4): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(n);
}

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

  const [start, setStart] = useState<string>(isoDaysAgo(30));
  const [end, setEnd] = useState<string>(today());
  const [history, setHistory] = useState<History | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const codes = useMemo(() => currencies.map((c) => c.code), [currencies]);

  useEffect(() => {
    api
      .getCurrencies()
      .then(setCurrencies)
      .catch((e) => setConvertError(e.message));
  }, []);

  const runConvert = () => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) {
      setConvertError("Enter a valid amount");
      return;
    }
    setConverting(true);
    setConvertError(null);
    api
      .convertCurrency(from, to, numeric)
      .then(setResult)
      .catch((e) => {
        setConvertError(e.message);
        setResult(null);
      })
      .finally(() => setConverting(false));
  };

  // Convert on load and whenever the pair changes.
  useEffect(() => {
    if (!from || !to) return;
    runConvert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // Latest rates table follows the "from" currency.
  useEffect(() => {
    if (!from) return;
    setRatesError(null);
    api
      .getRates(from)
      .then(setRates)
      .catch((e) => setRatesError(e.message));
  }, [from]);

  const loadHistory = () => {
    setHistoryLoading(true);
    setHistoryError(null);
    api
      .getHistory(from, to, start, end)
      .then(setHistory)
      .catch((e) => {
        setHistoryError(e.message);
        setHistory(null);
      })
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const rateRows = useMemo(() => {
    if (!rates) return [];
    return Object.entries(rates.rates).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rates]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Currency conversion</Typography>

      {convertError && <Alert severity="error">{convertError}</Alert>}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
        />
        <Autocomplete
          options={codes}
          value={from}
          onChange={(_e, v) => v && setFrom(v)}
          disableClearable
          fullWidth
          renderInput={(params) => <TextField {...params} label="From" />}
        />
        <Tooltip title="Swap">
          <IconButton onClick={swap} color="primary" aria-label="swap currencies">
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>
        <Autocomplete
          options={codes}
          value={to}
          onChange={(_e, v) => v && setTo(v)}
          disableClearable
          fullWidth
          renderInput={(params) => <TextField {...params} label="To" />}
        />
        <Button variant="contained" onClick={runConvert} sx={{ minWidth: 120 }}>
          Convert
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          {converting ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={28} />
            </Box>
          ) : result ? (
            <Stack spacing={1}>
              <Typography variant="h5">
                {formatNumber(result.amount, 2)} {result.from} ={" "}
                {formatNumber(result.result, 2)} {result.to}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1 {result.from} = {formatNumber(result.rate, 6)} {result.to}
                {result.date ? ` (as of ${result.date})` : ""}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Choose currencies and press Convert.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Divider />

      <Box>
        <Typography variant="h6" gutterBottom>
          Latest rates (base {from})
        </Typography>
        {ratesError && <Alert severity="error">{ratesError}</Alert>}
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rateRows.map(([code, rate]) => (
                <TableRow key={code} hover>
                  <TableCell>{code}</TableCell>
                  <TableCell align="right">{formatNumber(rate, 6)}</TableCell>
                </TableRow>
              ))}
              {rateRows.length === 0 && !ratesError && (
                <TableRow>
                  <TableCell colSpan={2}>Loading rates...</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider />

      <Box>
        <Typography variant="h6" gutterBottom>
          History ({from} to {to})
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined" onClick={loadHistory}>
            Load
          </Button>
        </Stack>

        {historyError && <Alert severity="error">{historyError}</Alert>}

        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyLoading && (
                <TableRow>
                  <TableCell colSpan={2}>Loading history...</TableCell>
                </TableRow>
              )}
              {!historyLoading &&
                history?.points.map((p) => (
                  <TableRow key={p.date} hover>
                    <TableCell>{p.date}</TableCell>
                    <TableCell align="right">{formatNumber(p.rate, 6)}</TableCell>
                  </TableRow>
                ))}
              {!historyLoading && history && history.points.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2}>No data for this range.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}
