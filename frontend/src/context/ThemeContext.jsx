import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("mm_theme") === "dark";
  });

  const toggle = () => {
    setDark(prev => {
      localStorage.setItem("mm_theme", !prev ? "dark" : "light");
      return !prev;
    });
  };

  // Apply background to body
  useEffect(() => {
    document.body.style.backgroundColor = dark ? "#0f0f1a" : "#f7f7f7";
    document.body.style.color = dark ? "#ffffff" : "#1a1a1a";
  }, [dark]);

  const t = {
    dark,
    toggle,
    // Colors
    bg:         dark ? "#0f0f1a"              : "#f7f7f7",
    card:       dark ? "#1a1a2e"              : "#ffffff",
    cardBorder: dark ? "1.5px solid #2a2a3e"  : "1.5px solid #efefef",
    text:       dark ? "#ffffff"              : "#1a1a1a",
    subText:    dark ? "#aaaaaa"              : "#666666",
    mutedText:  dark ? "#666666"              : "#aaaaaa",
    input:      dark ? "#0f0f1a"              : "#f5f5f5",
    inputBorder:dark ? "1.5px solid #2a2a3e"  : "1.5px solid #ebebeb",
    inputText:  dark ? "#ffffff"              : "#222222",
    navBg:      dark ? "#0a0a14"              : "#ffffff",
    navBorder:  dark ? "1px solid #2a2a3e"    : "1px solid #efefef",
    shadow:     dark ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.06)",
    accent:     "#F5A623",
    danger:     "#e53e3e",
    success:    "#27ae60",
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