import React from "react";
import { motion } from "framer-motion";
import { RecentPosts } from "./recent-posts";

// Define Post interface inline to avoid import issues
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

interface ClientRecentPostsProps {
	showRecentPosts: boolean;
	recentPosts: Post[];
	theme: any;
	onClose: () => void;
	windowState: "normal" | "minimized" | "maximized";
	onMinimize: () => void;
	onMaximize: () => void;
	isMobile: boolean;
	recentPostsState: "normal" | "minimized" | "maximized";
}

// This component handles client-side animations for Astro
export default function ClientRecentPosts({
	showRecentPosts,
	recentPosts,
	theme,
	onClose,
	windowState,
	onMinimize,
	onMaximize,
	isMobile,
	recentPostsState,
}: ClientRecentPostsProps) {
	if (!showRecentPosts) return null;

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ type: "spring", stiffness: 300, damping: 25 }}
			style={{
				width: isMobile
					? "100%"
					: recentPostsState === "minimized"
					? "auto"
					: recentPostsState === "maximized"
					? "100%"
					: "35%",
				borderRadius: "12px",
				overflow: "hidden",
				boxShadow:
					recentPostsState === "maximized"
						? theme.boxShadow
							? theme.boxShadow.replace("rgba(0,0,0,", "rgba(0,0,0,")
							: undefined
						: undefined,
			}}
		>
			<RecentPosts
				posts={recentPosts}
				theme={theme}
				onClose={onClose}
				windowState={windowState}
				onMinimize={onMinimize}
				onMaximize={onMaximize}
				isMobile={isMobile}
			/>
		</motion.div>
	);
}
