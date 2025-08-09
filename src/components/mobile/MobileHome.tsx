import React, { useEffect, useMemo, useState } from "react";
import {
	activeTheme,
	allThemes,
	setTheme as applyTheme,
} from "@/lib/theme-config";
import type { Post } from "@/types/post";
import SearchModal from "@/components/search/search-modal";

export function MobileHome() {
	const [theme, setThemeState] = useState<any>(activeTheme);
	const [posts, setPosts] = useState<Post[]>([]);
	const [query, setQuery] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [showRecent, setShowRecent] = useState(true);

	useEffect(() => {
		import("@/lib/api")
			.then(({ apiUrl }) => fetch(apiUrl("/posts.json")))
			.then((r) => r.json())
			.then((data) => setPosts(data))
			.catch(() => {});
		setThemeState(activeTheme);
		const onChange = () => setThemeState(activeTheme);
		window.addEventListener("themechange", onChange);
		return () => window.removeEventListener("themechange", onChange);
	}, []);

	const results = useMemo(() => {
		if (!query) return [] as Post[];
		const q = query.toLowerCase();
		return posts.filter(
			(p) =>
				p.title?.toLowerCase().includes(q) ||
				p.excerpt?.toLowerCase().includes(q) ||
				p.tags?.some((t) => t.toLowerCase().includes(q))
		);
	}, [query, posts]);

	// Theme-driven helpers for expressive visuals
	const getHeaderStyle = () => {
		const base: React.CSSProperties = {
			background: theme.menuBarBackground,
			borderColor: theme.menuBarBorder,
		};
		if (theme.name === "neoBrutalism") {
			return {
				...base,
				background: theme.titleBarBackground || theme.accentColor,
				borderBottom: "2px solid #000",
				boxShadow: "6px 6px 0 #000",
			} as React.CSSProperties;
		}
		if (theme.name === "modernMacOS") {
			return {
				...base,
				boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
				backdropFilter: "blur(6px)",
			} as React.CSSProperties;
		}
		if (theme.name === "dark") {
			return {
				...base,
				boxShadow: "0 15px 35px rgba(0,0,0,0.3), 0 5px 15px rgba(0,0,0,0.2)",
				backdropFilter: "blur(4px)",
			} as React.CSSProperties;
		}
		if (theme.name === "neon" || theme.name === "cyberpunk") {
			return {
				...base,
				background:
					theme.titleBarBackground ||
					`linear-gradient(90deg, ${theme.accentColor}, ${theme.accentColor})`,
				boxShadow: `0 0 18px ${theme.accentColor}80`,
				backdropFilter: "blur(6px)",
			} as React.CSSProperties;
		}
		return base;
	};

	const getMenuPanelStyle = () => {
		const base: React.CSSProperties = {
			background: theme.menuBarBackground,
			borderColor: theme.menuBarBorder,
			color: theme.textColor,
		};
		if (theme.name === "neoBrutalism") {
			return { ...base, boxShadow: "6px 6px 0 #000", border: "2px solid #000" };
		}
		if (theme.name === "neon" || theme.name === "cyberpunk") {
			return {
				...base,
				boxShadow: `0 0 25px ${theme.accentColor}60`,
				backdropFilter: "blur(8px)",
			};
		}
		if (theme.name === "dark") {
			return {
				...base,
				boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
				backdropFilter: "blur(10px)",
			};
		}
		return base;
	};

	const getCardStyle = (): React.CSSProperties => {
		const base: React.CSSProperties = {
			background: theme.cardBackground || theme.windowBackground,
			borderColor: theme.borderColor,
			boxShadow: theme.cardBoxShadow,
		};
		if (theme.name === "neoBrutalism") {
			return {
				...base,
				boxShadow: "4px 4px 0 #000",
				border: "2px solid #000",
				borderRadius: 0,
			};
		}
		if (theme.name === "neon") {
			return { ...base, boxShadow: `0 0 12px ${theme.accentColor}90` };
		}
		if (theme.name === "cyberpunk") {
			return { ...base, boxShadow: "0 0 30px rgba(0,255,255,0.2)" };
		}
		return base;
	};

	const getRootBackground = () => {
		if (theme.name === "neon") {
			return `radial-gradient(60% 60% at 20% 10%, ${theme.accentColor}22, transparent), ${theme.backgroundColor}`;
		}
		if (theme.name === "cyberpunk") {
			return `linear-gradient(120deg, #0f0015 0%, #001a1a 100%)`;
		}
		return theme.backgroundColor;
	};

	return (
		<div
			className="min-h-screen flex flex-col"
			style={{
				background: getRootBackground(),
				color: theme.textColor,
				fontFamily: theme.fontFamily,
			}}
		>
			{/* Top mobile bar */}
			<header className="sticky top-0 z-50 border-b" style={getHeaderStyle()}>
				<div className="flex items-center justify-between px-3 h-12">
					<a
						href="/"
						className="font-bold text-sm no-underline"
						style={{ color: theme.textColor }}
					>
						BlogOS
					</a>
					<div className="flex items-center gap-2">
						<button
							className="text-xs px-2 py-1 rounded"
							style={{ border: `1px solid ${theme.borderColor}` }}
							onClick={() => setIsSearchOpen(true)}
						>
							Search
						</button>
						<a
							href="/blog/"
							className="text-xs px-2 py-1 rounded no-underline"
							style={{
								border: `1px solid ${theme.borderColor}`,
								color: theme.textColor,
							}}
						>
							All Posts
						</a>
						<details className="relative">
							<summary
								className="list-none text-xs px-2 py-1 rounded"
								style={{ border: `1px solid ${theme.borderColor}` }}
							>
								Menu
							</summary>
							<nav
								className="absolute right-0 mt-2 w-64 rounded border p-1"
								style={getMenuPanelStyle()}
							>
								{/* Navigate */}
								<div className="px-2 py-1 text-[11px] opacity-70">Navigate</div>
								<a
									href="/"
									className="block px-2 py-1 text-xs no-underline"
									style={{ color: theme.textColor }}
								>
									Home
								</a>
								<a
									href="/blog/"
									className="block px-2 py-1 text-xs no-underline"
									style={{ color: theme.textColor }}
								>
									Blog
								</a>
								<a
									href="https://tashif.codes/projects"
									className="block px-2 py-1 text-xs no-underline"
									style={{ color: theme.textColor }}
								>
									Projects
								</a>
								<a
									href="https://tashif.codes/resume"
									className="block px-2 py-1 text-xs no-underline"
									style={{ color: theme.textColor }}
								>
									About
								</a>
								<button
									className="block w-full text-left px-2 py-1 text-xs"
									onClick={() => window.history.back()}
								>
									Back
								</button>
								<button
									className="block w-full text-left px-2 py-1 text-xs"
									onClick={() => window.history.forward()}
								>
									Forward
								</button>

								<div
									className="my-1"
									style={{ borderTop: `1px solid ${theme.menuBarBorder}` }}
								/>

								{/* View */}
								<div className="px-2 py-1 text-[11px] opacity-70">View</div>
								<button
									className="block w-full text-left px-2 py-1 text-xs"
									onClick={() => {
										document.documentElement.style.setProperty(
											"--zoom",
											String(
												(parseFloat(
													getComputedStyle(
														document.documentElement
													).getPropertyValue("--zoom")
												) || 1) + 0.1
											)
										);
									}}
								>
									Zoom In
								</button>
								<button
									className="block w-full text-left px-2 py-1 text-xs"
									onClick={() => {
										const z =
											(parseFloat(
												getComputedStyle(
													document.documentElement
												).getPropertyValue("--zoom")
											) || 1) - 0.1;
										document.documentElement.style.setProperty(
											"--zoom",
											String(Math.max(0.5, z))
										);
									}}
								>
									Zoom Out
								</button>
								<button
									className="block w-full text-left px-2 py-1 text-xs"
									onClick={() =>
										document.documentElement.style.setProperty("--zoom", "1")
									}
								>
									Reset Zoom
								</button>
								<button
									className="block w-full text-left px-2 py-1 text-xs"
									onClick={async () => {
										if (!document.fullscreenElement)
											await document.documentElement.requestFullscreen();
										else await document.exitFullscreen();
									}}
								>
									Toggle Fullscreen
								</button>

								<div
									className="my-1"
									style={{ borderTop: `1px solid ${theme.menuBarBorder}` }}
								/>

								{/* Edit */}
								<div className="px-2 py-1 text-[11px] opacity-70">Edit</div>
								<button
									className="block w-full text-left px-2 py-1 text-xs"
									onClick={() => setIsSearchOpen(true)}
								>
									Find
								</button>

								<div
									className="my-1"
									style={{ borderTop: `1px solid ${theme.menuBarBorder}` }}
								/>

								{/* Recent */}
								<div className="px-2 py-1 text-[11px] opacity-70">Recent</div>
								<button
									className="block w-full text-left px-2 py-1 text-xs"
									onClick={() => setShowRecent((s) => !s)}
								>
									{showRecent ? "Hide" : "Show"} Recent Posts
								</button>
								<a
									href="/blog/"
									className="block px-2 py-1 text-xs no-underline"
									style={{ color: theme.textColor }}
								>
									View All Posts
								</a>

								<div
									className="my-1"
									style={{ borderTop: `1px solid ${theme.menuBarBorder}` }}
								/>

								{/* Appearance */}
								<div className="px-2 py-1 text-[11px] opacity-70">
									Appearance
								</div>
								<div className="max-h-48 overflow-auto py-1">
									{Object.entries(allThemes).map(([key, t]) => (
										<button
											key={key}
											className="block w-full text-left px-2 py-1 text-xs"
											onClick={() => setThemeState(applyTheme(key))}
											style={{ fontWeight: t.name === theme.name ? 700 : 400 }}
										>
											{t.name}
										</button>
									))}
								</div>

								<div
									className="my-1"
									style={{ borderTop: `1px solid ${theme.menuBarBorder}` }}
								/>

								{/* Help */}
								<div className="px-2 py-1 text-[11px] opacity-70">Help</div>
								<a
									href="/blog/"
									className="block px-2 py-1 text-xs no-underline"
									style={{ color: theme.textColor }}
								>
									Keyboard Shortcuts
								</a>
								<a
									href="https://tashif.codes"
									className="block px-2 py-1 text-xs no-underline"
									target="_blank"
									rel="noreferrer"
									style={{ color: theme.textColor }}
								>
									Documentation
								</a>
							</nav>
						</details>
					</div>
				</div>
			</header>

			{/* Hero / intro */}
			<section className="px-3 pt-4">
				<h1 className="text-lg font-bold">Welcome to my blog</h1>
				<p className="text-sm opacity-80">
					Retro-styled, fast, and searchable.
				</p>
			</section>

			{/* Recent posts */}
			{showRecent && (
				<section className="px-3 py-4">
					<h2 className="text-sm font-semibold mb-2">Recent Posts</h2>
					<div className="grid grid-cols-1 gap-2">
						{posts.slice(0, 3).map((p) => (
							<a
								key={p.slug}
								href={p.slug ? `/blog/${p.slug}/` : "/blog/"}
								className={`no-underline ${
									theme.name === "neoBrutalism" ? "rounded-none" : "rounded"
								} border p-3`}
								style={getCardStyle()}
							>
								<div
									className="text-sm font-medium"
									style={{ color: theme.accentColor }}
								>
									{p.title}
								</div>
								{p.excerpt && (
									<div className="text-xs opacity-80 mt-1 line-clamp-2">
										{p.excerpt}
									</div>
								)}
								{p.date && (
									<div className="text-[10px] opacity-60 mt-1">
										{new Date(p.date).toLocaleDateString()}
									</div>
								)}
							</a>
						))}
					</div>
				</section>
			)}

			{/* Footer */}
			<footer
				className="mt-auto px-3 py-3 border-t"
				style={{ borderColor: theme.menuBarBorder }}
			>
				<div className="text-[10px] opacity-70">
					© {new Date().getFullYear()} BlogOS
				</div>
			</footer>

			{/* Search Modal */}
			<SearchModal
				open={isSearchOpen}
				theme={theme}
				query={query}
				setQuery={setQuery}
				results={results}
				onClose={() => setIsSearchOpen(false)}
				onSelect={(slug?: string) => {
					setIsSearchOpen(false);
					setQuery("");
					if (slug) window.location.href = `/blog/${slug}/`;
				}}
			/>
		</div>
	);
}
