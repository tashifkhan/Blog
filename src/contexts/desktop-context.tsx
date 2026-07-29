import { createContext, useContext } from "react";
import type { Post } from "@/types/post";

export interface DesktopContextValue {
	theme: any;
	posts: Post[];
	recentPosts: Post[];
	windowTitle: string;
	setWindowTitle: (title: string) => void;
	openSearch: () => void;
}

const DesktopContext = createContext<DesktopContextValue | null>(null);

export const DesktopProvider = DesktopContext.Provider;

/**
 * Shared desktop state (theme, posts, window title).
 *
 * This replaces `injectPropsDeep`, which walked the entire child tree on every
 * render calling cloneElement to push these values down. That rebuilt the tree
 * each render, defeated memoization, and silently overwrote any prop sharing a
 * name with an injected one.
 */
export function useDesktopContext(): DesktopContextValue | null {
	return useContext(DesktopContext);
}

/**
 * Resolves a value from an explicit prop first, falling back to desktop context.
 * Explicit props win, so callers can still override per-instance.
 */
export function useDesktopValue<K extends keyof DesktopContextValue>(
	key: K,
	override: DesktopContextValue[K] | undefined
): DesktopContextValue[K] | undefined {
	const ctx = useContext(DesktopContext);
	return override !== undefined ? override : ctx?.[key];
}
