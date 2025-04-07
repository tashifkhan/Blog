import React from "react";
import { WindowControls } from "../ui/window-controls";

// Define Post interface inline
interface Post {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	content: string;
	date: string;
	imageUrl?: string;
	author: {
		name: string;
		avatar?: string;
	};
	tags: string[];
}

interface RecentPostsProps {
	posts: Post[];
	theme: any;
	onClose: () => void;
	windowState: "normal" | "minimized" | "maximized";
	onMinimize: () => void;
	onMaximize: () => void;
	isMobile?: boolean;
}

export const RecentPosts: React.FC<RecentPostsProps> = ({
	posts,
	theme,
	onClose,
	windowState,
	onMinimize,
	onMaximize,
	isMobile = false,
}) => {
	// If window is minimized, only show the title bar
	if (windowState === "minimized") {
		return (
			<div
				className={`rounded-lg overflow-hidden ${isMobile ? "w-full" : ""}`}
				style={{
					backgroundColor: theme.windowBackground,
					boxShadow: theme.boxShadow,
					border: theme.name === "neoBrutalism" ? "3px solid #000" : undefined,
					transform: theme.name === "neoBrutalism" ? "rotate(1deg)" : undefined,
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
						Recent Posts
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
				transform: theme.name === "neoBrutalism" ? "rotate(1deg)" : undefined,
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
					Recent Posts
				</span>
				<div className="w-[50px]"></div>
			</div>

			{/* Window content */}
			<div className={`${isMobile ? "p-3" : "p-4"}`}>
				<div className="space-y-3">
					{posts.slice(0, 5).map((post) => (
						<a href={`/post/${post.slug}`} key={post.id}>
							<div
								className={`${
									isMobile ? "p-2" : "p-3"
								} rounded transition-transform hover:scale-[1.02] cursor-pointer ${
									theme.name === "neoBrutalism"
										? "border-2 border-black bg-white"
										: ""
								}`}
								style={{
									backgroundColor:
										theme.name === "neoBrutalism"
											? "#fff"
											: theme.cardBackground || "#ffffff10",
									color:
										theme.name === "neoBrutalism" ? "#000" : theme.textColor,
									boxShadow:
										theme.name === "neoBrutalism"
											? "3px 3px 0 #000"
											: undefined,
								}}
							>
								<div className="flex items-start">
									{post.imageUrl && (
										<div
											className={`${
												isMobile ? "w-16 h-16" : "w-20 h-20"
											} rounded overflow-hidden mr-3 flex-shrink-0`}
										>
											<img
												src={post.imageUrl}
												alt={post.title}
												className="w-full h-full object-cover"
											/>
										</div>
									)}
									<div className="flex-1 min-w-0">
										<h3
											className={`${
												isMobile ? "text-sm" : "text-base"
											} font-bold mb-1 truncate`}
											style={{
												color:
													theme.name === "neoBrutalism"
														? "#000"
														: theme.headingColor || theme.textColor,
											}}
										>
											{post.title}
										</h3>
										<p
											className={`${
												isMobile
													? "text-xs line-clamp-2"
													: "text-sm line-clamp-3"
											} opacity-70`}
										>
											{post.excerpt}
										</p>
										<div
											className={`mt-1 flex items-center ${
												isMobile ? "text-xs" : "text-sm"
											}`}
										>
											<span className="opacity-70">
												{new Date(post.date).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
							</div>
						</a>
					))}
				</div>

				<div className="mt-4 text-center">
					<a href="/archive">
						<button
							className={`px-4 py-2 text-sm rounded ${
								theme.name === "neoBrutalism"
									? "border-2 border-black bg-white"
									: ""
							}`}
							style={{
								backgroundColor:
									theme.name === "neoBrutalism"
										? "#fff"
										: theme.buttonBackground || theme.accentColor + "40",
								color: theme.textColor,
								boxShadow:
									theme.name === "neoBrutalism" ? "3px 3px 0 #000" : undefined,
							}}
						>
							View All Posts
						</button>
					</a>
				</div>
			</div>
		</div>
	);
};
