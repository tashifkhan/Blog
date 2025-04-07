import React, { useState } from "react";
import { WindowControls } from "./ui/window-controls";
import type { Post } from "@/types/post";
import { Posts } from "./posts/posts";
import { MenuBar } from "./menu/menu-bar";

interface MainWindowProps {
	theme: any;
	windowTitle: string;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	searchResults: Post[];
	setWindowTitle: (title: string) => void;
	searchInputRef: React.RefObject<HTMLInputElement>;
	windowState: "normal" | "minimized" | "maximized";
	onClose: () => void;
	onMinimize: () => void;
	onMaximize: () => void;
	isMobile?: boolean;
}

export const MainWindow: React.FC<MainWindowProps> = ({
	theme,
	windowTitle,
	searchQuery,
	setSearchQuery,
	searchResults,
	setWindowTitle,
	searchInputRef,
	windowState,
	onClose,
	onMinimize,
	onMaximize,
	isMobile = false,
}) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// If window is minimized, only show the title bar
	if (windowState === "minimized") {
		return (
			<div
				className={`rounded-lg overflow-hidden ${isMobile ? "w-full" : ""}`}
				style={{
					backgroundColor: theme.windowBackground,
					boxShadow: theme.boxShadow,
					border: theme.name === "neoBrutalism" ? "3px solid #000" : undefined,
					transform:
						theme.name === "neoBrutalism" ? "rotate(-1deg)" : undefined,
				}}
			>
				<div
					className={`flex items-center justify-between px-3 py-2 ${
						theme.name === "neoBrutalism" ? "bg-white" : ""
					}`}
					style={{
						backgroundColor:
							theme.name !== "neoBrutalism"
								? theme.windowHeaderBackground
								: undefined,
					}}
				>
					<WindowControls
						theme={theme}
						onClose={onClose}
						onMinimize={onMinimize}
						onMaximize={onMaximize}
					/>
					<span
						className="text-center flex-1 font-bold text-sm"
						style={{
							color:
								theme.name === "neoBrutalism" ? "#000" : theme.windowHeaderText,
						}}
					>
						{windowTitle}
					</span>
					<div className="w-[50px]"></div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`rounded-lg overflow-hidden max-w-full ${
				windowState === "maximized" ? "w-full h-full" : ""
			} ${isMobile ? "w-full" : ""}`}
			style={{
				backgroundColor: theme.windowBackground,
				boxShadow: theme.boxShadow,
				border: theme.name === "neoBrutalism" ? "3px solid #000" : undefined,
				transform: theme.name === "neoBrutalism" ? "rotate(-1deg)" : undefined,
			}}
		>
			{/* Window header */}
			<div
				className={`flex items-center justify-between px-3 py-2 ${
					theme.name === "neoBrutalism" ? "bg-white" : ""
				}`}
				style={{
					backgroundColor:
						theme.name !== "neoBrutalism"
							? theme.windowHeaderBackground
							: undefined,
				}}
			>
				<WindowControls
					theme={theme}
					onClose={onClose}
					onMinimize={onMinimize}
					onMaximize={onMaximize}
				/>
				<span
					className="text-center flex-1 font-bold text-sm truncate mx-2"
					style={{
						color:
							theme.name === "neoBrutalism" ? "#000" : theme.windowHeaderText,
					}}
				>
					{windowTitle}
				</span>
				<div className="w-[50px]"></div>
			</div>

			{/* Window content */}
			<div className={`p-6 ${isMobile ? "p-3" : "p-6"}`}>
				{/* Search bar */}
				<div
					className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4 mb-6`}
				>
					<div className={`relative ${isMobile ? "w-full" : "w-2/3"}`}>
						<input
							ref={searchInputRef}
							type="text"
							placeholder="Search blog posts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className={`w-full px-4 py-2 rounded ${
								theme.name === "neoBrutalism"
									? "border-2 border-black"
									: "bg-opacity-20"
							}`}
							style={{
								backgroundColor:
									theme.name === "neoBrutalism"
										? "#fff"
										: theme.inputBackground || "#ffffff20",
								color: theme.textColor,
								boxShadow:
									theme.name === "neoBrutalism" ? "3px 3px 0 #000" : undefined,
							}}
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								×
							</button>
						)}
					</div>

					{/* Auth buttons */}
					<div
						className={`flex gap-2 ${
							isMobile ? "w-full justify-between mt-2" : "ml-auto"
						}`}
					>
						{isAuthenticated ? (
							<button
								onClick={() => setIsAuthenticated(false)}
								className={`px-4 py-2 rounded ${
									theme.name === "neoBrutalism"
										? "border-2 border-black bg-white"
										: "bg-opacity-20"
								}`}
								style={{
									backgroundColor:
										theme.name === "neoBrutalism"
											? "#fff"
											: theme.buttonBackground || "#ffffff20",
									color: theme.textColor,
									boxShadow:
										theme.name === "neoBrutalism"
											? "3px 3px 0 #000"
											: undefined,
									transition: "transform 0.2s",
								}}
							>
								Sign Out
							</button>
						) : (
							<>
								<button
									onClick={() => setIsAuthenticated(true)}
									className={`px-4 py-2 rounded ${
										theme.name === "neoBrutalism"
											? "border-2 border-black bg-white"
											: "bg-opacity-20"
									}`}
									style={{
										backgroundColor:
											theme.name === "neoBrutalism"
												? "#fff"
												: theme.buttonBackground || "#ffffff20",
										color: theme.textColor,
										boxShadow:
											theme.name === "neoBrutalism"
												? "3px 3px 0 #000"
												: undefined,
										transition: "transform 0.2s",
									}}
								>
									Sign In
								</button>
								<button
									className={`px-4 py-2 rounded ${
										theme.name === "neoBrutalism" ? "border-2 border-black" : ""
									}`}
									style={{
										backgroundColor:
											theme.name === "neoBrutalism"
												? "#000"
												: theme.accentColor,
										color: theme.name === "neoBrutalism" ? "#fff" : "#000",
										boxShadow:
											theme.name === "neoBrutalism"
												? "3px 3px 0 #000"
												: undefined,
										transition: "transform 0.2s",
									}}
								>
									Sign Up
								</button>
							</>
						)}
					</div>
				</div>

				{/* Search results */}
				{searchQuery && (
					<div className="mb-6">
						<h2
							className="text-xl font-bold mb-4"
							style={{ color: theme.textColor }}
						>
							Search Results for "{searchQuery}"
						</h2>
						{searchResults.length > 0 ? (
							<div className="space-y-4">
								{searchResults.map((post) => (
									<div
										key={post.id}
										className={`p-4 rounded ${
											theme.name === "neoBrutalism"
												? "border-2 border-black bg-white"
												: "bg-opacity-10"
										}`}
										style={{
											backgroundColor:
												theme.name === "neoBrutalism"
													? "#fff"
													: theme.cardBackground || "#ffffff10",
											color:
												theme.name === "neoBrutalism"
													? "#000"
													: theme.textColor,
											boxShadow:
												theme.name === "neoBrutalism"
													? "3px 3px 0 #000"
													: undefined,
										}}
									>
										<h3 className="text-lg font-bold">{post.title}</h3>
										<p className="text-sm opacity-80">{post.excerpt}</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-center opacity-70">
								No results found for "{searchQuery}"
							</p>
						)}
					</div>
				)}

				{/* Blog posts */}
				{!searchQuery && <Posts theme={theme} isMobile={isMobile} />}
			</div>
		</div>
	);
};
