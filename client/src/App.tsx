import { Box, Typography } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import UnitsPage from "./pages/UnitsPage";
import CurrencyPage from "./pages/CurrencyPage";
import TimezonePage from "./pages/TimezonePage";
import { colors, fontDisplay, fontMono } from "./theme";

const NAV_ITEMS = [
  { label: "Units", value: "/units" },
  { label: "Currency", value: "/currency" },
  { label: "Time", value: "/timezone" },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = location.pathname.startsWith("/currency")
    ? "/currency"
    : location.pathname.startsWith("/timezone")
    ? "/timezone"
    : "/units";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 76,
          px: { xs: 3, sm: 7 },
          bgcolor: "background.paper",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "6px",
              bgcolor: colors.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <SwapHorizIcon sx={{ fontSize: 20, color: colors.bg }} />
          </Box>
          <Typography
            sx={{
              fontFamily: fontDisplay,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: colors.text,
            }}
          >
            Converter
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, bgcolor: colors.bgInput, p: 0.5, borderRadius: "6px" }}>
          {NAV_ITEMS.map((item) => {
            const active = current === item.value;
            return (
              <Box
                key={item.value}
                component="button"
                onClick={() => navigate(item.value)}
                sx={{
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fontMono,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderRadius: "4px",
                  px: 2.75,
                  py: 1.25,
                  bgcolor: active ? colors.accent : "transparent",
                  color: active ? colors.bg : colors.textSecondary,
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  "&:hover": {
                    bgcolor: active ? colors.accent : "rgba(216,198,168,0.08)",
                  },
                }}
              >
                {item.label}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ maxWidth: 880, mx: "auto", px: { xs: 3, sm: 7 }, py: { xs: 6, sm: 8 } }}>
        <Routes>
          <Route path="/" element={<Navigate to="/units" replace />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/currency" element={<CurrencyPage />} />
          <Route path="/timezone" element={<TimezonePage />} />
          <Route path="*" element={<Navigate to="/units" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
