import { createTheme } from "@mui/material/styles";

export const colors = {
  bg: "#16130f",
  bgElevated: "#1e1a15",
  bgInput: "#241f18",
  border: "rgba(216,198,168,0.14)",
  borderStrong: "rgba(216,198,168,0.26)",
  text: "#f2ede4",
  textSecondary: "#c7bdae",
  textMuted: "#8f8577",
  accent: "#e0a339",
  accentStrong: "#eab654",
  danger: "#e2735a",
};

export const fontDisplay = "'Space Grotesk', ui-sans-serif, system-ui, sans-serif";
export const fontMono = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: colors.bg, paper: colors.bgElevated },
    primary: { main: colors.accent, contrastText: colors.bg },
    secondary: { main: colors.accent, contrastText: colors.bg },
    error: { main: colors.danger },
    divider: colors.border,
    text: { primary: colors.text, secondary: colors.textSecondary },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: fontDisplay,
    h4: { fontFamily: fontDisplay, fontWeight: 600 },
    h6: { fontFamily: fontDisplay, fontWeight: 600 },
    body1: { fontFamily: fontDisplay },
    body2: { fontFamily: fontMono },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.bg },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.bgElevated,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.bgInput,
          borderRadius: 6,
        },
        notchedOutline: {
          borderColor: colors.borderStrong,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
          fontFamily: fontMono,
          fontSize: 13,
        },
        head: {
          fontFamily: fontMono,
          textTransform: "uppercase",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: colors.textMuted,
          fontWeight: 600,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 6,
          fontFamily: fontDisplay,
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
