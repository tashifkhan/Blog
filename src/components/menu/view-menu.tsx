import React from "react";
import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarCheckboxItem,
} from "../ui/menubar";

interface ViewMenuProps {
	theme: any;
}

export function ViewMenu({ theme }: ViewMenuProps) {
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
				View
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
				}}
			>
				<MenubarCheckboxItem
					className="rounded-none text-xs font-medium"
					checked={true}
				>
					Show Toolbar
				</MenubarCheckboxItem>
				<MenubarCheckboxItem
					className="rounded-none text-xs font-medium"
					checked={true}
				>
					Show Status Bar
				</MenubarCheckboxItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Zoom In
					<MenubarShortcut>⌘+</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Zoom Out
					<MenubarShortcut>⌘-</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Reset Zoom
					<MenubarShortcut>⌘0</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Toggle Fullscreen
					<MenubarShortcut>F11</MenubarShortcut>
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
