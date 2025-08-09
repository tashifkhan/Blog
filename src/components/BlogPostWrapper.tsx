import React from "react";
import { Desktop } from "./Desktop";
import { BlogPostPage } from "./BlogPostPage";
import { MobilePostReader } from "./mobile/MobilePostReader";

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
		return (
			<MobilePostReader title={title} date={date} excerpt={excerpt} tags={tags}>
				{children}
			</MobilePostReader>
		);
	}

	return (
		<Desktop
			showRecentPosts={false}
			defaultWindowTitle={`Blog - ${title || "Post"}`}
		>
			{/* Main blog post window */}
			<div className="flex-1" style={{ minWidth: "100%" }}>
				<BlogPostPage title={title} date={date} excerpt={excerpt} tags={tags}>
					{children}
				</BlogPostPage>
			</div>
		</Desktop>
	);
}
