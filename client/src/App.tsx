import { AppBar, Box, Container, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import UnitsPage from "./pages/UnitsPage";
import CurrencyPage from "./pages/CurrencyPage";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = location.pathname.startsWith("/currency") ? "/currency" : "/units";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static">
        <Toolbar>
          <SwapHorizIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Converter App
          </Typography>
          <Tabs
            value={current}
            onChange={(_e, value) => navigate(value)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Units" value="/units" />
            <Tab label="Currency" value="/currency" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/units" replace />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/currency" element={<CurrencyPage />} />
          <Route path="*" element={<Navigate to="/units" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}
