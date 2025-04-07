import React, { useState } from "react";
import { allThemes, setTheme, activeTheme } from "@/lib/theme-config";
import { motion } from "framer-motion";

export default function ThemeSwitcher() {
	const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

	const handleThemeChange = (themeName: string) => {
		setTheme(themeName);
	};

	return (
		<div className="theme-switcher p-3 rounded-lg">
			<h3 className="text-center font-bold mb-3">Choose Theme</h3>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
				{Object.entries(allThemes).map(([key, theme]) => {
					const isActive = theme.name === activeTheme.name;

					return (
						<motion.button
							key={key}
							className="theme-button rounded-lg overflow-hidden flex flex-col"
							style={{
								borderWidth: "2px",
								borderStyle: "solid",
								borderColor: isActive ? theme.accentColor : theme.borderColor,
								boxShadow: isActive
									? `0 0 0 2px ${theme.accentColor}`
									: hoveredTheme === key
									? "0 4px 12px rgba(0,0,0,0.15)"
									: "0 2px 6px rgba(0,0,0,0.1)",
								transition: "all 0.2s ease",
							}}
							onClick={() => handleThemeChange(key)}
							onMouseEnter={() => setHoveredTheme(key)}
							onMouseLeave={() => setHoveredTheme(null)}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.98 }}
						>
							{/* Theme preview thumbnail */}
							<div
								className="theme-preview p-1"
								style={{ backgroundColor: theme.backgroundColor }}
							>
								<div
									className="window-preview w-full"
									style={{
										backgroundColor: theme.windowBackground,
										borderRadius: "6px",
										height: "30px",
										borderColor: theme.borderColor,
										borderWidth: "1px",
										borderStyle: "solid",
										display: "flex",
										flexDirection: "column",
									}}
								>
									<div
										style={{
											backgroundColor: theme.windowTitlebarBg,
											height: "8px",
											borderTopLeftRadius: "4px",
											borderTopRightRadius: "4px",
										}}
									></div>
								</div>
							</div>

							{/* Theme name */}
							<div
								className="theme-name w-full text-xs font-medium py-2 text-center"
								style={{
									backgroundColor: theme.menuBarBackground,
									color: theme.textColor,
								}}
							>
								{theme.name}
							</div>
						</motion.button>
					);
				})}
			</div>
		</div>
	);
}
