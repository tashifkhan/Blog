// Theme configuration for retro Mac OS styling
export type ThemeConfig = {
  // Base colors
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  
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

// Dark mode theme
export const darkTheme: ThemeConfig = {
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

// Active theme - set default to Mac Classic
export let activeTheme: ThemeConfig = macClassicTheme;

// Function to change the active theme
export function setTheme(theme: ThemeConfig) {
  activeTheme = theme;
}