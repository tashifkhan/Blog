import React, { useState, useEffect } from "react";
import type { Post } from "@/types/post";
import { motion } from "framer-motion";

interface BlogSectionProps {
	theme: any;
	searchQuery?: string;
	posts?: Post[]; // Add posts as prop instead of fetching internally
}

export function BlogSection({
	theme,
	searchQuery = "",
	posts = [],
}: BlogSectionProps) {
	const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(false); // No need to load since posts come from props

	useEffect(() => {
		// Filter posts based on search query
		if (searchQuery.trim()) {
			const filtered = posts.filter(
				(post) =>
					post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					post.tags?.some((tag) =>
						tag.toLowerCase().includes(searchQuery.toLowerCase())
					)
			);
			setFilteredPosts(filtered);
		} else {
			setFilteredPosts(posts);
		}
	}, [posts, searchQuery]);

	if (loading) {
		return (
			<div className="flex justify-center items-center py-8">
				<div className="text-sm" style={{ color: theme.textColor }}>
					Loading blog posts...
				</div>
			</div>
		);
	}

	if (filteredPosts.length === 0) {
		return (
			<div className="text-center py-8">
				<div
					className="text-lg font-semibold mb-2"
					style={{ color: theme.textColor }}
				>
					{searchQuery ? "No posts found" : "No blog posts available"}
				</div>
				{searchQuery && (
					<div
						className="text-sm opacity-70"
						style={{ color: theme.textColor }}
					>
						Try adjusting your search terms
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div
				className="text-lg font-bold mb-4"
				style={{ color: theme.accentColor }}
			>
				Blog Posts {searchQuery && `(${filteredPosts.length} results)`}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredPosts.map((post, index) => (
					<motion.article
						key={post.slug}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="group cursor-pointer"
						onClick={() => (window.location.href = `/blog/${post.slug}/`)}
					>
						<div
							className="p-4 rounded border transition-all duration-200 hover:shadow-lg"
							style={{
								backgroundColor: theme.windowBackground,
								borderColor: theme.borderColor,
								boxShadow: theme.cardBoxShadow,
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.boxShadow =
									theme.hoverBoxShadow || theme.boxShadow;
								e.currentTarget.style.transform = "translateY(-2px)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.boxShadow = theme.cardBoxShadow;
								e.currentTarget.style.transform = "translateY(0)";
							}}
						>
							<h3
								className="font-semibold text-lg mb-2 group-hover:opacity-80 transition-opacity line-clamp-2"
								style={{ color: theme.accentColor }}
							>
								{post.title}
							</h3>

							{post.excerpt && (
								<p
									className="text-sm mb-3 line-clamp-3"
									style={{ color: theme.textColor, opacity: 0.8 }}
								>
									{post.excerpt}
								</p>
							)}

							{post.tags && post.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 mb-2">
									{post.tags.slice(0, 3).map((tag) => (
										<span
											key={tag}
											className="px-2 py-1 rounded text-xs font-medium"
											style={{
												backgroundColor: theme.accentColor,
												color: theme.windowBackground,
											}}
										>
											{tag}
										</span>
									))}
									{post.tags.length > 3 && (
										<span
											className="px-2 py-1 rounded text-xs font-medium"
											style={{
												backgroundColor: theme.borderColor,
												color: theme.textColor,
											}}
										>
											+{post.tags.length - 3}
										</span>
									)}
								</div>
							)}

							{post.date && (
								<small
									className="text-xs opacity-60"
									style={{ color: theme.textColor }}
								>
									{new Date(post.date).toLocaleDateString()}
								</small>
							)}
						</div>
					</motion.article>
				))}
			</div>
		</div>
	);
}
