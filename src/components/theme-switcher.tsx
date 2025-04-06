import React from "react";
import { allThemes, setTheme } from "@/lib/theme-config";

export default function ThemeSwitcher() {
	const handleThemeChange = (themeName: string) => {
		setTheme(themeName);
	};

	return (
		<div className="theme-switcher">
			<div className="grid grid-cols-2 gap-1">
				{Object.entries(allThemes).map(([key, theme]) => (
					<button
						key={key}
						className="p-1 text-xs rounded hover:bg-opacity-80"
						style={{
							backgroundColor: theme.backgroundColor,
							color: theme.textColor,
							border: `1px solid ${theme.borderColor}`,
						}}
						onClick={() => handleThemeChange(key)}
					>
						{theme.name}
					</button>
				))}
			</div>
		</div>
	);
}
