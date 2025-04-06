import React from "react";
import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
} from "../ui/menubar";
import ThemeSwitcher from "../theme-switcher";
import { allThemes, setTheme } from "@/lib/theme-config";

interface AppearanceMenuProps {
	theme: any;
}

export function AppearanceMenu({ theme }: AppearanceMenuProps) {
	return (
		<MenubarMenu>
			<MenubarTrigger
				className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold"
				style={{
					color: theme.textColor,
					backgroundColor: "transparent",
				}}
				data-theme-hover-bg={theme.menuItemHoverBg}
				data-theme-hover-text={theme.menuItemHoverText}
			>
				Appearance
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
				}}
			>
				<MenubarRadioGroup value={theme.name}>
					{Object.entries(allThemes).map(([key, themeItem]) => (
						<MenubarRadioItem
							key={key}
							className="rounded-none text-xs font-medium"
							value={themeItem.name}
							onClick={() => setTheme(key)}
						>
							{themeItem.name}
						</MenubarRadioItem>
					))}
				</MenubarRadioGroup>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<div className="px-2 py-1.5">
					<ThemeSwitcher />
				</div>
			</MenubarContent>
		</MenubarMenu>
	);
}
