import React from "react";
import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
	MenubarShortcut,
} from "../ui/menubar";

interface EditMenuProps {
	theme: any;
}

export function EditMenu({ theme }: EditMenuProps) {
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
				Edit
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
				}}
			>
				<MenubarItem className="rounded-none text-xs font-medium">
					Undo
					<MenubarShortcut>⌘Z</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Redo
					<MenubarShortcut>⇧⌘Z</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Cut
					<MenubarShortcut>⌘X</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Copy
					<MenubarShortcut>⌘C</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Paste
					<MenubarShortcut>⌘V</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Select All
					<MenubarShortcut>⌘A</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Find
					<MenubarShortcut>⌘F</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Replace
					<MenubarShortcut>⌘H</MenubarShortcut>
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
