import React from "react";
import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
	MenubarShortcut,
} from "../ui/menubar";

interface Post {
	id: number;
	title: string;
	date: string;
	excerpt: string;
}

interface RecentPostsMenuProps {
	theme: any;
	toggleRecentPosts: () => void;
	recentPosts: Post[];
}

export function RecentPostsMenu({
	theme,
	toggleRecentPosts,
	recentPosts,
}: RecentPostsMenuProps) {
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
				Recent Posts
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
					onClick={toggleRecentPosts}
				>
					Show Recent Posts
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				{recentPosts.slice(0, 3).map((post) => (
					<MenubarItem
						key={post.id}
						className="rounded-none text-xs font-medium"
					>
						{post.title}
					</MenubarItem>
				))}
				<MenubarItem className="rounded-none text-xs font-medium">
					View All Posts
					<MenubarShortcut>⌘P</MenubarShortcut>
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
