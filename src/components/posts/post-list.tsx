import React from "react";
import { motion } from "framer-motion";
import type { Post } from "@/types/post";

interface PostListProps {
	posts: Post[];
	theme: any;
	setWindowTitle: (title: string) => void;
}

export function PostList({ posts, theme, setWindowTitle }: PostListProps) {
	const handlePostClick = (post: Post) => {
		setWindowTitle(`Blog - ${post.title}`);
		// Navigation logic here if needed
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{posts.map((post, index) => (
				<motion.div
					key={post.id}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.05 }}
					onClick={() => handlePostClick(post)}
					className="p-6 rounded-xl shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer bg-[var(--card)] border border-[var(--border)]"
					style={{
						color: "var(--card-foreground)",
						boxShadow:
							index % 2 === 0
								? "0 4px 16px rgba(0,0,0,0.08)"
								: "0 8px 24px rgba(0,0,0,0.10)",
					}}
				>
					<h3 className="text-xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">
						{post.title}
					</h3>
					<p className="text-sm opacity-80 mb-2">{post.excerpt}</p>
					<div className="flex flex-wrap gap-2 mb-2">
						{post.tags &&
							post.tags.map((tag) => (
								<span
									key={tag}
									className="px-2 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-medium"
								>
									{tag}
								</span>
							))}
					</div>
					<small className="text-xs opacity-60">{post.date}</small>
				</motion.div>
			))}
			{posts.length === 0 && (
				<div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center">
					No posts available.
				</div>
			)}
		</div>
	);
}
