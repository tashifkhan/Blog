import React from "react";
import { PostService } from "@/services/post-service";

// Define Post interface inline
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

interface PostsProps {
	theme: any;
	isMobile?: boolean;
}

export const Posts: React.FC<PostsProps> = ({ theme, isMobile = false }) => {
	// Safe posts initialization with error handling
	let posts: Post[] = [];
	try {
		// Check if we're in a browser environment
		if (typeof window !== "undefined") {
			posts = PostService.getPosts();
		} else {
			// Server-side fallback - empty posts
			posts = [];
		}
	} catch (error) {
		console.error("Error loading posts:", error);
		// Fallback to empty array if posts fail to load
		posts = [];
	}

	if (posts.length === 0) {
		// Show a fallback when no posts are available
		return (
			<div>
				<h1
					className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-6`}
					style={{ color: theme.headingColor || theme.textColor }}
				>
					Latest Posts
				</h1>

				<div className="p-4 text-center">
					<p>No posts available at the moment.</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<h1
				className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-6`}
				style={{ color: theme.headingColor || theme.textColor }}
			>
				Latest Posts
			</h1>

			<div
				className={`grid ${
					isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 md:grid-cols-2 gap-6"
				}`}
			>
				{posts.map((post, index) => (
					<a href={`/post/${post.slug}`} key={post.id}>
						<div
							className={`p-4 rounded ${
								theme.name === "neoBrutalism"
									? "border-2 border-black bg-white"
									: ""
							} cursor-pointer transition-transform hover:scale-[1.02]`}
							style={{
								backgroundColor:
									theme.name === "neoBrutalism"
										? "#fff"
										: theme.cardBackground || "#ffffff10",
								color: theme.name === "neoBrutalism" ? "#000" : theme.textColor,
								boxShadow:
									theme.name === "neoBrutalism"
										? "4px 4px 0 #000"
										: theme.cardShadow || theme.boxShadow,
								backdropFilter:
									theme.name !== "neoBrutalism" ? "blur(5px)" : undefined,
							}}
						>
							{post.imageUrl && (
								<div
									className={`${
										isMobile ? "h-36" : "h-44"
									} mb-4 rounded overflow-hidden`}
								>
									<img
										src={post.imageUrl}
										alt={post.title}
										className="w-full h-full object-cover"
									/>
								</div>
							)}

							<h2
								className={`${isMobile ? "text-lg" : "text-xl"} font-bold mb-2`}
								style={{
									color:
										theme.name === "neoBrutalism"
											? "#000"
											: theme.headingColor || theme.textColor,
								}}
							>
								{post.title}
							</h2>

							<div className="flex items-center mb-2">
								{post.author.avatar && (
									<div className="w-8 h-8 rounded-full overflow-hidden mr-2">
										<img
											src={post.author.avatar}
											alt={post.author.name}
											className="w-full h-full object-cover"
										/>
									</div>
								)}
								<span className={`text-sm ${isMobile ? "mr-2" : "mr-4"}`}>
									{post.author.name}
								</span>
								<span className="text-xs opacity-70">
									{new Date(post.date).toLocaleDateString()}
								</span>
							</div>

							<p
								className={`${
									isMobile ? "text-sm line-clamp-2" : "line-clamp-3"
								} opacity-80`}
							>
								{post.excerpt}
							</p>

							<div className="mt-4 flex flex-wrap gap-2">
								{post.tags.map((tag) => (
									<span
										key={tag}
										className={`text-xs px-2 py-1 rounded ${
											theme.name === "neoBrutalism" ? "border border-black" : ""
										}`}
										style={{
											backgroundColor:
												theme.name === "neoBrutalism"
													? "#fff"
													: theme.tagBackground || theme.accentColor + "30",
											color:
												theme.name === "neoBrutalism"
													? "#000"
													: theme.tagText || theme.textColor,
										}}
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					</a>
				))}
			</div>
		</div>
	);
};
