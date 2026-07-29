import React from "react";
import { Desktop } from "./Desktop";
import { WelcomeWindow } from "./WelcomeWindow";
import { RecentPostsWindow } from "./RecentPostsWindow";
import { motion, AnimatePresence } from "framer-motion";
import type { Post } from "@/types/post";

interface HomePageProps {
	showRecentPosts?: boolean;
	initialPosts?: Post[];
}

export function HomePage({
	showRecentPosts = true,
	initialPosts,
}: HomePageProps) {
	const [showRecentPostsWindow, setShowRecentPostsWindow] =
		React.useState(showRecentPosts);

	return (
		<Desktop
			showRecentPosts={showRecentPosts}
			defaultWindowTitle="Blog - Home"
			initialPosts={initialPosts}
		>
			{/* Main welcome window */}
			<div className="flex-1" style={{ minWidth: "60%" }}>
				<WelcomeWindow />
			</div>

			{/* Recent Posts Window */}
			<AnimatePresence>
				{showRecentPostsWindow && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ type: "spring", stiffness: 300, damping: 25 }}
						style={{ width: "35%" }}
					>
						{/* posts omitted: RecentPostsWindow reads recentPosts from context */}
						<RecentPostsWindow
							onClose={() => setShowRecentPostsWindow(false)}
							initialState="normal"
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</Desktop>
	);
}
