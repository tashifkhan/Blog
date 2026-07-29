import React, { useEffect, useMemo, useState } from "react";
import { MenuBar } from "./menu/menu-bar";
import { StatusBar } from "./ui/status-bar";
import type { Post } from "@/types/post";
import SearchModal from "./search/search-modal";
import { DesktopProvider } from "@/contexts/desktop-context";
import { usePosts, searchPosts } from "@/hooks/use-posts";
import { useActiveTheme } from "@/hooks/use-theme";

interface DesktopProps {
	children: React.ReactNode;
	showRecentPosts?: boolean;
	defaultWindowTitle?: string;
	onPostsFetched?: (posts: Post[]) => void;
	/** Build-time post data from Astro, so the first render already has content. */
	initialPosts?: Post[];
}

export function Desktop({
	children,
	defaultWindowTitle = "Blog - Home",
	onPostsFetched,
	initialPosts,
}: DesktopProps) {
	const theme = useActiveTheme();
	const { posts, recentPosts } = usePosts(3, initialPosts);
	// Null during SSR and the first client render so hydration matches.
	const [currentTime, setCurrentTime] = useState<Date | null>(null);
	const [windowTitle, setWindowTitle] = useState(defaultWindowTitle);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [modalQuery, setModalQuery] = useState("");

	// Notify the parent once posts land, for callers that need their own copy.
	useEffect(() => {
		if (posts.length > 0) onPostsFetched?.(posts);
	}, [posts, onPostsFetched]);

	const modalResults = useMemo(
		() => searchPosts(posts, modalQuery),
		[posts, modalQuery]
	);

	// Mirror the active theme onto CSS custom properties so .astro/global styles
	// can read it without going through React.
	useEffect(() => {
		const syncThemeVars = () => {
			const root = document.documentElement;
			root.style.setProperty("--theme-bg", theme.backgroundColor);
			root.style.setProperty("--theme-text", theme.textColor);
			root.style.setProperty("--theme-accent", theme.accentColor);
			root.style.setProperty("--theme-border", theme.borderColor);
			root.style.setProperty("--theme-window-bg", theme.windowBackground);
			root.style.setProperty(
				"--theme-secondary",
				theme.statusBarBackground || theme.menuBarBackground
			);
			root.style.setProperty("--theme-muted", theme.menuBarBackground);
		};

		syncThemeVars();
		window.addEventListener("sync-theme-vars", syncThemeVars);
		return () => window.removeEventListener("sync-theme-vars", syncThemeVars);
	}, [theme]);

	useEffect(() => {
		setCurrentTime(new Date());
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const focusSearch = () => setIsSearchOpen(true);

	// Theme-specific chrome around the window area.
	const getWindowContainerStyle = (): React.CSSProperties => {
		switch (theme.name) {
			case "cyberpunk":
				return {
					padding: "12px",
					borderRadius: "16px",
					background: "rgba(10, 10, 30, 0.1)",
					boxShadow: "0 0 30px rgba(0, 255, 255, 0.15)",
					backdropFilter: "blur(5px)",
				};
			case "neon":
				return {
					padding: "12px",
					borderRadius: "16px",
					background: "rgba(10, 10, 30, 0.2)",
					boxShadow: `0 0 25px ${theme.accentColor || "#00ffff"}60`,
					backdropFilter: "blur(8px)",
				};
			case "dark":
				return {
					padding: "8px",
					borderRadius: "16px",
					background: "rgba(20, 20, 25, 0.4)",
					boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
					backdropFilter: "blur(12px)",
				};
			default:
				return {};
		}
	};

	const contextValue = useMemo(
		() => ({
			theme,
			posts,
			recentPosts,
			windowTitle,
			setWindowTitle,
			openSearch: focusSearch,
		}),
		[theme, posts, recentPosts, windowTitle]
	);

	return (
		<DesktopProvider value={contextValue}>
			<div
				className="w-full flex flex-col items-center min-h-screen"
				style={{
					backgroundColor: theme.backgroundColor,
					color: theme.textColor,
					fontFamily: theme.fontFamily,
				}}
			>
				<MenuBar
					theme={theme}
					currentTime={currentTime}
					toggleRecentPosts={() => {}}
					focusSearch={focusSearch}
					recentPosts={recentPosts}
					setWindowTitle={setWindowTitle}
				/>

				<div
					className="container mx-auto my-8 flex flex-col md:flex-row flex-wrap gap-8"
					style={getWindowContainerStyle()}
				>
					{children}
				</div>

				<StatusBar theme={theme} />

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
						if (slug) window.location.href = `/blog/${slug}/`;
					}}
				/>
			</div>
		</DesktopProvider>
	);
}
