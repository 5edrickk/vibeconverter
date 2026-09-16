import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { api, TimezoneConvertResult, Zone } from "../api";
import { colors, fontMono } from "../theme";

const WORLD_CLOCK = [
  { id: "UTC", label: "UTC" },
  { id: "America/New_York", label: "New York" },
  { id: "America/Chicago", label: "Chicago" },
  { id: "America/Los_Angeles", label: "Los Angeles" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Kolkata", label: "India" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "America/Sao_Paulo", label: "Sao Paulo" },
];

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

/** Current wall-clock time in a zone as a `datetime-local` string. */
function nowInZone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function timeInZone(timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Format the converted wall time for display, e.g. "Mon, Sep 15 · 03:00". */
function formatResult(datetime: string): string {
  const [datePart, timePart] = datetime.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
  const month = new Intl.DateTimeFormat(undefined, {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  return `${weekday}, ${month} ${d} · ${timePart?.slice(0, 5) ?? ""}`;
}

function describeDifference(minutes: number, toLabel: string): string {
  if (minutes === 0) return `${toLabel} is at the same time`;
  const ahead = minutes > 0;
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (mins) parts.push(`${mins} min`);
  return `${toLabel} is ${parts.join(" ")} ${ahead ? "ahead" : "behind"}`;
}

export default function TimezonePage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [from, setFrom] = useState<string>(browserZone());
  const [to, setTo] = useState<string>("UTC");
  const [datetime, setDatetime] = useState<string>(nowInZone(browserZone()));

  const [result, setResult] = useState<TimezoneConvertResult | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);

  const zoneIds = useMemo(() => zones.map((z) => z.id), [zones]);
  const toLabel = useMemo(
    () => zones.find((z) => z.id === to)?.label ?? to.split("/").pop() ?? to,
    [zones, to]
  );

  useEffect(() => {
    api
      .getTimezones()
      .then(setZones)
      .catch((e) => setError(e.message));
  }, []);

  // Refresh the world clock once a minute.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!from || !to || !datetime) return;
    let cancelled = false;
    setConverting(true);
    setError(null);
    api
      .convertTimezone(from, to, datetime)
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
        if (!cancelled) setConverting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, datetime]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const setNow = () => {
    setDatetime(nowInZone(from));
  };

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
        Timezone Conversion
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
        Convert a date and time between timezones around the world.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
            <Autocomplete
              options={zoneIds}
              value={from}
              onChange={(_e, v) => v && setFrom(v)}
              disableClearable
              size="small"
              renderInput={(params) => <TextField {...params} />}
            />
            <TextField
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              fullWidth
              size="small"
              inputProps={{
                style: { fontFamily: fontMono, fontSize: 16, color: colors.text },
              }}
            />
            <Box
              component="button"
              onClick={setNow}
              sx={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                border: `1px solid ${colors.borderStrong}`,
                bgcolor: "transparent",
                color: colors.textSecondary,
                borderRadius: "6px",
                px: 1.5,
                py: "6px",
                fontFamily: fontMono,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                cursor: "pointer",
              }}
            >
              <ScheduleIcon sx={{ fontSize: 15 }} /> Now
            </Box>
          </Stack>

          <Box sx={{ display: "flex", justifyContent: "center", pb: { xs: 0, sm: 0.5 } }}>
            <Tooltip title="Swap">
              <IconButton
                onClick={swap}
                aria-label="swap timezones"
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
            <Typography sx={fieldLabelSx}>To</Typography>
            <Autocomplete
              options={zoneIds}
              value={to}
              onChange={(_e, v) => v && setTo(v)}
              disableClearable
              size="small"
              renderInput={(params) => <TextField {...params} />}
            />
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
                minHeight: 84,
              }}
            >
              {converting ? (
                <CircularProgress size={22} sx={{ color: colors.accent }} />
              ) : (
                <Typography
                  sx={{
                    fontFamily: fontMono,
                    fontSize: 22,
                    fontWeight: 600,
                    color: colors.accent,
                    textAlign: "right",
                  }}
                >
                  {result ? formatResult(result.datetimeTo) : "–"}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mt: 3.5, pt: 3, borderTop: `1px solid ${colors.border}` }}>
          <Typography sx={{ fontFamily: fontMono, fontSize: 13, color: colors.textMuted }}>
            {result
              ? `${result.datetimeFrom.slice(11, 16)} ${result.fromAbbr} (UTC${result.fromOffset}) = ${result.datetimeTo.slice(
                  11,
                  16
                )} ${result.toAbbr} (UTC${result.toOffset}) · ${describeDifference(
                  result.differenceMinutes,
                  toLabel
                )}`
              : "Pick timezones and a datetime to see the conversion."}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ...panelSx, mt: 3 }}>
        <Typography sx={{ ...fieldLabelSx, mb: 2 }}>World Clock · Now</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" },
            gap: 1.5,
          }}
        >
          {WORLD_CLOCK.map((city) => {
            // `tick` keeps the displayed time fresh each minute.
            void tick;
            const active = city.id === to;
            return (
              <Box
                key={city.id}
                component="button"
                onClick={() => setTo(city.id)}
                sx={{
                  textAlign: "left",
                  cursor: "pointer",
                  border: `1px solid ${active ? colors.accent : colors.border}`,
                  bgcolor: colors.bg,
                  borderRadius: "6px",
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: active ? colors.accent : colors.textSecondary,
                  }}
                >
                  {city.label}
                </Typography>
                <Typography
                  sx={{ fontFamily: fontMono, fontSize: 20, fontWeight: 600, color: colors.text }}
                >
                  {timeInZone(city.id)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
