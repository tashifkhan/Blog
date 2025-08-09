import React, { useEffect, useMemo, useState } from "react";
import { activeTheme, allThemes, setTheme } from "@/lib/theme-config";

interface MobilePostReaderProps {
	title?: string;
	date?: string;
	excerpt?: string;
	tags?: string[];
	children?: React.ReactNode;
}

export function MobilePostReader({
	title,
	date,
	excerpt,
	tags,
	children,
}: MobilePostReaderProps) {
	const [theme, setThemeState] = useState(activeTheme);

	useEffect(() => {
		setThemeState(activeTheme);
		
		// Sync theme variables to CSS
		const syncThemeVars = () => {
			if (typeof document !== "undefined") {
				const root = document.documentElement;
				const currentTheme = activeTheme;

				root.style.setProperty("--theme-bg", currentTheme.backgroundColor);
				root.style.setProperty("--theme-text", currentTheme.textColor);
				root.style.setProperty("--theme-accent", currentTheme.accentColor);
				root.style.setProperty("--theme-border", currentTheme.borderColor);
				root.style.setProperty("--theme-window-bg", currentTheme.windowBackground);
				root.style.setProperty("--theme-muted", currentTheme.menuBarBackground);
				root.style.setProperty("--theme-secondary", currentTheme.statusBarBackground);
			}
		};
		
		syncThemeVars();
		
		const onChange = () => {
			setThemeState(activeTheme);
			syncThemeVars();
		};
		window.addEventListener("themechange", onChange);
		return () => window.removeEventListener("themechange", onChange);
	}, []);

	// CSS variable helpers
	const setVar = (name: string, value: string) =>
		document.documentElement.style.setProperty(name, value);

	const getVar = (name: string, fallback: number): number => {
		const v = getComputedStyle(document.documentElement).getPropertyValue(name);
		const n = parseFloat(v);
		return Number.isFinite(n) && n > 0 ? n : fallback;
	};

	const inc = (
		name: string,
		step: number,
		min: number,
		max: number,
		suffix = ""
	) => {
		const cur = getVar(name, min);
		const next = Math.min(max, Math.max(min, +(cur + step).toFixed(2)));
		setVar(name, `${next}${suffix}`);
	};

	const reset = () => {
		setVar("--reader-font-scale", "1");
		setVar("--reader-line-height", "1.7");
		setVar("--reader-content-width", "42");
	};

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

	const getRootBackground = () => {
		if (theme.name === "neon")
			return `radial-gradient(60% 60% at 20% 10%, ${theme.accentColor}22, transparent), ${theme.backgroundColor}`;
		if (theme.name === "cyberpunk")
			return `linear-gradient(120deg, #0f0015 0%, #001a1a 100%)`;
		return theme.backgroundColor;
	};

	const getArticleCardStyle = (): React.CSSProperties => {
		const base: React.CSSProperties = {
			background: theme.windowBackground,
			borderColor: theme.borderColor,
		};
		if (theme.name === "neoBrutalism")
			return { ...base, border: "2px solid #000", boxShadow: "6px 6px 0 #000" };
		if (theme.name === "neon")
			return { ...base, boxShadow: `0 0 16px ${theme.accentColor}90` };
		if (theme.name === "cyberpunk")
			return { ...base, boxShadow: "0 0 30px rgba(0,255,255,0.2)" };
		if (theme.name === "modernMacOS")
			return {
				...base,
				boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
			};
		return base;
	};

	return (
		<>
			<style>
				{`
					.mobile-content * {
						color: var(--theme-text) !important;
					}
					.mobile-content h1,
					.mobile-content h2,
					.mobile-content h3,
					.mobile-content h4,
					.mobile-content h5,
					.mobile-content h6 {
						color: var(--theme-text) !important;
					}
					.mobile-content p {
						color: var(--theme-text) !important;
					}
					.mobile-content li {
						color: var(--theme-text) !important;
					}
					.mobile-content strong {
						color: var(--theme-text) !important;
					}
					.mobile-content em {
						color: var(--theme-text) !important;
					}
					.mobile-content a {
						color: var(--theme-accent) !important;
					}
					.mobile-content code {
						color: var(--theme-text) !important;
					}
					.mobile-content td,
					.mobile-content th {
						color: var(--theme-text) !important;
					}
				`}
			</style>
		<div
			className="min-h-screen flex flex-col"
			style={{
				background: getRootBackground(),
				color: theme.textColor,
				fontFamily: theme.fontFamily,
			}}
		>
			{/* Reader toolbar */}
			<header
				className="sticky top-0 z-50 border-b"
				style={getHeaderStyle()}
				aria-label="Reader toolbar"
			>
				<div className="flex items-center justify-between px-3 h-12">
					<a
						href="/"
						className="text-sm font-bold no-underline"
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
								className="absolute right-0 mt-2 w-60 rounded shadow border p-2"
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
								<div className="text-[11px] opacity-70 mb-1">Typography</div>
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs">Font size</span>
									<div className="flex items-center gap-2">
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() =>
												inc("--reader-font-scale", -0.05, 0.85, 1.4)
											}
										>
											-
										</button>
										<span
											className="text-xs w-10 text-center"
											aria-live="polite"
										>
											{Math.round(getVar("--reader-font-scale", 1) * 100)}%
										</span>
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() =>
												inc("--reader-font-scale", 0.05, 0.85, 1.4)
											}
										>
											+
										</button>
									</div>
								</div>
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs">Line height</span>
									<div className="flex items-center gap-2">
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() =>
												inc("--reader-line-height", -0.1, 1.3, 2.0)
											}
										>
											-
										</button>
										<span
											className="text-xs w-10 text-center"
											aria-live="polite"
										>
											{getVar("--reader-line-height", 1.7).toFixed(1)}
										</span>
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() => inc("--reader-line-height", 0.1, 1.3, 2.0)}
										>
											+
										</button>
									</div>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-xs">Content width</span>
									<div className="flex items-center gap-2">
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() => inc("--reader-content-width", -2, 34, 60)}
										>
											-
										</button>
										<span
											className="text-xs w-10 text-center"
											aria-live="polite"
										>
											{getVar("--reader-content-width", 42)}ch
										</span>
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() => inc("--reader-content-width", 2, 34, 60)}
										>
											+
										</button>
									</div>
								</div>
							</div>
						</details>
					</div>
				</div>
			</header>

			<main className="px-4 py-5">
				<article
					className="mx-auto rounded border p-3"
					style={{
						maxWidth: `min(100%, calc(var(--reader-content-width, 42) * 1ch))`,
						...getArticleCardStyle(),
					}}
				>
					<header className="mb-4">
						<h1
							className="text-2xl font-extrabold mb-2"
							style={{ color: theme.accentColor }}
						>
							{title}
						</h1>
						{date && (
							<div className="text-xs opacity-70 mb-1">
								{new Date(date).toLocaleDateString()}
							</div>
						)}
						{tags && tags.length > 0 && (
							<div className="flex flex-wrap gap-1 mb-2">
								{tags.map((t) => (
									<span
										key={t}
										className="px-2 py-0.5 rounded text-[10px]"
										style={{
											background: theme.accentColor,
											color: theme.windowBackground,
										}}
									>
										{t}
									</span>
								))}
							</div>
						)}
						{excerpt && <p className="text-sm opacity-80 italic">{excerpt}</p>}
					</header>

					<div
						className="max-w-none mobile-content"
						style={{
							color: "var(--theme-text) !important",
							fontSize: `calc(var(--reader-font-scale, 1) * 1rem)`,
							lineHeight: `var(--reader-line-height, 1.6)`,
						}}
					>
						{children}
					</div>
				</article>
			</main>

			<footer
				className="mt-auto px-4 py-3 border-t"
				style={{ borderColor: theme.menuBarBorder }}
			>
				<div className="text-[10px] opacity-70">
					© {new Date().getFullYear()} BlogOS
				</div>
			</footer>
		</div>
		</>
	);
}
