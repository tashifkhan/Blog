import React from "react";
import { SearchIcon } from "lucide-react";

interface SearchBarProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	theme: any;
	isNeoBrutalism?: boolean;
	isUbuntu?: boolean;
}

export function SearchBar({
	searchQuery,
	setSearchQuery,
	theme,
	isNeoBrutalism = false,
	isUbuntu = false,
}: SearchBarProps) {
	let searchBarStyle = {};

	if (isNeoBrutalism) {
		searchBarStyle = {
			background: "#FFFFFF",
			border: "3px solid #000000",
			borderRadius: "0",
			color: "#000000",
			padding: "8px 16px",
			boxShadow: "4px 4px 0px #000000",
			transform: "translateX(-2px) translateY(-2px)",
			fontWeight: "bold",
		};
	} else if (isUbuntu) {
		searchBarStyle = {
			background: "rgba(255, 255, 255, 0.1)",
			border: "1px solid rgba(255, 255, 255, 0.2)",
			borderRadius: "4px",
			color: "#FFFFFF",
			padding: "8px 10px",
			boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
			fontSize: "14px",
		};
	} else {
		searchBarStyle = {
			background: `${theme.backgroundColor}50`,
			border: `1px solid ${theme.borderColor}`,
			borderRadius: "4px",
			color: theme.textColor,
		};
	}

	return (
		<div className="flex items-center mb-4">
			<SearchIcon
				size={isNeoBrutalism ? 24 : 16}
				style={{
					color: isUbuntu
						? "#E95420"
						: isNeoBrutalism
						? "#000000"
						: theme.textColor,
					marginRight: isNeoBrutalism ? "12px" : "8px",
				}}
			/>
			<input
				type="text"
				placeholder={
					isNeoBrutalism
						? "SEARCH POSTS..."
						: isUbuntu
						? "Search the Ubuntu Blog..."
						: "Search recent posts..."
				}
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className={`ml-2 p-2 flex-1 ${isNeoBrutalism ? "uppercase" : ""}`}
				style={searchBarStyle}
			/>
		</div>
	);
}
