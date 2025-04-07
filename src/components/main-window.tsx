import React from "react";
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
			borderRadius: theme.borderRadius,
			boxShadow: theme.boxShadow,
			border: `${theme.borderWidth}px solid ${theme.borderColor}`,
			overflow: "hidden",
		};

		// NeoBrutalism specific styling
		if (theme.name === "neoBrutalism") {
			return {
				...baseStyle,
				boxShadow: "5px 5px 0px #000",
				border: "2px solid #000",
				borderRadius: "0px",
			};
		}

		// Cyberpunk styling
		if (theme.name === "cyberpunk") {
			return {
				...baseStyle,
				borderWidth: "1px",
				borderStyle: "solid",
				borderImage: "linear-gradient(45deg, #ff00ff, #00ffff) 1",
				boxShadow: "0 0 20px rgba(0, 255, 255, 0.6)",
			};
		}

		// Neon styling
		if (theme.name === "neon") {
			return {
				...baseStyle,
				background: "rgba(10, 10, 30, 0.85)",
				boxShadow: `0 0 20px ${theme.accentColor}`,
				backdropFilter: "blur(10px)",
			};
		}

		return baseStyle;
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
