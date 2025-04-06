import React from "react";
import { MenubarMenu, MenubarTrigger, MenubarContent } from "./menubar";

interface MenuBarItemProps {
	label: string;
	theme: any;
	children?: React.ReactNode;
}

export function MenuBarItem({ label, theme, children }: MenuBarItemProps) {
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
				{label}
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
				}}
			>
				{children}
			</MenubarContent>
		</MenubarMenu>
	);
}
