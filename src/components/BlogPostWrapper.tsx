import React from "react";
import { Desktop } from "./Desktop";
import { BlogPostPage } from "./BlogPostPage";

interface BlogPostWrapperProps {
	title?: string;
	date?: string;
	excerpt?: string;
	tags?: string[];
	children?: React.ReactNode;
}

export function BlogPostWrapper({
	title,
	date,
	excerpt,
	tags,
	children,
}: BlogPostWrapperProps) {
	return (
		<Desktop
			showRecentPosts={false}
			defaultWindowTitle={`Blog - ${title || "Post"}`}
		>
			{/* Main blog post window */}
			<div className="flex-1" style={{ minWidth: "80%" }}>
				<BlogPostPage title={title} date={date} excerpt={excerpt} tags={tags}>
					{children}
				</BlogPostPage>
			</div>
		</Desktop>
	);
}
