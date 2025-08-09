import React, { useEffect, useState } from "react";
import { HomePage } from "./HomePage";
import { MobileHome } from "./mobile/MobileHome";

export function ResponsiveHome() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia("(max-width: 768px)");
		const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
			setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
		};
		// Initial
		onChange(mql as unknown as MediaQueryList);
		// Subscribe
		if (typeof mql.addEventListener === "function") {
			mql.addEventListener(
				"change",
				onChange as (this: MediaQueryList, ev: MediaQueryListEvent) => any
			);
			return () =>
				mql.removeEventListener(
					"change",
					onChange as (this: MediaQueryList, ev: MediaQueryListEvent) => any
				);
		} else {
			// Safari fallback
			// @ts-ignore
			mql.addListener(onChange);
			return () => {
				// @ts-ignore
				mql.removeListener(onChange);
			};
		}
	}, []);

	if (isMobile) return <MobileHome />;
	return <HomePage showRecentPosts={true} />;
}
