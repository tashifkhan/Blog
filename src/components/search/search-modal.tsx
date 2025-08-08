import React, { useEffect, useRef } from "react";

type Result = {
	slug?: string;
	title?: string;
	excerpt?: string;
	date?: string;
	tags?: string[];
};

interface SearchModalProps {
	open: boolean;
	theme: any;
	query: string;
	setQuery: (q: string) => void;
	results: Result[];
	onClose: () => void;
	onSelect?: (slug?: string) => void;
}

export default function SearchModal({
	open,
	theme,
	query,
	setQuery,
	results,
	onClose,
	onSelect,
}: SearchModalProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		if (open) {
			document.addEventListener("keydown", onKey);
			setTimeout(() => inputRef.current?.focus(), 0);
		}
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="search-modal-title"
			className="fixed inset-0 z-[1000] flex items-start sm:items-center justify-center p-3 sm:p-6"
			style={{ color: theme.textColor }}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			{/* Overlay */}
			<div
				className="absolute inset-0"
				style={{ background: "rgba(0,0,0,0.45)" }}
			/>

			{/* Panel */}
			<div
				className="relative w-full max-w-2xl rounded-lg shadow-xl border"
				style={{
					background: theme.windowBackground,
					borderColor: theme.borderColor,
				}}
			>
				{/* Header/Search input */}
				<div
					className="flex items-center gap-2 p-3 border-b"
					style={{ borderColor: theme.borderColor }}
				>
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								const first = results[0];
								if (first) {
									onSelect?.(first.slug);
								}
							}
						}}
						placeholder="Search posts..."
						aria-label="Search posts"
						className="w-full bg-transparent outline-none text-sm sm:text-base"
						style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
					/>
					<button
						onClick={onClose}
						aria-label="Close search"
						className="text-xs px-2 py-1 rounded"
						style={{ border: `1px solid ${theme.borderColor}` }}
					>
						Esc
					</button>
				</div>

				{/* Results */}
				<div className="max-h-[60vh] overflow-auto p-2 sm:p-3">
					{results.length === 0 && (
						<div className="text-sm opacity-70 p-2">No results.</div>
					)}
					<ul role="list" className="space-y-2">
						{results.map((r, i) => (
							<li key={(r.slug ?? r.title ?? "") + i} role="listitem">
								<a
									href={r.slug ? `/blog/${r.slug}/` : "/blog/"}
									onClick={(e) => {
										e.preventDefault();
										onSelect?.(r.slug);
									}}
									className="block rounded-lg p-3 focus:outline-none"
									style={{
										background: theme.cardBackground || theme.windowBackground,
										border: `1px solid ${theme.borderColor}`,
									}}
								>
									<div
										className="text-sm sm:text-base font-semibold"
										style={{ color: theme.accentColor }}
									>
										{r.title || r.slug}
									</div>
									{r.excerpt && (
										<div className="text-xs sm:text-sm opacity-80">
											{r.excerpt}
										</div>
									)}
									<div className="mt-1 flex flex-wrap gap-1.5">
										{r.tags?.slice(0, 4).map((t) => (
											<span
												key={t}
												className="px-2 py-0.5 rounded text-[10px] sm:text-xs"
												style={{ background: theme.accentColor, color: "#fff" }}
											>
												{t}
											</span>
										))}
									</div>
								</a>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
