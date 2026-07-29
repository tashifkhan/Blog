import { HomePage } from "./HomePage";
import { MobileHome } from "./mobile/MobileHome";
import type { Post } from "@/types/post";

interface ResponsiveHomeProps {
	/** Post metadata resolved by Astro at build time, so the first render has content. */
	initialPosts?: Post[];
}

/**
 * Desktop/mobile split.
 *
 * This previously branched on a JS `matchMedia` check, which meant the correct
 * tree was only known in the browser and forced the page to render with
 * `client:only` — the homepage shipped ~62KB of HTML containing zero text.
 *
 * Selecting with CSS breakpoints instead lets both trees server-render, so the
 * page has crawlable content and paints before hydration. The breakpoint here
 * must stay in sync with the `md` breakpoint used below.
 */
export function ResponsiveHome({ initialPosts }: ResponsiveHomeProps) {
	return (
		<>
			<div className="hidden md:block">
				<HomePage showRecentPosts={true} initialPosts={initialPosts} />
			</div>
			<div className="md:hidden">
				<MobileHome initialPosts={initialPosts} />
			</div>
		</>
	);
}
