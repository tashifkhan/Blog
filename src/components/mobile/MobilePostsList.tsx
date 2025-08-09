import React, { useEffect, useMemo, useState } from "react";
import { activeTheme, allThemes, setTheme } from "@/lib/theme-config";
import type { Post } from "@/types/post";

export function MobilePostsList() {
	const [theme, setThemeState] = useState(activeTheme);
	const [posts, setPosts] = useState<Post[]>([]);
	const [query, setQuery] = useState("");
	const [selectedTag, setSelectedTag] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		import("@/lib/api")
			.then(({ apiUrl }) => fetch(apiUrl("/posts.json")))
			.then((r) => r.json())
			.then((data: Post[]) => {
				setPosts(data);
			})
			.finally(() => setIsLoading(false));
		setThemeState(activeTheme);
		const onChange = () => setThemeState(activeTheme);
		window.addEventListener("themechange", onChange);
		return () => window.removeEventListener("themechange", onChange);
	}, []);

	const allTags = useMemo(() => {
		const t = new Map<string, number>();
		posts.forEach((p) =>
			p.tags?.forEach((tag) => t.set(tag, (t.get(tag) || 0) + 1))
		);
		return Array.from(t.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([name]) => name);
	}, [posts]);

	const filtered = useMemo(() => {
		const q = query.toLowerCase();
		return posts.filter((p) => {
			const matchesQuery =
				!q ||
				p.title?.toLowerCase().includes(q) ||
				p.excerpt?.toLowerCase().includes(q) ||
				p.tags?.some((t) => t.toLowerCase().includes(q));
			const matchesTag = !selectedTag || p.tags?.includes(selectedTag);
			return matchesQuery && matchesTag;
		});
	}, [posts, query, selectedTag]);

	const getHeaderStyle = () => {
		const base: React.CSSProperties = {
			background: theme.menuBarBackground,
			borderColor: theme.menuBarBorder,
		};
		if (theme.name === "neoBrutalism")
			return {
				...base,
				borderBottom: "2px solid #000",
				boxShadow: "6px 6px 0 #000",
			};
		if (theme.name === "modernMacOS")
			return {
				...base,
				boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
				backdropFilter: "blur(6px)",
			};
		if (theme.name === "dark")
			return {
				...base,
				boxShadow: "0 15px 35px rgba(0,0,0,0.3), 0 5px 15px rgba(0,0,0,0.2)",
				backdropFilter: "blur(4px)",
			};
		if (theme.name === "neon" || theme.name === "cyberpunk")
			return {
				...base,
				boxShadow: `0 0 18px ${theme.accentColor}80`,
				backdropFilter: "blur(6px)",
			};
		return base;
	};

	const getCardStyle = (): React.CSSProperties => {
		const base: React.CSSProperties = {
			background: theme.windowBackground,
			borderColor: theme.borderColor,
			boxShadow: theme.cardBoxShadow,
		};
		if (theme.name === "neoBrutalism")
			return {
				...base,
				boxShadow: "4px 4px 0 #000",
				border: "2px solid #000",
				borderRadius: 0,
			};
		if (theme.name === "neon")
			return { ...base, boxShadow: `0 0 12px ${theme.accentColor}90` };
		if (theme.name === "cyberpunk")
			return { ...base, boxShadow: "0 0 30px rgba(0,255,255,0.2)" };
		return base;
	};

	const getRootBackground = () => {
		if (theme.name === "neon")
			return `radial-gradient(60% 60% at 20% 10%, ${theme.accentColor}22, transparent), ${theme.backgroundColor}`;
		if (theme.name === "cyberpunk")
			return `linear-gradient(120deg, #0f0015 0%, #001a1a 100%)`;
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
			{/* Top bar */}
			<header className="sticky top-0 z-50 border-b" style={getHeaderStyle()}>
				<div className="flex items-center justify-between px-3 h-12">
					<a
						href="/"
						className="font-bold text-sm no-underline"
						style={{ color: theme.textColor }}
					>
						← Home
					</a>
					<div className="flex items-center gap-2">
						<details className="relative">
							<summary
								className="list-none text-xs px-2 py-1 rounded"
								style={{ border: `1px solid ${theme.borderColor}` }}
							>
								Aa
							</summary>
							<div
								className="absolute right-0 mt-2 w-64 rounded shadow border p-2"
								style={{
									background: theme.menuBarBackground,
									borderColor: theme.menuBarBorder,
								}}
							>
								<div className="text-[11px] opacity-70 mb-1">Appearance</div>
								<div className="grid grid-cols-2 gap-1 max-h-40 overflow-auto mb-2">
									{Object.entries(allThemes).map(([key, t]) => (
										<button
											key={key}
											className="text-xs px-2 py-1 rounded border"
											style={{
												borderColor: theme.borderColor,
												fontWeight: t.name === theme.name ? 700 : 400,
											}}
											onClick={() => setTheme(key)}
										>
											{t.name}
										</button>
									))}
								</div>
							</div>
						</details>
					</div>
				</div>
			</header>

			{/* Search and filters */}
			<section className="px-3 pt-3">
				<label
					className="block text-[11px] mb-1 opacity-70"
					htmlFor="search-input"
				>
					Search posts
				</label>
				<input
					id="search-input"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search by title, excerpt, or tag..."
					className="w-full text-sm px-3 py-2 rounded border outline-none"
					style={{
						background: theme.windowBackground,
						borderColor: theme.borderColor,
						color: theme.textColor,
					}}
					aria-label="Search posts"
				/>
				{allTags.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1">
						<button
							className="text-[11px] px-2 py-1 rounded border"
							style={{
								borderColor: theme.borderColor,
								background: !selectedTag ? theme.accentColor : "transparent",
								color: !selectedTag ? theme.windowBackground : theme.textColor,
							}}
							onClick={() => setSelectedTag("")}
						>
							All
						</button>
						{allTags.slice(0, 12).map((t) => (
							<button
								key={t}
								className="text-[11px] px-2 py-1 rounded border"
								style={{
									borderColor: theme.borderColor,
									background:
										selectedTag === t ? theme.accentColor : "transparent",
									color:
										selectedTag === t
											? theme.windowBackground
											: theme.textColor,
								}}
								onClick={() => setSelectedTag(t)}
							>
								{t}
							</button>
						))}
					</div>
				)}
			</section>

			{/* Posts list */}
			<main className="px-3 py-3">
				{isLoading ? (
					<div className="space-y-2" aria-live="polite" aria-busy="true">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="h-16 rounded border animate-pulse"
								style={{
									background: theme.windowBackground,
									borderColor: theme.borderColor,
								}}
							/>
						))}
					</div>
				) : filtered.length === 0 ? (
					<div className="text-sm opacity-80">No posts found.</div>
				) : (
					<ul role="list" className="space-y-2">
						{filtered.map((p) => (
							<li key={p.slug} role="listitem">
								<a
									href={p.slug ? `/blog/${p.slug}/` : "/blog/"}
									className={`block ${
										theme.name === "neoBrutalism" ? "rounded-none" : "rounded"
									} border p-3 no-underline`}
									style={{ ...getCardStyle(), color: theme.textColor }}
									aria-label={`Read post ${p.title}`}
								>
									<div
										className="text-sm font-semibold"
										style={{ color: theme.accentColor }}
									>
										{p.title}
									</div>
									{p.excerpt && (
										<div className="text-xs opacity-80 line-clamp-2 mt-1">
											{p.excerpt}
										</div>
									)}
									<div className="mt-1 flex items-center gap-2">
										{p.date && (
											<span className="text-[10px] opacity-60">
												{new Date(p.date).toLocaleDateString()}
											</span>
										)}
										{p.tags?.slice(0, 3).map((t) => (
											<span
												key={t}
												className="px-1.5 py-0.5 rounded text-[10px]"
												style={{
													background: theme.accentColor,
													color: theme.windowBackground,
												}}
											>
												{t}
											</span>
										))}
										{p.tags && p.tags.length > 3 && (
											<span
												className="px-1.5 py-0.5 rounded text-[10px]"
												style={{
													background: theme.borderColor,
													color: theme.textColor,
												}}
											>
												+{p.tags.length - 3}
											</span>
										)}
									</div>
								</a>
							</li>
						))}
					</ul>
				)}
			</main>

			<footer
				className="mt-auto px-3 py-3 border-t"
				style={{ borderColor: theme.menuBarBorder }}
			>
				<div className="text-[10px] opacity-70">
					© {new Date().getFullYear()} BlogOS
				</div>
			</footer>
		</div>
	);
}
