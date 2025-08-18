// Wraps each page with their styles for MUI

"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import darkTheme from "./theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Providing the dark theme and CssBaseline applies consistent styling within different browsers
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}