// Theme configuration for retro Mac OS styling
export type ThemeConfig = {
  // Base colors
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  name: string; // Add name field for theme identification
  
  // Menu styles
  menuBarBackground: string;
  menuBarBorder: string;
  menuItemHoverBg: string;
  menuItemHoverText: string;
  
  // Window styles
  windowBackground: string;
  windowBorder: string;
  windowTitlebarBg: string;
  windowRadius: string; // Border radius for windows
  
  // Control buttons
  closeButtonColor: string;
  minimizeButtonColor: string;
  maximizeButtonColor: string;
  
  // Status bar
  statusBarBackground: string;
  statusBarBorder: string;
  
  // Typography
  fontFamily: string;
  
  // Shadow effects
  boxShadow?: string; // Default box shadow for windows
  cardBoxShadow?: string; // Box shadow for cards
  hoverBoxShadow?: string; // Box shadow for hover states
};

// Classic Mac OS 9 theme (System 8/9)
export const macClassicTheme: ThemeConfig = {
  name: "macClassic",
  backgroundColor: "#DEDEDE",
  borderColor: "#888888",
  textColor: "#000000",
  accentColor: "#0060CB", // Enhanced classic blue highlight

  menuBarBackground: "#DEDEDE",
  menuBarBorder: "#888888",
  menuItemHoverBg: "#0060CB",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#FFFFFF",
  windowBorder: "#888888",
  windowTitlebarBg: "linear-gradient(180deg, #DDDDDD 0%, #AAAAAA 100%)",
  windowRadius: "6px",
  
  closeButtonColor: "#FF5F57",
  minimizeButtonColor: "#FEBC2E",
  maximizeButtonColor: "#28C840",
  
  statusBarBackground: "#DEDEDE",
  statusBarBorder: "#888888",
  
  fontFamily: "'Chicago', 'Charcoal', 'Geneva', sans-serif",
  
  boxShadow: "0 6px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)",
  cardBoxShadow: "0 3px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
  hoverBoxShadow: "0 10px 24px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)",
};

// Mac OS X Aqua theme
export const macOSXTheme: ThemeConfig = {
  name: "macOSX",
  backgroundColor: "#E8E8E8",
  borderColor: "#BBBBBB",
  textColor: "#000000",
  accentColor: "#0088FF",

  menuBarBackground: "rgba(236, 236, 236, 0.85)",
  menuBarBorder: "#D0D0D0",
  menuItemHoverBg: "rgba(0, 136, 255, 0.9)",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#FFFFFF",
  windowBorder: "#CCCCCC",
  windowTitlebarBg: "linear-gradient(180deg, #F8F8F8 0%, #E2E2E2 100%)",
  windowRadius: "8px",
  
  closeButtonColor: "#FF5F57",
  minimizeButtonColor: "#FEBC2E",
  maximizeButtonColor: "#28C840",
  
  statusBarBackground: "#F5F5F5",
  statusBarBorder: "#D0D0D0",
  
  fontFamily: "'Lucida Grande', 'Helvetica Neue', sans-serif",
  
  boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)",
  cardBoxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
  hoverBoxShadow: "0 15px 35px rgba(0,0,0,0.15), 0 5px 15px rgba(0,0,0,0.08)",
};

// Modern macOS Big Sur theme
export const modernMacOSTheme: ThemeConfig = {
  name: "modernMacOS",
  backgroundColor: "#F5F5F7",
  borderColor: "#E5E5E7",
  textColor: "#1D1D1F",
  accentColor: "#0080FF",

  menuBarBackground: "rgba(255, 255, 255, 0.85)",
  menuBarBorder: "rgba(0, 0, 0, 0.05)",
  menuItemHoverBg: "rgba(0, 128, 255, 0.9)",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#FFFFFF",
  windowBorder: "rgba(0, 0, 0, 0.08)",
  windowTitlebarBg: "rgba(255, 255, 255, 0.95)",
  windowRadius: "10px",
  
  closeButtonColor: "#FF5F57",
  minimizeButtonColor: "#FEBC2E",
  maximizeButtonColor: "#28C840",
  
  statusBarBackground: "rgba(255, 255, 255, 0.9)",
  statusBarBorder: "rgba(0, 0, 0, 0.05)",
  
  fontFamily: "'SF Pro', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
  
  boxShadow: "0 12px 32px rgba(0,0,0,0.1), 0 2px 15px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
  cardBoxShadow: "0 4px 12px rgba(0,0,0,0.05), 0 1px 5px rgba(0,0,0,0.02)",
  hoverBoxShadow: "0 18px 40px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)",
};

