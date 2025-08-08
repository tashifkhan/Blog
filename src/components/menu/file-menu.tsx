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
	recentPosts?: Array<{ slug?: string; title?: string }>;
}

export function FileMenu({ theme, recentPosts = [] }: FileMenuProps) {
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
					color: theme.textColor,
				}}
			>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() =>
						alert("New Post action is not implemented in static mode.")
					}
				>
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
						{recentPosts.slice(0, 5).map((p, idx) => {
							const href = p.slug ? `/blog/${p.slug}/` : "/blog/";
							const key = p.slug || p.title || String(idx);
							return (
								<a key={key} href={href} className="no-underline">
									<MenubarItem
										className="rounded-none text-xs font-medium"
										role="menuitem"
									>
										{p.title || p.slug || "Untitled"}
									</MenubarItem>
								</a>
							);
						})}
						<MenubarSeparator
							style={{ backgroundColor: theme.menuBarBorder }}
						/>
						<MenubarItem
							className="rounded-none text-xs font-medium"
							onClick={() =>
								alert("Recent list is session-based in this demo.")
							}
						>
							Clear Recent
						</MenubarItem>
					</MenubarSubContent>
				</MenubarSub>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => alert("Open is unavailable in static mode.")}
				>
					Open...
					<MenubarShortcut>⌘O</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => alert("Nothing to save in static mode.")}
				>
					Save
					<MenubarShortcut>⌘S</MenubarShortcut>
				</MenubarItem>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => alert("Save As not available in static mode.")}
				>
					Save As...
					<MenubarShortcut>⇧⌘S</MenubarShortcut>
				</MenubarItem>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => window.print()}
				>
					Export (Print)
					<MenubarShortcut>⌘E</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => window.print()}
				>
					Print...
					<MenubarShortcut>⌘P</MenubarShortcut>
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => alert("Use your browser/tab controls to exit.")}
				>
					Exit
					<MenubarShortcut>⌘Q</MenubarShortcut>
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
