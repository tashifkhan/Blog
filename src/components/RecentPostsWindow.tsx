import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowControls } from "./ui/window-controls";
import type { Post } from "@/types/post";

interface RecentPostsWindowProps {
	posts?: Post[];
	theme?: any;
	onClose?: () => void;
	initialState?: "normal" | "minimized" | "maximized";
}

export function RecentPostsWindow({
	posts = [],
	theme,
	onClose,
	initialState = "normal",
}: RecentPostsWindowProps) {
	const [windowState, setWindowState] = useState<
		"normal" | "minimized" | "maximized"
	>(initialState);

	// Compute readable text color over accent
	const getAccentForeground = (hex?: string) => {
		if (!hex || typeof hex !== "string") return "#000";
		const h = hex.replace("#", "");
		const r = parseInt(h.substring(0, 2), 16) || 0;
		const g = parseInt(h.substring(2, 4), 16) || 0;
		const b = parseInt(h.substring(4, 6), 16) || 0;
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 128 ? "#000" : "#fff";
	};

	const handleClose = () => {
		if (onClose) onClose();
	};

	const handleMinimize = () => {
		setWindowState("minimized");
	};

	const handleMaximize = () => {
		setWindowState(windowState === "maximized" ? "normal" : "maximized");
	};

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
				boxShadow: "8px 8px 0px #000",
				border: "2px solid #000",
				borderRadius: "0px",
			};
		}

		return {
			...baseStyle,
			boxShadow: theme.cardBoxShadow || "0 4px 12px rgba(0,0,0,0.1)",
		};
	};

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

		return baseStyle;
	};

	if (!theme) {
		return <div>Loading...</div>;
	}

	const accentBg = theme.accentColor;
	const accentFg = getAccentForeground(accentBg);

	return (
		<motion.div
			className="w-full"
			initial={false}
			animate={windowState}
			variants={getWindowVariants()}
			transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
					Recent Posts
				</span>

				<div className="w-16 flex justify-end">
					{/* Empty div for symmetrical spacing */}
				</div>
			</div>

			<AnimatePresence>
				{windowState !== "minimized" && (
					<motion.div
						className="p-4"
						variants={contentVariants}
						initial="hidden"
						animate="visible"
						exit="hidden"
					>
						{posts.length > 0 ? (
							<div className="space-y-3">
								{posts.map((post, index) => (
									<motion.div
										key={post.slug || index}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
										className="group cursor-pointer"
										onClick={() => {
											if (post.slug) {
												window.location.href = `/blog/${post.slug}/`;
											}
										}}
									>
										<div
											className={`p-3 rounded border transition-all hover:shadow-md ${
												theme.name === "neoBrutalism"
													? "rounded-none border-2 border-black hover:shadow-[4px_4px_0px_#000]"
													: ""
											}`}
											style={{
												backgroundColor:
													theme.cardBackground || theme.windowBackground,
												borderColor: theme.borderColor,
											}}
										>
											<h4
												className="font-semibold text-sm mb-1 group-hover:opacity-80 transition-opacity"
												style={{ color: theme.accentColor }}
											>
												{post.title}
											</h4>

											{post.excerpt && (
												<p
													className="text-xs mb-2 line-clamp-2"
													style={{ color: theme.textColor, opacity: 0.8 }}
												>
													{post.excerpt}
												</p>
											)}

											{post.tags && post.tags.length > 0 && (
												<div className="flex flex-wrap gap-1 mb-1">
													{post.tags.slice(0, 2).map((tag) => (
														<span
															key={tag}
															className="px-1.5 py-0.5 rounded text-[10px] font-medium"
															style={{
																backgroundColor: accentBg,
																color: accentFg,
															}}
														>
															{tag}
														</span>
													))}
													{post.tags.length > 2 && (
														<span
															className="px-1.5 py-0.5 rounded text-[10px] font-medium"
															style={{
																backgroundColor: theme.borderColor,
																color: theme.textColor,
															}}
														>
															+{post.tags.length - 2}
														</span>
													)}
												</div>
											)}

											{post.date && (
												<small
													className="text-[10px] opacity-60"
													style={{ color: theme.textColor }}
												>
													{new Date(post.date).toLocaleDateString()}
												</small>
											)}
										</div>
									</motion.div>
								))}
							</div>
						) : (
							<div
								className="text-center py-4"
								style={{ color: theme.textColor, opacity: 0.7 }}
							>
								No recent posts available
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
