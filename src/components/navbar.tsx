import React, { useState, useEffect, useRef } from "react";
import { activeTheme } from "@/lib/theme-config";
import { MenuBar } from "./menu/menu-bar";
import { MainWindow } from "./main-window";
import { RecentPosts } from "./posts/recent-posts";
import { StatusBar } from "./ui/status-bar";
import { PostService } from "@/services/post-service";
import type { Post } from "@/types/post";

export default function Navbar() {
	// State management
	const [theme, setTheme] = useState(activeTheme);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [windowTitle, setWindowTitle] = useState("Blog - Home");
	// Changed default value to true to show recent posts on load
	const [showRecentPosts, setShowRecentPosts] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Post[]>([]);
	const [recentPosts, setRecentPosts] = useState<Post[]>([]);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Load posts on component mount
	useEffect(() => {
		setRecentPosts(PostService.getRecentPosts());
	}, []);

	// Search functionality
	useEffect(() => {
		if (searchQuery) {
			setSearchResults(PostService.searchPosts(searchQuery));
		} else {
			setSearchResults([]);
		}
	}, [searchQuery]);

	// Update theme when it changes or on initial load
	useEffect(() => {
		const handleThemeChange = () => {
			setTheme(activeTheme);
		};

		// Apply theme from localStorage on initial load
		setTheme(activeTheme);

		window.addEventListener("themechange", handleThemeChange);
		return () => window.removeEventListener("themechange", handleThemeChange);
	}, []);

	// Update clock
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	// Toggle recent posts window
	const toggleRecentPosts = () => {
		setShowRecentPosts(!showRecentPosts);
	};

	// Focus search input when search button is clicked
	const focusSearch = () => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	};

	return (
		<div
			className="w-full flex flex-col items-center min-h-screen"
			style={{
				background: theme.backgroundColor,
				color: theme.textColor,
				fontFamily: theme.fontFamily,
			}}
		>
			{/* Top Mac-style menubar */}
			<MenuBar
				theme={theme}
				currentTime={currentTime}
				toggleRecentPosts={toggleRecentPosts}
				focusSearch={focusSearch}
				recentPosts={recentPosts}
				setWindowTitle={setWindowTitle}
			/>

			{/* Main window content area */}
			<div className="container mx-auto my-8 flex flex-wrap gap-8">
				{/* Main blog window */}
				<div className="flex-1" style={{ minWidth: "60%" }}>
					<MainWindow
						theme={theme}
						windowTitle={windowTitle}
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						searchResults={searchResults}
						setWindowTitle={setWindowTitle}
						searchInputRef={searchInputRef}
					/>
				</div>

				{/* Recent Posts Window - always visible */}
				{showRecentPosts && (
					<RecentPosts
						posts={recentPosts}
						theme={theme}
						onClose={toggleRecentPosts}
					/>
				)}
			</div>

			{/* Status bar */}
			<StatusBar theme={theme} />
		</div>
	);
}
