import React from "react";
import { Desktop } from "./Desktop";
import { BlogWindow } from "./BlogWindow";
import { MobilePostsList } from "./mobile/MobilePostsList";

interface BlogPageProps {
	searchQuery?: string;
}

export function BlogPage({ searchQuery = "" }: BlogPageProps) {
	const [isMobile, setIsMobile] = React.useState(false);

	React.useEffect(() => {
		const mql = window.matchMedia("(max-width: 768px)");
		const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
			setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
		};
		onChange(mql as unknown as MediaQueryList);
		if (typeof mql.addEventListener === "function") {
			mql.addEventListener("change", onChange as any);
			return () => mql.removeEventListener("change", onChange as any);
		} else {
			// @ts-ignore legacy
			mql.addListener(onChange);
			return () => {
				// @ts-ignore legacy
				mql.removeListener(onChange);
			};
		}
	}, []);

	if (isMobile) {
		return <MobilePostsList />;
	}

	return (
		<Desktop showRecentPosts={false} defaultWindowTitle="Blog - Posts">
			{/* Main blog window */}
			<div className="flex-1" style={{ minWidth: "80%" }}>
				<BlogWindow searchQuery={searchQuery} />
			</div>
		</Desktop>
	);
}
