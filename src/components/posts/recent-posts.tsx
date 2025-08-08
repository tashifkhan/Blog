import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowControls } from "../ui/window-controls";

interface RecentPostsProps {
	posts: Array<{
		slug?: string;
		title?: string;
		date?: string;
		excerpt?: string;
		tags?: string[];
	}>;
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

	const accentBg = theme.accentColor;
	const accentFg = getAccentForeground(accentBg);

	return (
		<motion.div
			className="w-full"
			initial={false}
			animate={windowState}
			transition={{ type: "spring", stiffness: 300, damping: 25 }}
			style={{
				background: theme.windowBackground,
				borderRadius: theme.windowRadius || "1rem",
				boxShadow: theme.boxShadow || "0 8px 32px rgba(0,0,0,0.12)",
				border: `1px solid ${theme.borderColor}`,
				color: theme.textColor,
				overflow: "hidden",
			}}
			role="dialog"
			aria-modal="false"
			aria-labelledby="recent-posts-title"
		>
			{/* Window title bar */}
			<div
				className="p-2 flex items-center justify-between"
				style={{
					background: theme.windowTitlebarBg || accentBg,
					borderBottom: `1px solid ${theme.borderColor}`,
				}}
			>
				<WindowControls
					theme={theme}
					onClose={onClose}
					onMinimize={onMinimize}
					onMaximize={onMaximize}
				/>
				<span
					id="recent-posts-title"
					className="flex-grow text-center font-bold"
					style={{ color: theme.titleColor || accentFg }}
				>
					Recent Posts
				</span>
				<div className="w-16 flex justify-end"></div>
			</div>
			<AnimatePresence>
				{windowState !== "minimized" && (
					<motion.div
						className="p-4"
						initial="hidden"
						animate="visible"
						exit="hidden"
						role="region"
						aria-label="Recent posts list"
					>
						<h2
							className="text-xl font-bold mb-3"
							style={{ color: theme.accentColor }}
						>
							Latest Articles
						</h2>
						{posts.length > 0 ? (
							<div className="space-y-4">
								{posts.map((post, index) => {
									const href = post.slug ? `/blog/${post.slug}/` : undefined;
									const key = post.slug || post.title || String(index);
									const Card = (
										<motion.div
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className="p-6 rounded-xl transition-transform duration-200 hover:scale-105"
											style={{
												background: theme.windowBackground,
												color: theme.textColor,
												border: `1px solid ${theme.borderColor}`,
												boxShadow:
													theme.cardBoxShadow ||
													(index % 2 === 0
														? "0 4px 16px rgba(0,0,0,0.08)"
														: "0 8px 24px rgba(0,0,0,0.10)"),
											}}
											role="article"
										>
											<h3
												className="text-lg font-semibold mb-1"
												style={{ color: theme.accentColor }}
											>
												{post.title}
											</h3>
											{post.date && (
												<div className="text-sm opacity-70 mb-2">
													{new Date(post.date).toLocaleDateString()}
												</div>
											)}
											{post.excerpt && (
												<p className="text-sm opacity-80 mb-2">
													{post.excerpt}
												</p>
											)}
											{post.tags && (
												<div className="flex flex-wrap gap-2 mb-2">
													{post.tags.map((tag) => (
														<span
															key={tag}
															className="px-2 py-0.5 rounded text-xs font-medium"
															style={{ background: accentBg, color: accentFg }}
														>
															{tag}
														</span>
													))}
												</div>
											)}
										</motion.div>
									);
									return href ? (
										<a
											key={key}
											href={href}
											aria-label={post.title || "View post"}
											className="block focus:outline-none rounded-lg"
											style={{ outlineColor: accentBg }}
										>
											{Card}
										</a>
									) : (
										<div key={key}>{Card}</div>
									);
								})}
							</div>
						) : (
							<div
								className="p-4 rounded-xl text-center"
								style={{
									background: theme.windowBackground,
									border: `1px solid ${theme.borderColor}`,
									color: theme.textColor,
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
