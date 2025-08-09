import React, { useCallback } from "react";
import { Desktop } from "./Desktop";
import { WelcomeWindow } from "./WelcomeWindow";
import { RecentPostsWindow } from "./RecentPostsWindow";
import { motion, AnimatePresence } from "framer-motion";
import type { Post } from "@/types/post";

interface HomePageProps {
	showRecentPosts?: boolean;
}

export function HomePage({ showRecentPosts = true }: HomePageProps) {
	const [posts, setPosts] = React.useState<Post[]>([]);
	const [recentPosts, setRecentPosts] = React.useState<Post[]>([]);
	const [showRecentPostsWindow, setShowRecentPostsWindow] =
		React.useState(showRecentPosts);

	const handlePostsFetched = useCallback((fetchedPosts: Post[]) => {
		setPosts(fetchedPosts);
		setRecentPosts(
			[...fetchedPosts]
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
				.slice(0, 3)
		);
	}, []);

	return (
		<Desktop
			showRecentPosts={showRecentPosts}
			defaultWindowTitle="Blog - Home"
			onPostsFetched={handlePostsFetched}
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
						<RecentPostsWindow
							posts={recentPosts}
							onClose={() => setShowRecentPostsWindow(false)}
							initialState="normal"
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</Desktop>
	);
}
