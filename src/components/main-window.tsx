import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import { PostList } from "./posts/post-list";
import { WindowControls } from "./ui/window-controls";
import { AboutSection } from "./sections/about-section";
import { ProjectsSection } from "./sections/projects-section";

interface MainWindowProps {
	theme: any;
	windowTitle: string;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	searchResults: any[];
	setWindowTitle: (title: string) => void;
	searchInputRef: React.RefObject<HTMLInputElement>;
	windowState: "normal" | "minimized" | "maximized";
	onClose: () => void;
	onMinimize: () => void;
	onMaximize: () => void;
}

export function MainWindow({
	theme,
	windowTitle,
	searchQuery,
	setSearchQuery,
	searchResults,
	setWindowTitle,
	searchInputRef,
	windowState,
	onClose,
	onMinimize,
	onMaximize,
}: MainWindowProps) {
	// Window animation variants based on theme
	const getWindowVariants = () => {
		const baseVariants = {
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

		// Add extra styling for cyberpunk/neon themes
		if (theme.name === "cyberpunk" || theme.name === "neon") {
			return {
				minimized: {
					...baseVariants.minimized,
					boxShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
				},
				normal: {
					...baseVariants.normal,
					boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
				},
				maximized: {
					...baseVariants.maximized,
					boxShadow: "0 0 30px rgba(0, 255, 255, 0.7)",
				},
			};
		}

		return baseVariants;
	};

	// Content animation variants
	const contentVariants = {
		hidden: {
			opacity: 0,
			height: 0,
		},
		visible: {
			opacity: 1,
			height: "auto",
			transition: {
				opacity: { duration: 0.3 },
				height: { duration: 0.4 },
			},
		},
	};

	// Get window style based on theme
	const getWindowStyle = () => {
		const baseStyle = {
			background: theme.windowBackground,
			borderRadius: theme.windowRadius || theme.borderRadius || "8px",
			border: `${theme.borderWidth || 1}px solid ${theme.borderColor}`,
			overflow: "hidden",
			boxShadow: theme.boxShadow || "0 10px 25px rgba(0, 0, 0, 0.1)",
		};

		// NeoBrutalism specific styling
		if (theme.name === "neoBrutalism") {
			return {
				...baseStyle,
				boxShadow: "8px 8px 0px #000, 0 15px 30px rgba(0,0,0,0.1)",
				border: "2px solid #000",
				borderRadius: "0px",
			};
		}

		// Win95 specific styling
		if (theme.name === "win95") {
			return {
				...baseStyle,
				boxShadow:
					"inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, 4px 4px 8px rgba(0,0,0,0.2)",
				borderRadius: "0",
			};
		}

		// Modern MacOS styling
		if (theme.name === "modernMacOS") {
			return {
				...baseStyle,
				boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
				borderRadius: "10px",
				border: "1px solid rgba(0,0,0,0.1)",
			};
		}

		// Dark theme styling
		if (theme.name === "dark") {
			return {
				...baseStyle,
				boxShadow: "0 15px 35px rgba(0,0,0,0.3), 0 5px 15px rgba(0,0,0,0.2)",
				border: "1px solid rgba(255,255,255,0.1)",
			};
		}

		// Return enhanced default shadow
		return {
			...baseStyle,
			boxShadow: "0 12px 28px rgba(0,0,0,0.12), 0 5px 10px rgba(0,0,0,0.08)",
		};
	};

	// Get title bar style based on theme
	const getTitleBarStyle = () => {
		const baseStyle = {
			background: theme.titleBarBackground || theme.accentColor,
			borderBottom: `${theme.borderWidth}px solid ${theme.borderColor}`,
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

	// Get card style based on theme
	const getCardStyle = (index: number) => {
		const baseStyle = {
			background: theme.cardBackground || theme.windowBackground,
			border: `${theme.borderWidth || 1}px solid ${theme.borderColor}`,
			borderRadius: theme.borderRadius || "8px",
			boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
			transition: "transform 0.2s, box-shadow 0.3s",
		};

		// NeoBrutalism specific styling
		if (theme.name === "neoBrutalism") {
			return {
				...baseStyle,
				boxShadow: "4px 4px 0px #000",
				border: "2px solid #000",
				borderRadius: "0px",
			};
		}

		// Win95 specific styling
		if (theme.name === "win95") {
			return {
				...baseStyle,
				boxShadow: "inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff",
				borderRadius: "0",
			};
		}

		// Return enhanced drop shadow for all other themes
		return {
			...baseStyle,
			boxShadow: "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)",
		};
	};

	// Hover effects for cards
	const getHoverEffect = (index: number) => {
		const baseEffect = {
			scale: 1.01,
			boxShadow: "0 8px 20px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.08)",
		};

		// NeoBrutalism specific hover
		if (theme.name === "neoBrutalism") {
			return {
				...baseEffect,
				boxShadow: "6px 6px 0px #000",
				y: -4,
			};
		}

		// Win95 specific hover
		if (theme.name === "win95") {
			return {
				...baseEffect,
				scale: 1.01,
				boxShadow:
					"inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, 0 3px 3px rgba(0,0,0,0.2)",
			};
		}

		return baseEffect;
	};

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
					onClose={onClose}
					onMinimize={onMinimize}
					onMaximize={onMaximize}
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
											? `${theme.borderWidth}px solid ${theme.borderColor}`
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
										setWindowTitle={setWindowTitle}
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
													? `${theme.borderWidth}px solid ${theme.borderColor}`
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
							<div>
								<h1
									className={`text-3xl font-bold mb-6 ${
										theme.name === "neoBrutalism"
											? "uppercase tracking-wider"
											: theme.name === "cyberpunk"
											? "font-mono tracking-wide"
											: ""
									}`}
									style={{
										color: theme.headingColor || theme.textColor,
										textShadow:
											theme.name === "neon"
												? `0 0 8px ${theme.accentColor}`
												: undefined,
									}}
								>
									Welcome to my Blog
								</h1>
								<div
									className={`p-4 rounded-md mb-4 ${
										theme.name === "neoBrutalism"
											? "rounded-none border-2 border-black"
											: ""
									}`}
									style={{
										background: theme.cardBackground || theme.windowBackground,
										border:
											theme.name !== "neoBrutalism"
												? `${theme.borderWidth}px solid ${theme.borderColor}`
												: undefined,
										boxShadow:
											theme.name === "neoBrutalism"
												? "3px 3px 0 #000"
												: theme.name === "neon"
												? `0 0 15px ${theme.accentColor}`
												: undefined,
									}}
								>
									<p className="mb-2">
										This is a neobrutalist blog template showcasing various UI
										components and interactions.
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
										<ProjectsSection theme={theme} />
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