// Dark mode theme (macOS inspired)
export const darkTheme: ThemeConfig = {
  name: "dark",
  backgroundColor: "#1E1E1E",
  borderColor: "#323232",
  textColor: "#F5F5F7",
  accentColor: "#0A84FF",

  menuBarBackground: "rgba(28, 28, 28, 0.85)",
  menuBarBorder: "rgba(255, 255, 255, 0.1)",
  menuItemHoverBg: "rgba(10, 132, 255, 0.8)",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#262626",
  windowBorder: "#323232",
  windowTitlebarBg: "rgba(42, 42, 42, 0.9)",
  windowRadius: "10px",
  
  closeButtonColor: "#FF5F57",
  minimizeButtonColor: "#FEBC2E",
  maximizeButtonColor: "#28C840",
  
  statusBarBackground: "rgba(28, 28, 28, 0.9)",
  statusBarBorder: "rgba(255, 255, 255, 0.1)",
  
  fontFamily: "'SF Pro', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
  
  boxShadow: "0 15px 35px rgba(0,0,0,0.4), 0 5px 20px rgba(0,0,0,0.3)",
  cardBoxShadow: "0 8px 16px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)",
  hoverBoxShadow: "0 20px 45px rgba(0,0,0,0.45), 0 10px 25px rgba(0,0,0,0.35)",
};

// Windows 95 theme
export const win95Theme: ThemeConfig = {
  name: "win95",
  backgroundColor: "#008080", // Classic teal background
  borderColor: "#C0C0C0",
  textColor: "#000000",
  accentColor: "#000080", // Navy blue

  menuBarBackground: "#C0C0C0",
  menuBarBorder: "#808080",
  menuItemHoverBg: "#000080",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#C0C0C0",
  windowBorder: "#808080",
  windowTitlebarBg: "linear-gradient(90deg, #000080 0%, #1084d0 100%)",
  windowRadius: "0px", // Squared corners for Win95
  
  closeButtonColor: "#C0C0C0",
  minimizeButtonColor: "#C0C0C0",
  maximizeButtonColor: "#C0C0C0",
  
  statusBarBackground: "#C0C0C0",
  statusBarBorder: "#808080",
  
  fontFamily: "'MS Sans Serif', 'Tahoma', sans-serif",
  
  boxShadow: "2px 2px 0 rgba(255,255,255,0.7) inset, -2px -2px 0 rgba(0,0,0,0.7) inset, 4px 4px 5px rgba(0,0,0,0.15)",
  cardBoxShadow: "1px 1px 0 rgba(255,255,255,0.7) inset, -1px -1px 0 rgba(0,0,0,0.7) inset",
  hoverBoxShadow: "2px 2px 0 rgba(255,255,255,0.7) inset, -2px -2px 0 rgba(0,0,0,0.7) inset, 6px 6px 8px rgba(0,0,0,0.2)",
};

// Windows XP theme
export const winXPTheme: ThemeConfig = {
  name: "winXP",
  backgroundColor: "#ECE9D8", // Classic XP background
  borderColor: "#0054E3",
  textColor: "#000000",
  accentColor: "#0054E3", // XP Blue

  menuBarBackground: "linear-gradient(180deg, #2A80D2 0%, #1557B6 50%, #0D47A9 100%)",
  menuBarBorder: "#0054E3",
  menuItemHoverBg: "#3C91DF",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#ECE9D8",
  windowBorder: "#0054E3",
  windowTitlebarBg: "linear-gradient(180deg, #2A80D2 0%, #1557B6 50%, #0D47A9 100%)",
  windowRadius: "4px", // Slight rounded corners for XP
  
  closeButtonColor: "#FF0000",
  minimizeButtonColor: "#FFFF00",
  maximizeButtonColor: "#00FF00",
  
  statusBarBackground: "#ECE9D8",
  statusBarBorder: "#ACA899",
  
  fontFamily: "'Tahoma', 'Arial', sans-serif",
  
  boxShadow: "0 2px 10px rgba(0,0,0,0.3), 0 0 5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,84,227,0.5)",
  cardBoxShadow: "0 1px 5px rgba(0,0,0,0.2), 0 0 2px rgba(0,0,0,0.1)",
  hoverBoxShadow: "0 5px 15px rgba(0,0,0,0.35), 0 0 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,84,227,0.7)",
};

