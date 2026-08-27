import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark] = useState(false);

  const toggle = () => {};

  useEffect(() => {
    document.body.style.backgroundColor = "#FFFCF8";
    document.body.style.color = "#1A1A1A";
    document.body.style.transition = "background-color 0.25s ease, color 0.25s ease";
  }, [dark]);

  const t = {
    dark,
    toggle,
    // Colors
    bg:         "#FFFCF8",
    bgSoft:     "#FFF8EE",
    panel:      "#FFFEFC",
    card:       "#FFFFFF",
    cardAlt:    "#FFF9F1",
    text:       "#1A1A1A",
    textSoft:   "#5F5F5F",
    mutedText:  "#777777",
    border:     "rgba(201,120,62,0.18)",
    borderStrong:"rgba(201,120,62,0.32)",
    input:      "#FFFFFF",
    inputBorder:"1px solid rgba(201,120,62,0.18)",
    navBg:      "#FFFEFC",
    navBorder:  "1px solid rgba(201,120,62,0.14)",
    shadow:     "0 20px 36px rgba(201,120,62,0.10)",
    accent:     "#C9783E",
    accentSoft: dark ? "rgba(201,120,62,0.18)" : "rgba(201,120,62,0.13)",
    accentStrong:"#9F4F2D",
    accentText: "#FFF8F0",
    warm:       "#E8B878",
    success:    "#7C8E6F",
    danger:     "#B76753",
    goldGlow:   dark ? "rgba(224,161,95,0.14)" : "rgba(224,161,95,0.12)",
  };

  return (
    <ThemeContext.Provider value={t}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
