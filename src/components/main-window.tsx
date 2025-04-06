import React from "react";
import { Window } from "./ui/window";
import { SearchBar } from "./search/search-bar";
import { SearchResults } from "./search/search-results";
import { NeoButton } from "./ui/neo-button";
import { UbuntuButton } from "./ui/ubuntu-button";

interface MainWindowProps {
	theme: any;
	windowTitle: string;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	searchResults: any[];
	setWindowTitle: (title: string) => void;
}

export function MainWindow({
	theme,
	windowTitle,
	searchQuery,
	setSearchQuery,
	searchResults,
	setWindowTitle,
}: MainWindowProps) {
	// Check theme types
	const isNeoBrutalism = theme.name === "neoBrutalism";
	const isUbuntu = theme.name === "ubuntu";

	// Determine menu item colors for neobrutalism
	const neoColors = ["#4DEEEA", "#FF498B", "#FFC857", "#74EE15"];

	// Ubuntu variant colors
	const ubuntuVariants = ["primary", "secondary", "action"];

	return (
		<Window title={windowTitle} theme={theme}>
			<div
				className={`text-4xl font-bold mb-8 text-center py-6 px-4 ${
					isNeoBrutalism
						? "transform rotate-1"
						: isUbuntu
						? "rounded"
						: "shadow-inner"
				}`}
				style={{
					backgroundColor: isNeoBrutalism
						? "#FFFFFF"
						: isUbuntu
						? "#3C3B37"
						: `${theme.backgroundColor}20`,
					border: isNeoBrutalism
						? `3px solid ${theme.borderColor}`
						: isUbuntu
						? `1px solid ${theme.windowBorder}`
						: `2px solid ${theme.borderColor}`,
					borderRadius: isNeoBrutalism ? "0" : isUbuntu ? "4px" : "4px",
					color: theme.textColor,
					boxShadow: isNeoBrutalism
						? "5px 5px 0px #000000"
						: isUbuntu
						? "0 2px 4px rgba(0,0,0,0.3)"
						: "none",
				}}
			>
				{isNeoBrutalism
					? "WELCOME TO MY BRUTALIST BLOG"
					: isUbuntu
					? "Welcome to Ubuntu Blog"
					: "Welcome to My Retro Blog"}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{["Blog", "Projects", "About"].map((item, index) =>
					isNeoBrutalism ? (
						<NeoButton
							key={item}
							color={neoColors[index % neoColors.length]}
							onClick={() => {
								setWindowTitle(`Blog - ${item}`);
							}}
							className="flex flex-col items-center justify-center h-28"
						>
							<h2 className="text-xl font-black mb-2">{item.toUpperCase()}</h2>
							<p className="text-sm font-bold">
								{item === "Blog" && "READ MY LATEST ARTICLES"}
								{item === "Projects" && "SEE MY LATEST WORK"}
								{item === "About" && "LEARN MORE ABOUT ME"}
							</p>
						</NeoButton>
					) : isUbuntu ? (
						<div
							key={item}
							className="bg-opacity-20 rounded p-4 flex flex-col"
							style={{
								backgroundColor: "rgba(255, 255, 255, 0.1)",
								border: "1px solid rgba(255,255,255,0.1)",
								boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
							}}
						>
							<h2 className="text-xl font-medium mb-2">{item}</h2>
							<p className="text-sm text-gray-300 mb-4">
								{item === "Blog" && "Read my latest thoughts and articles"}
								{item === "Projects" && "Browse my latest work and creations"}
								{item === "About" && "Learn more about me and my background"}
							</p>
							<UbuntuButton
								variant={ubuntuVariants[index % ubuntuVariants.length] as any}
								onClick={() => {
									setWindowTitle(`Blog - ${item}`);
								}}
								className="mt-auto self-end"
							>
								Open {item}
							</UbuntuButton>
						</div>
					) : (
						<a
							key={item}
							href={`/${item.toLowerCase()}`}
							className="block p-4 hover:bg-opacity-80 transition-colors shadow-sm"
							style={{
								backgroundColor: `${theme.backgroundColor}50`,
								border: `1px solid ${theme.borderColor}`,
								borderRadius: "4px",
								color: theme.textColor,
							}}
							onClick={(e) => {
								e.preventDefault();
								setWindowTitle(`Blog - ${item}`);
							}}
						>
							<h2 className="text-xl font-bold mb-2">{item}</h2>
							<p className="text-sm">
								{item === "Blog" && "Read my latest thoughts and articles"}
								{item === "Projects" && "Browse my latest work and creations"}
								{item === "About" && "Learn more about me and my background"}
							</p>
						</a>
					)
				)}
			</div>

			{/* Search bar */}
			<div className="mt-8">
				<SearchBar
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					theme={theme}
					isNeoBrutalism={isNeoBrutalism}
					isUbuntu={isUbuntu}
				/>
				<SearchResults
					results={searchResults}
					theme={theme}
					isNeoBrutalism={isNeoBrutalism}
					isUbuntu={isUbuntu}
				/>
			</div>
		</Window>
	);
}
