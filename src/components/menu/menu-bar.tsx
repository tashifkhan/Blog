import React from "react";
import { Menubar } from "../ui/menubar";
import { Apple, SearchIcon } from "lucide-react";
import { FileMenu } from "./file-menu";
import { EditMenu } from "./edit-menu";
import { ViewMenu } from "./view-menu";
import { NavigateMenu } from "./navigate-menu";
import { AppearanceMenu } from "./appearance-menu";
import { HelpMenu } from "./help-menu";
import { RecentPostsMenu } from "./recent-posts-menu";
import { ReaderMenu } from "./reader-menu";
import type { Post } from "@/types/post";

interface MenuBarProps {
	theme: any;
	currentTime: Date;
	toggleRecentPosts: () => void;
	focusSearch: () => void;
	recentPosts: Post[];
	setWindowTitle: (title: string) => void;
}

export function MenuBar({
	theme,
	currentTime,
	toggleRecentPosts,
	focusSearch,
	recentPosts,
	setWindowTitle,
}: MenuBarProps) {
	const styles = {
		menuBar: {
			background: theme.menuBarBackground,
			borderBottom: `1px solid ${theme.menuBarBorder}`,
			fontFamily: theme.fontFamily,
		},
	};

	return (
		<div
			className="w-full shadow-sm sticky top-0 z-50"
			style={{ ...styles.menuBar, color: theme.textColor }}
		>
			<div className="container mx-auto flex items-center h-6">
				<div className="flex items-center mr-4">
					<Apple size={16} className="text-black" />
				</div>
				<Menubar className="border-none bg-transparent h-6 p-0 flex space-x-0">
					<FileMenu theme={theme} recentPosts={recentPosts} />
					<EditMenu theme={theme} onFind={focusSearch} />
					<ViewMenu theme={theme} />
					<NavigateMenu theme={theme} setWindowTitle={setWindowTitle} />
					<ReaderMenu theme={theme} />
					<AppearanceMenu theme={theme} />
					<HelpMenu theme={theme} />
					<RecentPostsMenu
						theme={theme}
						toggleRecentPosts={toggleRecentPosts}
						recentPosts={recentPosts}
					/>
				</Menubar>

				<div className="ml-auto flex items-center space-x-2 mr-2">
					<button
						className="flex items-center text-xs"
						onClick={focusSearch}
						style={{ color: theme.textColor }}
					>
						<SearchIcon size={12} className="mr-1" />
						Search
					</button>
					<div className="text-[10px]" style={{ color: theme.textColor }}>
						{currentTime.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