// Ubuntu theme
export const ubuntuTheme: ThemeConfig = {
  name: "ubuntu",
  backgroundColor: "#2C001E", // Ubuntu purple background
  borderColor: "#E95420",
  textColor: "#FFFFFF",
  accentColor: "#E95420", // Ubuntu orange

  menuBarBackground: "#300A24", // Darker purple for the menubar
  menuBarBorder: "#2C001E",
  menuItemHoverBg: "#E95420",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#2C001E",
  windowBorder: "#E95420",
  windowTitlebarBg: "linear-gradient(to bottom, #E95420, #CD4116)", // Ubuntu orange gradient
  windowRadius: "8px",
  
  closeButtonColor: "#E95420",
  minimizeButtonColor: "#F9BC2D",
  maximizeButtonColor: "#27AA4A",
  
  statusBarBackground: "#300A24",
  statusBarBorder: "#2C001E",
  
  fontFamily: "'Ubuntu', 'Noto Sans', 'Liberation Sans', sans-serif",
  
  boxShadow: "0 10px 25px rgba(0,0,0,0.4), 0 5px 10px rgba(0,0,0,0.25)",
  cardBoxShadow: "0 4px 12px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2)",
  hoverBoxShadow: "0 15px 30px rgba(0,0,0,0.5), 0 8px 15px rgba(0,0,0,0.3)",
};

// Neobrutalism theme
export const neoBrutalismTheme: ThemeConfig = {
  name: "neoBrutalism",
  backgroundColor: "#FDFD96", // Bright yellow background
  borderColor: "#000000",
  textColor: "#000000",
  accentColor: "#FF498B", // Hot pink

  menuBarBackground: "#FDFD96",
  menuBarBorder: "#000000",
  menuItemHoverBg: "#FF498B",
  menuItemHoverText: "#000000",
  
  windowBackground: "#FFFFFF",
  windowBorder: "#000000",
  windowTitlebarBg: "#4DEEEA", // Bright cyan/blue
  windowRadius: "12px",
  
  closeButtonColor: "#FF0000",
  minimizeButtonColor: "#FFFF00",
  maximizeButtonColor: "#00FF00",
  
  statusBarBackground: "#74EE15", // Bright green
  statusBarBorder: "#000000",
  
  fontFamily: "'Archivo Black', 'Arial Black', sans-serif",
  
  boxShadow: "6px 6px 0px #000000, 0 15px 25px rgba(0,0,0,0.08)",
  cardBoxShadow: "4px 4px 0px #000000",
  hoverBoxShadow: "8px 8px 0px #000000, 0 8px 15px rgba(0,0,0,0.05)",
};

// Liquid Glass theme (glassmorphic)
export const liquidGlassLightTheme: ThemeConfig = {
  name: "liquidGlassLight",
  backgroundColor: "#E6EBF5",
  borderColor: "rgba(255,255,255,0.4)",
  textColor: "#0F172A",
  accentColor: "#4F46E5",

  menuBarBackground: "rgba(255,255,255,0.55)",
  menuBarBorder: "rgba(255,255,255,0.35)",
  menuItemHoverBg: "rgba(79,70,229,0.15)",
  menuItemHoverText: "#0F172A",

  windowBackground: "rgba(255,255,255,0.6)",
  windowBorder: "rgba(255,255,255,0.35)",
  windowTitlebarBg: "rgba(255,255,255,0.45)",
  windowRadius: "14px",

  closeButtonColor: "#ef4444",
  minimizeButtonColor: "#f59e0b",
  maximizeButtonColor: "#22c55e",

  statusBarBackground: "rgba(255,255,255,0.45)",
  statusBarBorder: "rgba(255,255,255,0.35)",

  fontFamily: "'SF Pro', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",

  boxShadow: "0 10px 30px rgba(31,41,55,0.15), 0 1px 0 0 rgba(255,255,255,0.4) inset",
  cardBoxShadow: "0 6px 20px rgba(31,41,55,0.12)",
  hoverBoxShadow: "0 16px 40px rgba(31,41,55,0.18)",
};

