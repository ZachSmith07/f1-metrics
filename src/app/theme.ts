// defines custom MUI theme

import { createTheme } from "@mui/material/styles";

// importing each page's font
import { exo2 } from "./styles";

const darkTheme = createTheme({
  // Setting the colour scheme
  palette: {
    mode: "dark",
    primary: {
      main: "#94c1ff",
    },
    secondary: {
      main: "#0A84FF",
    },
    background: {
      default: "#3C3C3C",
      paper: "#1E1E1E",
    },
    text: {
      primary: "#EAEAEA",
      secondary: "#A0A0A0",
    },
    success: {
      main: "#4CAF50",
    },
    error: {
      main: "#FF453A",
    },
    divider: "#292929",
  },
  typography: {
    fontFamily: exo2.style.fontFamily, // use Exo 2 font for all text
  },
});

export default darkTheme;