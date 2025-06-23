import React, { useState, useEffect, useRef } from "react";
import { activeTheme } from "@/lib/theme-config";
import { MenuBar } from "./menu/menu-bar";
import { MainWindow } from "./main-window";
import { RecentPosts } from "./posts/recent-posts";
import { StatusBar } from "./ui/status-bar";
import type { Post } from "@/types/post";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
	// State management
	const [theme, setTheme] = useState(activeTheme);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [windowTitle, setWindowTitle] = useState("Blog - Home");
	// Changed default value to true to show recent posts on load
	const [showRecentPosts, setShowRecentPosts] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Post[]>([]);
	const [posts, setPosts] = useState<Post[]>([]);
	const [recentPosts, setRecentPosts] = useState<Post[]>([]);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Window state management
	const [mainWindowState, setMainWindowState] = useState<
		"normal" | "minimized" | "maximized"
	>("normal");
	const [recentPostsState, setRecentPostsState] = useState<
		"normal" | "minimized" | "maximized"
	>("normal");

	// Client-side only code
	const [isMounted, setIsMounted] = useState(false);

	// Run only on client-side to prevent hydration issues
	useEffect(() => {
		setIsMounted(true);
		// Fetch real posts from API
		fetch("/api/posts.json")
			.then((res) => res.json())
			.then((data) => {
				setPosts(data);
				setRecentPosts(
					[...data]
						.sort(
							(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
						)
						.slice(0, 3)
				);
			});
		setTheme(activeTheme);
	}, []);

	// Search functionality
	useEffect(() => {
		if (!isMounted) return;
		if (searchQuery) {
			const lowercaseQuery = searchQuery.toLowerCase();
			setSearchResults(
				posts.filter(
					(post) =>
						post.title?.toLowerCase().includes(lowercaseQuery) ||
						post.excerpt?.toLowerCase().includes(lowercaseQuery) ||
						post.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
				)
			);
		} else {
			setSearchResults([]);
		}
	}, [searchQuery, isMounted, posts]);

	// Update theme when it changes
	useEffect(() => {
		if (!isMounted) return; // Skip on server-side

		const handleThemeChange = () => {
			setTheme(activeTheme);
		};

		window.addEventListener("themechange", handleThemeChange);
		return () => window.removeEventListener("themechange", handleThemeChange);
	}, [isMounted]);

	// Update clock
	useEffect(() => {
		if (!isMounted) return; // Skip on server-side

		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, [isMounted]);

	// Toggle recent posts window
	const toggleRecentPosts = () => {
		setShowRecentPosts(!showRecentPosts);
		if (!showRecentPosts) {
			setRecentPostsState("normal");
		}
	};

	// Window control handlers for main window
	const handleMainWindowClose = () => {
		setWindowTitle("Blog - Home");
		setSearchQuery("");
		setSearchResults([]);
	};

	const handleMainWindowMinimize = () => {
		setMainWindowState("minimized");
	};

	const handleMainWindowMaximize = () => {
		setMainWindowState(
			mainWindowState === "maximized" ? "normal" : "maximized"
		);
	};

	// Window control handlers for recent posts
	const handleRecentPostsClose = () => {
		setShowRecentPosts(false);
	};

	const handleRecentPostsMinimize = () => {
		setRecentPostsState("minimized");
	};

	const handleRecentPostsMaximize = () => {
		setRecentPostsState(
			recentPostsState === "maximized" ? "normal" : "maximized"
		);
	};

	// Focus search input when search button is clicked
	const focusSearch = () => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	};

	// Get window container style for theme-specific styling
	const getWindowContainerStyle = () => {
		const baseStyle = {};

		if (theme.name === "neoBrutalism") {
			return baseStyle; // No special container styles for neoBrutalism
		}

		if (theme.name === "cyberpunk") {
			return {
				...baseStyle,
				padding: "12px",
				borderRadius: "16px",
				background: "rgba(10, 10, 30, 0.1)",
				boxShadow: "0 0 30px rgba(0, 255, 255, 0.15)",
				backdropFilter: "blur(5px)",
			};
		}

		if (theme.name === "neon") {
			return {
				...baseStyle,
				padding: "12px",
				borderRadius: "16px",
				background: "rgba(10, 10, 30, 0.2)",
				boxShadow: `0 0 25px ${theme.accentColor || "#00ffff"}60`,
				backdropFilter: "blur(8px)",
			};
		}

		if (theme.name === "dark") {
			return {
				...baseStyle,
				padding: "8px",
				borderRadius: "16px",
				background: "rgba(20, 20, 25, 0.4)",
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
				backdropFilter: "blur(12px)",
			};
		}

		return baseStyle;
	};

	// If we're rendering on the server or before client mount, use a simplified version
	// to avoid hydration mismatch
	if (!isMounted) {
		return (
			<div
				className="w-full flex flex-col items-center min-h-screen"
				style={{
					backgroundColor: "#FDFD96",
					color: "#000000",
					fontFamily: "'Archivo Black', 'Arial Black', sans-serif",
				}}
			>
				{/* Simple loading state or initial render */}
				<div className="p-4">Loading...</div>
			</div>
		);
	}

	return (
		<div
			className="w-full flex flex-col items-center min-h-screen"
			style={{
				backgroundColor: theme.backgroundColor,
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
			<div
				className="container mx-auto my-8 flex flex-col md:flex-row flex-wrap gap-8"
				style={getWindowContainerStyle()}
			>
				{/* Main blog window */}
				<div
					className="flex-1"
					style={{
						minWidth: mainWindowState === "minimized" ? "auto" : "60%",
						borderRadius: "12px",
						overflow: "hidden",
						boxShadow:
							mainWindowState === "maximized"
								? theme.boxShadow
									? theme.boxShadow.replace("rgba(0,0,0,", "rgba(0,0,0,")
									: undefined
								: undefined,
					}}
				>
					<MainWindow
						theme={theme}
						windowTitle={windowTitle}
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						searchResults={searchResults}
						setWindowTitle={setWindowTitle}
						searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
						windowState={mainWindowState}
						onClose={handleMainWindowClose}
						onMinimize={handleMainWindowMinimize}
						onMaximize={handleMainWindowMaximize}
					/>
				</div>

				{/* Recent Posts Window */}
				<AnimatePresence>
					{showRecentPosts && (
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ type: "spring", stiffness: 300, damping: 25 }}
							style={{
								width:
									recentPostsState === "minimized"
										? "auto"
										: recentPostsState === "maximized"
										? "100%"
										: "35%",
								borderRadius: "12px",
								overflow: "hidden",
								boxShadow:
									recentPostsState === "maximized"
										? theme.boxShadow
											? theme.boxShadow.replace("rgba(0,0,0,", "rgba(0,0,0,")
											: undefined
										: undefined,
							}}
						>
							<RecentPosts
								posts={recentPosts}
								theme={theme}
								onClose={handleRecentPostsClose}
								windowState={recentPostsState}
								onMinimize={handleRecentPostsMinimize}
								onMaximize={handleRecentPostsMaximize}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Status bar */}
			<StatusBar theme={theme} />
		</div>
	);
}