export const liquidGlassDarkTheme: ThemeConfig = {
  name: "liquidGlassDark",
  backgroundColor: "#0F172A",
  borderColor: "rgba(255,255,255,0.12)",
  textColor: "#E5E7EB",
  accentColor: "#60A5FA",

  menuBarBackground: "rgba(15, 23, 42, 0.55)",
  menuBarBorder: "rgba(255,255,255,0.12)",
  menuItemHoverBg: "rgba(96,165,250,0.16)",
  menuItemHoverText: "#E5E7EB",

  windowBackground: "rgba(17, 24, 39, 0.55)",
  windowBorder: "rgba(255,255,255,0.12)",
  windowTitlebarBg: "rgba(17, 24, 39, 0.45)",
  windowRadius: "14px",

  closeButtonColor: "#ef4444",
  minimizeButtonColor: "#f59e0b",
  maximizeButtonColor: "#22c55e",

  statusBarBackground: "rgba(15, 23, 42, 0.45)",
  statusBarBorder: "rgba(255,255,255,0.12)",

  fontFamily: "'SF Pro', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",

  boxShadow: "0 15px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05) inset",
  cardBoxShadow: "0 10px 30px rgba(0,0,0,0.45)",
  hoverBoxShadow: "0 18px 50px rgba(0,0,0,0.6)",
};

// Get the stored theme from localStorage or default to macClassic
function getStoredTheme(): ThemeConfig {
  if (typeof window !== 'undefined') {
    const storedThemeName = localStorage.getItem('blog-theme-preference');
    if (storedThemeName && storedThemeName in allThemes) {
      return allThemes[storedThemeName as ThemeName];
    }
  }
  return macClassicTheme;
}

// List of all available themes
export const allThemes = {
  macClassic: macClassicTheme,
  macOSX: macOSXTheme,
  modernMacOS: modernMacOSTheme,
  dark: darkTheme,
  win95: win95Theme,
  winXP: winXPTheme,
  ubuntu: ubuntuTheme,
  neoBrutalism: neoBrutalismTheme,
  liquidGlassLight: liquidGlassLightTheme,
  liquidGlassDark: liquidGlassDarkTheme,
};

// Define valid theme names as a type
export type ThemeName = keyof typeof allThemes;

// Active theme - set from localStorage or default to Mac Classic
export let activeTheme: ThemeConfig = getStoredTheme();

// Function to change the active theme
export function setTheme(themeName: string) {
  const newTheme = allThemes[themeName as ThemeName] || macClassicTheme;
  activeTheme = newTheme;
  
  // Save theme preference to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('blog-theme-preference', themeName);
  }
  
  // Dispatch an event to notify components that theme has changed
  const event = new CustomEvent('themechange', { detail: newTheme });
  window.dispatchEvent(event);
  
  return newTheme;
}

export const themes: Record<string, any> = {
  macClassic: macClassicTheme,
  macOSX: macOSXTheme,
  modernMacOS: modernMacOSTheme,
  dark: darkTheme,
  win95: win95Theme,
  winXP: winXPTheme,
  ubuntu: {
    name: "ubuntu",
    backgroundColor: "#300A24",
    windowBackground: "#421934",
    cardBackground: "#4F2043",
    titleBarBackground: "linear-gradient(90deg, #E95420 0%, #FF8A50 100%)",
    menuBackground: "rgba(48, 10, 36, 0.95)",
    dropdownBackground: "rgba(66, 25, 52, 0.95)",
    accentColor: "#FF6E33",
    textColor: "#FFFFFF",
    titleColor: "#FFFFFF",
    menuTextColor: "#FFFFFF",
    headingColor: "#FF8A50",
    mutedTextColor: "#E0CBDD",
    borderColor: "#662D56",
    tagBackground: "linear-gradient(90deg, #E95420 0%, #FF8A50 100%)",
    tagTextColor: "#FFFFFF",
    secondaryTagBackground: "#7A306C",
    secondaryTagTextColor: "#FFFFFF",
    inputBackground: "rgba(79, 32, 67, 0.8)",
    iconColor: "#FF8A50",
    borderWidth: 1,
    borderRadius: "12px",
    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 110, 51, 0.1)",
    hoverBoxShadow: "0 14px 28px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 110, 51, 0.2)",
    fontFamily: "'Ubuntu', system-ui, sans-serif",
  },
  neoBrutalism: neoBrutalismTheme
};