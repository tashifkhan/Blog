import React, { useState, useEffect } from "react";
import { activeTheme } from "@/lib/theme-config";
import { MenuBar } from "./menu/menu-bar";
import { StatusBar } from "./ui/status-bar";
import type { Post } from "@/types/post";
import { motion } from "framer-motion";
import SearchModal from "./search/search-modal";

interface DesktopProps {
	children: React.ReactNode;
	showRecentPosts?: boolean;
	defaultWindowTitle?: string;
	onPostsFetched?: (posts: Post[]) => void;
}

export function Desktop({
	children,
	showRecentPosts = false,
	defaultWindowTitle = "Blog - Home",
	onPostsFetched,
}: DesktopProps) {
	// State management
	const [theme, setTheme] = useState(activeTheme);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [windowTitle, setWindowTitle] = useState(defaultWindowTitle);
	const [posts, setPosts] = useState<Post[]>([]);
	const [recentPosts, setRecentPosts] = useState<Post[]>([]);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [modalQuery, setModalQuery] = useState("");
	const [modalResults, setModalResults] = useState<Post[]>([]);

	// Client-side only code
	const [isMounted, setIsMounted] = useState(false);

	// Mount component on client-side
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Fetch posts after component is mounted
	useEffect(() => {
		if (!isMounted) return;

		// Fetch real posts from API
		import("@/lib/api")
			.then(({ apiUrl }) => fetch(apiUrl("/posts.json")))
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
				// Call the callback if provided
				if (onPostsFetched) {
					onPostsFetched(data);
				}
			})
			.catch((error) => {
				console.error("Failed to fetch posts:", error);
			});
		setTheme(activeTheme);
	}, [isMounted]); // Remove onPostsFetched from dependencies to prevent infinite loop

	// Modal search functionality
	useEffect(() => {
		if (!isMounted) return;
		if (modalQuery) {
			const lowercaseQuery = modalQuery.toLowerCase();
			setModalResults(
				posts.filter(
					(post) =>
						post.title?.toLowerCase().includes(lowercaseQuery) ||
						post.excerpt?.toLowerCase().includes(lowercaseQuery) ||
						post.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
				)
			);
		} else {
			setModalResults([]);
		}
	}, [modalQuery, isMounted, posts]);

	// Update theme when it changes
	useEffect(() => {
		if (!isMounted) return;

		const handleThemeChange = () => {
			setTheme(activeTheme);
		};

		// Sync theme variables to CSS custom properties
		const syncThemeVars = () => {
			if (typeof document !== "undefined") {
				const root = document.documentElement;
				const currentTheme = activeTheme;

				root.style.setProperty("--theme-bg", currentTheme.backgroundColor);
				root.style.setProperty("--theme-text", currentTheme.textColor);
				root.style.setProperty("--theme-accent", currentTheme.accentColor);
				root.style.setProperty("--theme-border", currentTheme.borderColor);
				root.style.setProperty(
					"--theme-window-bg",
					currentTheme.windowBackground
				);
				root.style.setProperty(
					"--theme-secondary",
					currentTheme.statusBarBackground || currentTheme.menuBarBackground
				);
				root.style.setProperty("--theme-muted", currentTheme.menuBarBackground);
			}
		};

		window.addEventListener("themechange", handleThemeChange);
		window.addEventListener("sync-theme-vars", syncThemeVars);

		// Initial sync
		syncThemeVars();

		return () => {
			window.removeEventListener("themechange", handleThemeChange);
			window.removeEventListener("sync-theme-vars", syncThemeVars);
		};
	}, [isMounted]);

	// Update clock
	useEffect(() => {
		if (!isMounted) return;

		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, [isMounted]);

	// Open modal search when search is triggered from menu or button
	const focusSearch = () => {
		setIsSearchOpen(true);
	};

	// Get window container style for theme-specific styling
	const getWindowContainerStyle = () => {
		const baseStyle = {};

		if (theme.name === "neoBrutalism") {
			return baseStyle;
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
				<div className="p-4">Loading...</div>
			</div>
		);
	}

	// Recursively inject shared props into nested React elements (avoid adding to DOM nodes)
	const injectPropsDeep = (element: React.ReactNode): React.ReactNode => {
		// Handle arrays of nodes at the top level
		if (Array.isArray(element)) {
			return element.map((child) => injectPropsDeep(child));
		}

		// Preserve null/undefined/boolean as-is
		if (
			element === null ||
			element === undefined ||
			typeof element === "boolean"
		) {
			return element;
		}

		if (!React.isValidElement(element)) return element;

		// Always process children first
		const children = (element as any).props?.children;
		const processedChildren = Array.isArray(children)
			? children.map((child: React.ReactNode) => injectPropsDeep(child))
			: injectPropsDeep(children);

		// If it's a DOM element (e.g., 'div'), only replace its children
		if (typeof element.type === "string") {
			return React.cloneElement(element, undefined, processedChildren);
		}

		// It's a React component: inject our shared props and processed children
		return React.cloneElement(
			element as React.ReactElement<any>,
			{ theme, posts, recentPosts, setWindowTitle, windowTitle },
			processedChildren
		);
	};

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
				toggleRecentPosts={() => {}} // Will be handled by parent if needed
				focusSearch={focusSearch}
				recentPosts={recentPosts}
				setWindowTitle={setWindowTitle}
			/>

			{/* Main content area */}
			<div
				className="container mx-auto my-8 flex flex-col md:flex-row flex-wrap gap-8"
				style={getWindowContainerStyle()}
			>
				{injectPropsDeep(children)}
			</div>

			{/* Status bar */}
			<StatusBar theme={theme} />

			{/* Search modal */}
			<SearchModal
				open={isSearchOpen}
				theme={theme}
				query={modalQuery}
				setQuery={setModalQuery}
				results={modalResults}
				onClose={() => setIsSearchOpen(false)}
				onSelect={(slug?: string) => {
					setIsSearchOpen(false);
					setModalQuery("");
					if (slug) {
						window.location.href = `/blog/${slug}/`;
					}
				}}
			/>
		</div>
	);
}
