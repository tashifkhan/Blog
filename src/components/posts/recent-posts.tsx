import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowControls } from "../ui/window-controls";
import type { Post } from "@/types/post";

interface RecentPostsProps {
	posts: Post[];
	theme: any;
	onClose: () => void;
	windowState: "normal" | "minimized" | "maximized";
	onMinimize: () => void;
	onMaximize: () => void;
}

export function RecentPosts({
	posts,
	theme,
	onClose,
	windowState,
	onMinimize,
	onMaximize,
}: RecentPostsProps) {
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
				borderImage: "linear-gradient(135deg, #00ffff, #ff00ff) 1",
				boxShadow: "0 0 20px rgba(255, 0, 255, 0.6)",
			};
		}

		// Neon styling
		if (theme.name === "neon") {
			return {
				...baseStyle,
				background: "rgba(10, 10, 30, 0.85)",
				boxShadow: `0 0 20px ${theme.accentColor || "#00ffff"}`,
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
				background: "linear-gradient(90deg, #00ffff, #ff00ff)",
				borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
			};
		}

		if (theme.name === "neon") {
			return {
				...baseStyle,
				background: "rgba(20, 20, 40, 0.9)",
				borderBottom: `1px solid ${theme.accentColor || "#00ffff"}`,
			};
		}

		return baseStyle;
	};

	// Window animation variants
	const windowVariants = {
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

	// Get post card style based on theme
	const getPostCardStyle = (index: number) => {
		const baseStyle = {
			background: theme.cardBackground || theme.windowBackground,
			border: `${theme.borderWidth}px solid ${theme.borderColor}`,
			cursor: "pointer",
			transition: "transform 0.2s, box-shadow 0.2s",
		};

		if (theme.name === "neoBrutalism") {
			return {
				...baseStyle,
				border: "2px solid #000",
				boxShadow: "4px 4px 0 #000",
				borderRadius: "0",
			};
		}

		if (theme.name === "cyberpunk") {
			return {
				...baseStyle,
				background: `rgba(20, 20, 40, ${0.7 + index * 0.05})`,
				borderImage: "linear-gradient(135deg, #00ffff, #ff00ff) 1",
				borderWidth: "1px",
				borderStyle: "solid",
			};
		}

		if (theme.name === "neon") {
			const colors = ["#00ffff", "#ff00ff", "#00ff00", "#ffff00"];
			return {
				...baseStyle,
				background: "rgba(10, 10, 30, 0.6)",
				boxShadow: `0 0 10px ${colors[index % colors.length]}`,
				border: `1px solid ${colors[index % colors.length]}`,
			};
		}

		return baseStyle;
	};

	// Get hover effect for post cards based on theme
	const getHoverEffect = (index: number) => {
		const baseEffect = {
			scale: 1.02,
			boxShadow: theme.hoverBoxShadow || theme.boxShadow,
		};

		if (theme.name === "neoBrutalism") {
			return {
				...baseEffect,
				y: -4,
				boxShadow: "6px 6px 0 #000",
			};
		}

		if (theme.name === "cyberpunk") {
			return {
				...baseEffect,
				scale: 1.03,
				boxShadow: "0 0 15px #ff00ff",
			};
		}

		if (theme.name === "neon") {
			const colors = ["#00ffff", "#ff00ff", "#00ff00", "#ffff00"];
			return {
				...baseEffect,
				scale: 1.03,
				boxShadow: `0 0 20px ${colors[index % colors.length]}`,
			};
		}

		return baseEffect;
	};

	return (
		<motion.div
			className="w-full"
			variants={windowVariants}
			animate={windowState}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 25,
			}}
			style={getWindowStyle()}
		>
			{/* Window title bar */}
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
					style={{
						color: theme.titleColor,
						textShadow:
							theme.name === "neon" ? `0 0 5px ${theme.accentColor}` : "none",
					}}
				>
					Recent Posts
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
						<h2
							className={`text-xl font-bold mb-3 ${
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
										? `0 0 5px ${theme.accentColor}`
										: "none",
							}}
						>
							Latest Articles
						</h2>

						{posts.length > 0 ? (
							<div className="space-y-4">
								{posts.map((post, index) => (
									<motion.div
										key={post.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
										className={`p-3 ${
											theme.name === "neoBrutalism"
												? "rounded-none"
												: "rounded-md"
										}`}
										style={getPostCardStyle(index)}
										whileHover={getHoverEffect(index)}
									>
										<h3
											className={`text-lg font-semibold mb-1 ${
												theme.name === "cyberpunk" ? "font-mono" : ""
											}`}
											style={{
												color: theme.accentColor,
												textShadow:
													theme.name === "neon"
														? "0 0 5px currentColor"
														: "none",
											}}
										>
											{post.title}
										</h3>
										<div
											className="text-sm"
											style={{
												color: theme.mutedTextColor || theme.textColor,
												opacity: theme.name === "neon" ? 0.8 : 1,
											}}
										>
											{new Date(post.date).toLocaleDateString()}
										</div>

										{/* Show description when maximized or for first post */}
										<AnimatePresence>
											{(windowState === "maximized" || index === 0) && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: "auto" }}
													exit={{ opacity: 0, height: 0 }}
													className="mt-2"
													transition={{ duration: 0.3 }}
												>
													<div
														className="text-sm mt-2"
														style={{
															color: theme.textColor,
															lineHeight: "1.5",
														}}
													>
														{post.excerpt}
													</div>

													{windowState === "maximized" && (
														<div className="mt-3">
															<span
																className={`text-sm font-semibold px-2 py-1 ${
																	theme.name === "neoBrutalism"
																		? "rounded-none"
																		: "rounded"
																}`}
																style={{
																	background:
																		theme.tagBackground || theme.accentColor,
																	color:
																		theme.tagTextColor ||
																		theme.windowBackground,
																	boxShadow:
																		theme.name === "neoBrutalism"
																			? "2px 2px 0 #000"
																			: theme.name === "neon"
																			? `0 0 10px ${theme.accentColor}`
																			: "none",
																	border:
																		theme.name === "neoBrutalism"
																			? "1px solid #000"
																			: "none",
																}}
															>
																{post.category}
															</span>

															{post.tags && post.tags.length > 0 && (
																<div className="mt-2 flex flex-wrap gap-1">
																	{post.tags.map((tag) => (
																		<span
																			key={tag}
																			className={`text-xs px-2 py-0.5 ${
																				theme.name === "neoBrutalism"
																					? "rounded-none"
																					: "rounded"
																			}`}
																			style={{
																				background:
																					theme.secondaryTagBackground ||
																					theme.mutedTextColor,
																				color:
																					theme.secondaryTagTextColor ||
																					theme.windowBackground,
																				border:
																					theme.name === "neoBrutalism"
																						? "1px solid #000"
																						: "none",
																				boxShadow:
																					theme.name === "neoBrutalism"
																						? "1px 1px 0 #000"
																						: "none",
																				opacity:
																					theme.name === "neon" ? 0.9 : 1,
																			}}
																		>
																			{tag}
																		</span>
																	))}
																</div>
															)}
														</div>
													)}
												</motion.div>
											)}
										</AnimatePresence>
									</motion.div>
								))}
							</div>
						) : (
							<div
								className={`p-3 ${
									theme.name === "neoBrutalism"
										? "rounded-none border-2 border-black"
										: "rounded-md"
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
											: undefined,
								}}
							>
								No recent posts found.
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
