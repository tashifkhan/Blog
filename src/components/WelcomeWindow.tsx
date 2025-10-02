import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import { PostList } from "./posts/post-list";
import { WindowControls } from "./ui/window-controls";
import { AboutSection } from "./sections/about-section";
import type { Post } from "@/types/post";

interface WelcomeWindowProps {
	theme?: any;
	windowTitle?: string;
	posts?: Post[];
	setWindowTitle?: (title: string) => void;
}

export function WelcomeWindow({
	theme,
	windowTitle = "Blog - Home",
	posts = [],
	setWindowTitle,
}: WelcomeWindowProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Post[]>([]);
	// Start maximized by default so the window appears expanded on initial render
	const [windowState, setWindowState] = useState<
		"normal" | "minimized" | "maximized"
	>("maximized");
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Search functionality
	useEffect(() => {
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
	}, [searchQuery, posts]);

	// Window control handlers
	const handleClose = () => {
		if (setWindowTitle) setWindowTitle("Blog - Home");
		setSearchQuery("");
		setSearchResults([]);
	};

	const handleMinimize = () => {
		setWindowState("minimized");
	};

	const handleMaximize = () => {
		setWindowState(windowState === "maximized" ? "normal" : "maximized");
	};

	// Window animation variants
	const getWindowVariants = () => {
		return {
			minimized: {
				height: "40px",
				opacity: 1,
			},
			normal: {
				height: "auto",
				opacity: 1,
			},
			maximized: {
				height: "auto",
				opacity: 1,
			},
		};
	};

	const contentVariants = {
		hidden: { opacity: 0, height: 0 },
		visible: { opacity: 1, height: "auto" },
	};

	// Get window style based on theme
	const getWindowStyle = () => {
		if (!theme) return {};

		const baseStyle = {
			background: theme.windowBackground,
			border: `${theme.borderWidth || 1}px solid ${theme.borderColor}`,
			borderRadius: theme.windowRadius || "1rem",
			overflow: "hidden",
		};

		if (theme.name === "neoBrutalism") {
			return {
				...baseStyle,
				boxShadow: "8px 8px 0px #000, 0 15px 30px rgba(0,0,0,0.1)",
				border: "2px solid #000",
				borderRadius: "0px",
			};
		}

		if (theme.name === "win95") {
			return {
				...baseStyle,
				boxShadow:
					"inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, 4px 4px 8px rgba(0,0,0,0.2)",
				borderRadius: "0",
			};
		}

		if (theme.name === "modernMacOS") {
			return {
				...baseStyle,
				boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
				borderRadius: "10px",
				border: "1px solid rgba(0,0,0,0.1)",
			};
		}

		if (theme.name === "dark") {
			return {
				...baseStyle,
				boxShadow: "0 15px 35px rgba(0,0,0,0.3), 0 5px 15px rgba(0,0,0,0.2)",
				border: "1px solid rgba(255,255,255,0.1)",
			};
		}

		return {
			...baseStyle,
			boxShadow: "0 12px 28px rgba(0,0,0,0.12), 0 5px 10px rgba(0,0,0,0.08)",
		};
	};

	// Get title bar style based on theme
	const getTitleBarStyle = () => {
		if (!theme) return {};

		const baseStyle = {
			background: theme.titleBarBackground || theme.accentColor,
			borderBottom: `${theme.borderWidth || 1}px solid ${theme.borderColor}`,
		};

		if (theme.name === "neoBrutalism") {
			return {
				...baseStyle,
				background: theme.accentColor || "#ff90e8",
				borderBottom: "2px solid #000",
			};
		}

		if (theme.name === "cyberpunk") {
			return {
				...baseStyle,
				background: "linear-gradient(90deg, #ff00ff, #00ffff)",
				borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
			};
		}

		if (theme.name === "neon") {
			return {
				...baseStyle,
				background: "rgba(20, 20, 40, 0.9)",
				borderBottom: `1px solid ${theme.accentColor}`,
			};
		}

		return baseStyle;
	};

	if (!theme) {
		return <div>Loading...</div>;
	}

	return (
		<motion.div
			className="w-full"
			variants={getWindowVariants()}
			animate={windowState}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 25,
			}}
			style={getWindowStyle()}
		>
			{/* Window Title Bar */}
			<div
				className="p-2 flex items-center justify-between"
				style={getTitleBarStyle()}
			>
				<WindowControls
					theme={theme}
					onClose={handleClose}
					onMinimize={handleMinimize}
					onMaximize={handleMaximize}
				/>

				<span
					className={`flex-grow text-center font-bold ${
						theme.name === "neoBrutalism" ? "text-black" : ""
					}`}
					style={{ color: theme.titleColor }}
				>
					{windowTitle}
				</span>

				<div className="w-16 flex justify-end">
					{/* Empty div for symmetrical spacing */}
				</div>
			</div>

			<AnimatePresence>
				{windowState !== "minimized" && (
					<motion.div
						className={`p-4 ${theme.name === "neoBrutalism" ? "pt-6" : ""}`}
						variants={contentVariants}
						initial="hidden"
						animate="visible"
						exit="hidden"
					>
						{/* Search Bar */}
						<div className="mb-4 relative">
							<div
								className={`flex items-center p-2 rounded-md ${
									theme.name === "neoBrutalism"
										? "rounded-none border-2 border-black"
										: ""
								}`}
								style={{
									background: theme.inputBackground || theme.cardBackground,
									border:
										theme.name !== "neoBrutalism"
											? `${theme.borderWidth || 1}px solid ${theme.borderColor}`
											: undefined,
									boxShadow:
										theme.name === "neoBrutalism"
											? "3px 3px 0 #000"
											: theme.name === "neon"
											? `0 0 8px ${theme.accentColor}`
											: undefined,
								}}
							>
								<FaSearch
									className="mr-2"
									style={{
										color: theme.iconColor || theme.accentColor,
										filter:
											theme.name === "neon"
												? "drop-shadow(0 0 2px currentColor)"
												: undefined,
									}}
								/>
								<input
									ref={searchInputRef}
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search posts..."
									className="bg-transparent outline-none w-full"
									style={{
										color: theme.textColor,
										fontFamily: theme.fontFamily,
									}}
								/>
								{searchQuery && (
									<FaTimesCircle
										className="cursor-pointer"
										onClick={() => setSearchQuery("")}
										style={{
											color: theme.iconColor || theme.accentColor,
											filter:
												theme.name === "neon"
													? "drop-shadow(0 0 2px currentColor)"
													: undefined,
										}}
									/>
								)}
							</div>
						</div>

						{/* Search Results or Default Content */}
						{searchQuery ? (
							<div>
								<h2
									className={`text-2xl font-bold mb-4 ${
										theme.name === "neoBrutalism"
											? "uppercase tracking-wider"
											: ""
									}`}
									style={{
										color: theme.headingColor || theme.textColor,
										textShadow:
											theme.name === "neon"
												? `0 0 5px ${theme.accentColor}`
												: undefined,
									}}
								>
									Search Results
								</h2>
								{searchResults.length > 0 ? (
									<PostList
										posts={searchResults}
										theme={theme}
										setWindowTitle={setWindowTitle || (() => {})}
									/>
								) : (
									<div
										className={`p-4 rounded-md ${
											theme.name === "neoBrutalism"
												? "rounded-none border-2 border-black"
												: ""
										}`}
										style={{
											background:
												theme.cardBackground || theme.windowBackground,
											border:
												theme.name !== "neoBrutalism"
													? `${theme.borderWidth || 1}px solid ${
															theme.borderColor
													  }`
													: undefined,
											boxShadow:
												theme.name === "neoBrutalism"
													? "3px 3px 0 #000"
													: undefined,
										}}
									>
										No results found for &quot;{searchQuery}&quot;
									</div>
								)}
							</div>
						) : (
							<div className="space-y-6">
								{/* Welcome Content */}
								<div
									className={`p-4 rounded-md ${
										theme.name === "neoBrutalism"
											? "rounded-none border-2 border-black"
											: ""
									}`}
									style={{
										background: theme.cardBackground || theme.windowBackground,
										border:
											theme.name !== "neoBrutalism"
												? `${theme.borderWidth || 1}px solid ${
														theme.borderColor
												  }`
												: undefined,
										boxShadow:
											theme.name === "neoBrutalism"
												? "3px 3px 0 #000"
												: undefined,
									}}
								>
									<p className="mb-2">
										Welcome to my blog! This is a retro-styled blog showcasing
										various UI components and interactions.
									</p>
									<p>
										Use the menu above to navigate or try the search
										functionality.
									</p>
								</div>

								{/* Additional content shown only when maximized */}
								{windowState === "maximized" && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
										className="space-y-6"
									>
										<AboutSection theme={theme} />
									</motion.div>
								)}
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
