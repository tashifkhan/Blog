import React from "react";
import { Desktop } from "./Desktop";
import { BlogWindow } from "./BlogWindow";

interface BlogPageProps {
	searchQuery?: string;
}

export function BlogPage({ searchQuery = "" }: BlogPageProps) {
	return (
		<Desktop showRecentPosts={false} defaultWindowTitle="Blog - Posts">
			{/* Main blog window */}
			<div className="flex-1" style={{ minWidth: "80%" }}>
				<BlogWindow searchQuery={searchQuery} />
			</div>
		</Desktop>
	);
}
