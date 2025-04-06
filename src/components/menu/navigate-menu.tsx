import React from "react";
import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
	MenubarShortcut,
} from "../ui/menubar";

interface NavigateMenuProps {
	theme: any;
	setWindowTitle: (title: string) => void;
}

export function NavigateMenu({ theme, setWindowTitle }: NavigateMenuProps) {
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
				Navigate
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
				}}
			>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => setWindowTitle("Blog - Home")}
				>
					Home
					<MenubarShortcut>⌘H</MenubarShortcut>
				</MenubarItem>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => setWindowTitle("Blog - Blog")}
				>
					Blog
					<MenubarShortcut>⌘B</MenubarShortcut>
				</MenubarItem>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => setWindowTitle("Blog - Projects")}
				>
					Projects
					<MenubarShortcut>⌘P</MenubarShortcut>
				</MenubarItem>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => setWindowTitle("Blog - About")}
				>
					About
					<MenubarShortcut>⌘I</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem className="rounded-none text-xs font-medium">
					Back
					<MenubarShortcut>⌘←</MenubarShortcut>
				</MenubarItem>
				<MenubarItem className="rounded-none text-xs font-medium">
					Forward
					<MenubarShortcut>⌘→</MenubarShortcut>
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
