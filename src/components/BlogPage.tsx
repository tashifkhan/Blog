import { Desktop } from "./Desktop";
import { BlogWindow } from "./BlogWindow";
import { MobilePostsList } from "./mobile/MobilePostsList";

import type { Post } from "@/types/post";

interface BlogPageProps {
	searchQuery?: string;
	initialPosts?: Post[];
}

/**
 * Desktop/mobile split via CSS breakpoints rather than a JS matchMedia check,
 * so both trees server-render. See ResponsiveHome for the rationale.
 */
export function BlogPage({ searchQuery = "", initialPosts }: BlogPageProps) {
	return (
		<>
			<div className="hidden md:block">
				<Desktop
					showRecentPosts={false}
					defaultWindowTitle="Blog - Posts"
					initialPosts={initialPosts}
				>
					<div className="flex-1" style={{ minWidth: "80%" }}>
						<BlogWindow searchQuery={searchQuery} />
					</div>
				</Desktop>
			</div>
			<div className="md:hidden">
				<MobilePostsList initialPosts={initialPosts} />
			</div>
		</>
	);
}
