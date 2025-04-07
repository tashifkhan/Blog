import React, { useState, useEffect, useRef } from "react";
import { activeTheme } from "@/lib/theme-config";
import { MenuBar } from "./menu/menu-bar";
import { MainWindow } from "./main-window";
import { StatusBar } from "./ui/status-bar";
import { PostService } from "@/services/post-service";
import ClientRecentPosts from "./posts/client-recent-posts";

// Define the Post type inline to avoid import issues
interface Post {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	content: string;
	date: string;
	imageUrl?: string;
	author: {
		name: string;
		avatar?: string;
	};
	tags: string[];
}

export default function Navbar() {
	// State management
	const [theme, setTheme] = useState(activeTheme);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [windowTitle, setWindowTitle] = useState("Blog - Home");
	const [showRecentPosts, setShowRecentPosts] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Post[]>([]);
	const [recentPosts, setRecentPosts] = useState<Post[]>([]);
	const searchInputRef = useRef<HTMLInputElement>(null);
	// Mobile state management
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

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
		// Set mounted immediately to avoid getting stuck in loading state
		setIsMounted(true);

		// Only run client-side code after mount
		if (typeof window !== "undefined") {
			try {
				setRecentPosts(PostService.getRecentPosts());

				// Apply theme from localStorage on initial load
				setTheme(activeTheme);

				// Check if we're on mobile
				const checkMobile = () => {
					setIsMobile(window.innerWidth < 768);
				};

				// Initial check
				checkMobile();

				// Listen for resize events
				window.addEventListener("resize", checkMobile);
				return () => window.removeEventListener("resize", checkMobile);
			} catch (error) {
				console.error("Error initializing Navbar:", error);
			}
		}
	}, []);

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

	// Toggle mobile menu
	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	// Get window container style for theme-specific styling
	const getWindowContainerStyle = () => {
		return {
			flexDirection: isMobile ? "column" : ("row" as "column" | "row"),
		};
	};

	// If we're server-side rendering (Astro), return empty div to avoid hydration issues
	if (typeof window === "undefined") {
		return <div id="navbar-container"></div>;
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
			{/* Mobile menu button - only visible on small screens */}
			{isMobile && (
				<div className="absolute top-4 right-4 z-50">
					<button
						onClick={toggleMobileMenu}
						className="p-2 rounded-full"
						style={{
							background: theme.accentColor,
							boxShadow: theme.boxShadow,
						}}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							{isMobileMenuOpen ? (
								<>
									<line x1="18" y1="6" x2="6" y2="18"></line>
									<line x1="6" y1="6" x2="18" y2="18"></line>
								</>
							) : (
								<>
									<line x1="3" y1="12" x2="21" y2="12"></line>
									<line x1="3" y1="6" x2="21" y2="6"></line>
									<line x1="3" y1="18" x2="21" y2="18"></line>
								</>
							)}
						</svg>
					</button>
				</div>
			)}

			{/* Top Mac-style menubar - hide on mobile when menu is closed */}
			<div
				className={`w-full ${
					isMobile && !isMobileMenuOpen ? "hidden" : "block"
				}`}
			>
				<MenuBar
					theme={theme}
					currentTime={currentTime}
					toggleRecentPosts={toggleRecentPosts}
					focusSearch={focusSearch}
					recentPosts={recentPosts}
					setWindowTitle={setWindowTitle}
					isMobile={isMobile}
				/>
			</div>

			{/* Main window content area */}
			<div
				className={`container mx-auto my-8 flex flex-wrap gap-8 ${
					isMobile ? "px-4" : ""
				}`}
				style={getWindowContainerStyle()}
			>
				{/* Main blog window */}
				<div
					className="flex-1"
					style={{
						minWidth: isMobile
							? "100%"
							: mainWindowState === "minimized"
							? "auto"
							: "60%",
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
						searchInputRef={searchInputRef}
						windowState={mainWindowState}
						onClose={handleMainWindowClose}
						onMinimize={handleMainWindowMinimize}
						onMaximize={handleMainWindowMaximize}
						isMobile={isMobile}
					/>
				</div>

				{/* Recent Posts Window */}
				<ClientRecentPosts
					showRecentPosts={showRecentPosts}
					recentPosts={recentPosts}
					theme={theme}
					onClose={handleRecentPostsClose}
					windowState={recentPostsState}
					onMinimize={handleRecentPostsMinimize}
					onMaximize={handleRecentPostsMaximize}
					isMobile={isMobile}
					recentPostsState={recentPostsState}
				/>
			</div>

			{/* Status bar - conditionally hide on mobile */}
			<div
				className={`w-full ${
					isMobile && !isMobileMenuOpen ? "hidden" : "block"
				}`}
			>
				<StatusBar theme={theme} isMobile={isMobile} />
			</div>
		</div>
	);
}
