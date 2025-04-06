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
  
  // Control buttons
  closeButtonColor: string;
  minimizeButtonColor: string;
  maximizeButtonColor: string;
  
  // Status bar
  statusBarBackground: string;
  statusBarBorder: string;
  
  // Typography
  fontFamily: string;
};

// Classic Mac OS 9 theme (System 8/9)
export const macClassicTheme: ThemeConfig = {
  name: "macClassic",
  backgroundColor: "#CCCCCC",
  borderColor: "#999999",
  textColor: "#000000",
  accentColor: "#0058AE", // Classic blue highlight

  menuBarBackground: "#CCCCCC",
  menuBarBorder: "#999999",
  menuItemHoverBg: "#0058AE",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#FFFFFF",
  windowBorder: "#999999",
  windowTitlebarBg: "linear-gradient(180deg, #CCCCCC 0%, #AAAAAA 100%)",
  
  closeButtonColor: "#FF5F57",
  minimizeButtonColor: "#FEBC2E",
  maximizeButtonColor: "#28C840",
  
  statusBarBackground: "#CCCCCC",
  statusBarBorder: "#999999",
  
  fontFamily: "'Chicago', 'Charcoal', 'Geneva', sans-serif",
};

// Mac OS X Aqua theme
export const macOSXTheme: ThemeConfig = {
  name: "macOSX",
  backgroundColor: "#E2E2E2",
  borderColor: "#BBBBBB",
  textColor: "#000000",
  accentColor: "#1E7BF6",

  menuBarBackground: "rgba(236, 236, 236, 0.8)",
  menuBarBorder: "#D0D0D0",
  menuItemHoverBg: "#1E7BF6",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#FFFFFF",
  windowBorder: "#CCCCCC",
  windowTitlebarBg: "linear-gradient(180deg, #F6F6F6 0%, #E2E2E2 100%)",
  
  closeButtonColor: "#FF5F57",
  minimizeButtonColor: "#FEBC2E",
  maximizeButtonColor: "#28C840",
  
  statusBarBackground: "#F5F5F5",
  statusBarBorder: "#D0D0D0",
  
  fontFamily: "'Lucida Grande', 'Helvetica Neue', sans-serif",
};

// Modern macOS Big Sur theme
export const modernMacOSTheme: ThemeConfig = {
  name: "modernMacOS",
  backgroundColor: "#F5F5F7",
  borderColor: "#E2E2E7",
  textColor: "#1D1D1F",
  accentColor: "#0071E3",

  menuBarBackground: "rgba(255, 255, 255, 0.7)",
  menuBarBorder: "rgba(0, 0, 0, 0.1)",
  menuItemHoverBg: "rgba(0, 113, 227, 0.9)",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#FFFFFF",
  windowBorder: "rgba(0, 0, 0, 0.1)",
  windowTitlebarBg: "rgba(255, 255, 255, 0.9)",
  
  closeButtonColor: "#FF5F57",
  minimizeButtonColor: "#FEBC2E",
  maximizeButtonColor: "#28C840",
  
  statusBarBackground: "rgba(255, 255, 255, 0.8)",
  statusBarBorder: "rgba(0, 0, 0, 0.1)",
  
  fontFamily: "'SF Pro', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
};

// Dark mode theme
export const darkTheme: ThemeConfig = {
  name: "dark",
  backgroundColor: "#333333",
  borderColor: "#555555",
  textColor: "#FFFFFF",
  accentColor: "#0D84FF",

  menuBarBackground: "#222222",
  menuBarBorder: "#444444",
  menuItemHoverBg: "#0D84FF",
  menuItemHoverText: "#FFFFFF",
  
  windowBackground: "#333333",
  windowBorder: "#555555",
  windowTitlebarBg: "linear-gradient(180deg, #444444 0%, #333333 100%)",
  
  closeButtonColor: "#FF5F57",
  minimizeButtonColor: "#FEBC2E",
  maximizeButtonColor: "#28C840",
  
  statusBarBackground: "#222222",
  statusBarBorder: "#444444",
  
  fontFamily: "'SF Mono', 'Monaco', monospace",
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
  
  closeButtonColor: "#C0C0C0",
  minimizeButtonColor: "#C0C0C0",
  maximizeButtonColor: "#C0C0C0",
  
  statusBarBackground: "#C0C0C0",
  statusBarBorder: "#808080",
  
  fontFamily: "'MS Sans Serif', 'Tahoma', sans-serif",
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
  
  closeButtonColor: "#FF0000",
  minimizeButtonColor: "#FFFF00",
  maximizeButtonColor: "#00FF00",
  
  statusBarBackground: "#ECE9D8",
  statusBarBorder: "#ACA899",
  
  fontFamily: "'Tahoma', 'Arial', sans-serif",
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
  
  closeButtonColor: "#E95420",
  minimizeButtonColor: "#F9BC2D",
  maximizeButtonColor: "#27AA4A",
  
  statusBarBackground: "#300A24",
  statusBarBorder: "#2C001E",
  
  fontFamily: "'Ubuntu', 'Noto Sans', 'Liberation Sans', sans-serif",
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
  
  closeButtonColor: "#FF0000",
  minimizeButtonColor: "#FFFF00",
  maximizeButtonColor: "#00FF00",
  
  statusBarBackground: "#74EE15", // Bright green
  statusBarBorder: "#000000",
  
  fontFamily: "'Archivo Black', 'Arial Black', sans-serif",
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
  neoBrutalism: neoBrutalismTheme
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