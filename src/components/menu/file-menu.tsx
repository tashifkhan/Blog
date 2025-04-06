import React from "react";
import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
} from "../ui/menubar";

interface FileMenuProps {
	theme: any;
}

export function FileMenu({ theme }: FileMenuProps) {
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
				File
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
				}}
			>
				<MenubarItem className="rounded-none text-xs font-medium">
					New Post
					<MenubarShortcut>⌘N</MenubarShortcut>
				</MenubarItem>
				<MenubarSub>
					<MenubarSubTrigger className="rounded-none text-xs font-medium">
						Open Recent
					</MenubarSubTrigger>
					<MenubarSubContent
						className="min-w-[180px] rounded-none"
						style={{
							backgroundColor: theme.menuBarBackground,
							border: `1px solid ${theme.menuBarBorder}`,
						}}
					>
						<MenubarItem className="rounded-none text-xs font-medium">
							Getting Started with React
						</MenubarItem>
						<MenubarItem className="rounded-none text-xs font-medium">
							CSS Grid Layout
						</MenubarItem>
						<MenubarItem className="rounded-none text-xs font-medium">
							JavaScript Promises
						</MenubarItem>
						<MenubarSeparator
							style={{ backgroundColor: theme.menuBarBorder }}
						/>
						<MenubarItem className="rounded-none text-xs font-medium">
							Clear Recent
						</MenubarItem>
					</MenubarSubContent>
				</MenubarSub>
				<MenubarItem className="rounded-none text-xs font-medium">
					Open...
					<MenubarShortcut>⌘O</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Save
					<MenubarShortcut>⌘S</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Save As...
					<MenubarShortcut>⇧⌘S</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Export
					<MenubarShortcut>⌘E</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Print...
					<MenubarShortcut>⌘P</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Exit
					<MenubarShortcut>⌘Q</MenubarShortcut>
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
