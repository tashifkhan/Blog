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
	const [fontScale, setFontScale] = useState(1);
	const [lineHeight, setLineHeight] = useState(1.7);
	const [contentWidth, setContentWidth] = useState(42); // ch

	useEffect(() => {
		setThemeState(activeTheme);
		const onChange = () => setThemeState(activeTheme);
		window.addEventListener("themechange", onChange);
		return () => window.removeEventListener("themechange", onChange);
	}, []);

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
												setFontScale((s) =>
													Math.max(0.85, +(s - 0.05).toFixed(2))
												)
											}
										>
											-
										</button>
										<span
											className="text-xs w-10 text-center"
											aria-live="polite"
										>
											{Math.round(fontScale * 100)}%
										</span>
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() =>
												setFontScale((s) =>
													Math.min(1.4, +(s + 0.05).toFixed(2))
												)
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
												setLineHeight((h) =>
													Math.max(1.3, +(h - 0.1).toFixed(2))
												)
											}
										>
											-
										</button>
										<span
											className="text-xs w-10 text-center"
											aria-live="polite"
										>
											{lineHeight.toFixed(1)}
										</span>
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() =>
												setLineHeight((h) =>
													Math.min(2.0, +(h + 0.1).toFixed(2))
												)
											}
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
											onClick={() =>
												setContentWidth((w) => Math.max(34, w - 2))
											}
										>
											-
										</button>
										<span
											className="text-xs w-10 text-center"
											aria-live="polite"
										>
											{contentWidth}ch
										</span>
										<button
											className="text-xs px-2 py-1 rounded border"
											style={{ borderColor: theme.borderColor }}
											onClick={() =>
												setContentWidth((w) => Math.min(60, w + 2))
											}
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
					style={{ maxWidth: `${contentWidth}ch`, ...getArticleCardStyle() }}
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
						className="prose prose-sm sm:prose"
						style={{
							color: theme.textColor,
							fontSize: `${fontScale}rem`,
							lineHeight,
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
	);
}
