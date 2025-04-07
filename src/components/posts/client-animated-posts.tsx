import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RecentPosts } from "./recent-posts";
import type { Post } from "@/types/post";

interface ClientAnimatedPostsProps {
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
export const ClientAnimatedPosts: React.FC<ClientAnimatedPostsProps> = ({
	showRecentPosts,
	recentPosts,
	theme,
	onClose,
	windowState,
	onMinimize,
	onMaximize,
	isMobile,
	recentPostsState,
}) => {
	return (
		<AnimatePresence>
			{showRecentPosts && (
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
			)}
		</AnimatePresence>
	);
};
