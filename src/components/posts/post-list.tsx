import React from "react";
import { motion } from "framer-motion";
import type { Post } from "@/types/post";

interface PostListProps {
	posts: Post[];
	theme: any;
	setWindowTitle: (title: string) => void;
}

export function PostList({ posts, theme, setWindowTitle }: PostListProps) {
	// Get post card style based on theme
	const getPostCardStyle = (index: number) => {
		const baseStyle = {
			background: theme.cardBackground || theme.windowBackground,
			border: `${theme.borderWidth}px solid ${theme.borderColor}`,
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
			scale: 1.01,
			boxShadow: theme.hoverBoxShadow || theme.boxShadow,
		};

		if (theme.name === "neoBrutalism") {
			return {
				...baseEffect,
				y: -3,
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

	const handlePostClick = (post: Post) => {
		// Update window title to show selected post
		setWindowTitle(`Blog - ${post.title}`);
		// Here you would typically navigate to the post or show it in the main content area
	};

	return (
		<div className="space-y-4">
			{posts.map((post, index) => (
				<motion.div
					key={post.id}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.05 }}
					onClick={() => handlePostClick(post)}
					className={`p-4 cursor-pointer ${
						theme.name === "neoBrutalism" ? "rounded-none" : "rounded-md"
					}`}
					style={getPostCardStyle(index)}
					whileHover={getHoverEffect(index)}
				>
					<h3
						className={`text-xl font-bold mb-2 ${
							theme.name === "cyberpunk"
								? "font-mono tracking-wide"
								: theme.name === "neoBrutalism"
								? "uppercase tracking-wide"
								: ""
						}`}
						style={{
							color: theme.accentColor,
							textShadow:
								theme.name === "neon" ? "0 0 5px currentColor" : "none",
						}}
					>
						{post.title}
					</h3>

					<div
						className="text-sm mb-3"
						style={{
							color: theme.mutedTextColor || theme.textColor,
							opacity: theme.name === "neon" ? 0.8 : 1,
						}}
					>
						{new Date(post.date).toLocaleDateString()}
					</div>

					<p
						style={{
							color: theme.textColor,
							lineHeight: "1.5",
						}}
					>
						{post.excerpt}
					</p>

					{post.tags && post.tags.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-1">
							{post.tags.map((tag) => (
								<span
									key={tag}
									className={`text-xs px-2 py-1 ${
										theme.name === "neoBrutalism" ? "rounded-none" : "rounded"
									}`}
									style={{
										background: theme.tagBackground || theme.accentColor,
										color: theme.tagTextColor || theme.windowBackground,
										border:
											theme.name === "neoBrutalism" ? "1px solid #000" : "none",
										boxShadow:
											theme.name === "neoBrutalism"
												? "1px 1px 0 #000"
												: theme.name === "neon"
												? `0 0 5px ${theme.accentColor}`
												: "none",
										textShadow:
											theme.name === "neon" ? "0 0 3px currentColor" : "none",
									}}
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</motion.div>
			))}

			{posts.length === 0 && (
				<div
					className={`p-4 ${
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
							theme.name === "neoBrutalism" ? "3px 3px 0 #000" : undefined,
					}}
				>
					No posts available.
				</div>
			)}
		</div>
	);
}
