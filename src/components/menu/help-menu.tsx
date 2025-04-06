import React from "react";
import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
} from "../ui/menubar";

interface HelpMenuProps {
	theme: any;
}

export function HelpMenu({ theme }: HelpMenuProps) {
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
				Help
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
				}}
			>
				<MenubarItem className="rounded-none text-xs font-medium">
					Documentation
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Keyboard Shortcuts
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Report an Issue
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					About Blog OS
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
