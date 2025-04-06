import React from "react";
import {
	macClassicTheme,
	macOSXTheme,
	darkTheme,
	setTheme,
	activeTheme,
} from "@/lib/theme-config";
import { useEffect, useState } from "react";
import { MenubarItem } from "./ui/menubar";

export default function ThemeSwitcher() {
	const [currentTheme, setCurrentTheme] = useState(activeTheme);

	const changeTheme = (theme: typeof activeTheme) => {
		setTheme(theme);
		setCurrentTheme(theme);
		// Force re-render of components that use the theme
		window.dispatchEvent(new Event("themechange"));
	};

	return (
		<div className="flex flex-col">
			<MenubarItem
				onClick={() => changeTheme(macClassicTheme)}
				className={
					currentTheme === macClassicTheme ? "bg-[#0058AE] text-white" : ""
				}
			>
				Mac OS Classic
			</MenubarItem>

			<MenubarItem
				onClick={() => changeTheme(macOSXTheme)}
				className={
					currentTheme === macOSXTheme ? "bg-[#1E7BF6] text-white" : ""
				}
			>
				Mac OS X Aqua
			</MenubarItem>

			<MenubarItem
				onClick={() => changeTheme(darkTheme)}
				className={currentTheme === darkTheme ? "bg-[#0D84FF] text-white" : ""}
			>
				Dark Mode
			</MenubarItem>
		</div>
	);
}
