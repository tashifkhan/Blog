import React, { useState } from "react";
import ThemeSwitcher from "../theme-switcher";

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

interface MenuBarProps {
	theme: any;
	currentTime: Date;
	toggleRecentPosts: () => void;
	focusSearch: () => void;
	recentPosts: Post[];
	setWindowTitle: (title: string) => void;
	isMobile?: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({
	theme,
	currentTime,
	toggleRecentPosts,
	focusSearch,
	recentPosts,
	setWindowTitle,
	isMobile = false,
}) => {
	const [blogMenuOpen, setBlogMenuOpen] = useState(false);
	const [postsMenuOpen, setPostsMenuOpen] = useState(false);
	const [viewMenuOpen, setViewMenuOpen] = useState(false);

	const handleRecentPostClick = (title: string) => {
		setWindowTitle(`Blog - ${title}`);
		setBlogMenuOpen(false);
		setPostsMenuOpen(false);
	};

	// Close other menus when one is opened
	const toggleBlogMenu = () => {
		setBlogMenuOpen(!blogMenuOpen);
		setPostsMenuOpen(false);
		setViewMenuOpen(false);
	};

	const togglePostsMenu = () => {
		setPostsMenuOpen(!postsMenuOpen);
		setBlogMenuOpen(false);
		setViewMenuOpen(false);
	};

	const toggleViewMenu = () => {
		setViewMenuOpen(!viewMenuOpen);
		setBlogMenuOpen(false);
		setPostsMenuOpen(false);
	};

	return (
		<div
			className={`w-full px-1 py-0.5 flex ${
				isMobile ? "flex-wrap items-start" : "items-center"
			} text-sm`}
			style={{
				backgroundColor: theme.menuBarBackground,
				color: theme.menuBarText,
				borderBottom:
					theme.name === "neoBrutalism" ? "2px solid #000" : undefined,
			}}
		>
			{/* Blog Logo/Icon */}
			<div className="flex items-center mr-4">
				<span
					className="font-bold mx-2"
					style={{
						color: theme.name === "neoBrutalism" ? "#000" : theme.menuBarText,
					}}
				>
					Blog OS {theme.name === "neoBrutalism" ? "95" : "X"}
				</span>
			</div>

			{/* Menu Items */}
			<div
				className={`flex ${isMobile ? "flex-wrap gap-1 w-full mt-1" : "gap-4"}`}
			>
				{/* Blog Menu */}
				<div className="relative">
					<button
						onClick={toggleBlogMenu}
						className={`px-2 py-0.5 rounded ${
							blogMenuOpen ? "bg-black bg-opacity-10" : ""
						} hover:bg-black hover:bg-opacity-10`}
						aria-expanded={blogMenuOpen}
					>
						Blog
					</button>
					{blogMenuOpen && (
						<div
							className="absolute top-full left-0 mt-1 w-48 rounded shadow-lg z-50"
							style={{
								backgroundColor: theme.dropdownBackground,
								border:
									theme.name === "neoBrutalism" ? "2px solid #000" : undefined,
								boxShadow:
									theme.name === "neoBrutalism"
										? "3px 3px 0 #000"
										: theme.boxShadow,
							}}
						>
							<a href="/">
								<div
									className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
									onClick={() => {
										setBlogMenuOpen(false);
										setWindowTitle("Blog - Home");
									}}
								>
									Home
								</div>
							</a>
							<a href="/about">
								<div
									className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
									onClick={() => {
										setBlogMenuOpen(false);
										setWindowTitle("Blog - About");
									}}
								>
									About
								</div>
							</a>
							<a href="/contact">
								<div
									className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
									onClick={() => {
										setBlogMenuOpen(false);
										setWindowTitle("Blog - Contact");
									}}
								>
									Contact
								</div>
							</a>
							<div className="border-t border-gray-200 my-1"></div>
							<div
								className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
								onClick={() => {
									window.open("https://github.com/yourusername");
									setBlogMenuOpen(false);
								}}
							>
								GitHub
							</div>
							<div
								className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
								onClick={() => {
									window.open("https://twitter.com/yourusername");
									setBlogMenuOpen(false);
								}}
							>
								Twitter
							</div>
							<div className="border-t border-gray-200 my-1"></div>
							<div
								className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
								onClick={() => {
									// This is a placeholder for when we add real auth
									alert("Coming soon!");
									setBlogMenuOpen(false);
								}}
							>
								Sign In
							</div>
						</div>
					)}
				</div>

				{/* Posts Menu */}
				<div className="relative">
					<button
						onClick={togglePostsMenu}
						className={`px-2 py-0.5 rounded ${
							postsMenuOpen ? "bg-black bg-opacity-10" : ""
						} hover:bg-black hover:bg-opacity-10`}
						aria-expanded={postsMenuOpen}
					>
						Posts
					</button>
					{postsMenuOpen && (
						<div
							className="absolute top-full left-0 mt-1 w-48 rounded shadow-lg z-50"
							style={{
								backgroundColor: theme.dropdownBackground,
								border:
									theme.name === "neoBrutalism" ? "2px solid #000" : undefined,
								boxShadow:
									theme.name === "neoBrutalism"
										? "3px 3px 0 #000"
										: theme.boxShadow,
							}}
						>
							<a href="/posts/categories">
								<div
									className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
									onClick={() => {
										setPostsMenuOpen(false);
										setWindowTitle("Blog - Categories");
									}}
								>
									Categories
								</div>
							</a>
							<a href="/posts/tags">
								<div
									className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
									onClick={() => {
										setPostsMenuOpen(false);
										setWindowTitle("Blog - Tags");
									}}
								>
									Tags
								</div>
							</a>
							<a href="/posts/archive">
								<div
									className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
									onClick={() => {
										setPostsMenuOpen(false);
										setWindowTitle("Blog - Archive");
									}}
								>
									Archive
								</div>
							</a>
							{recentPosts.length > 0 && (
								<>
									<div className="border-t border-gray-200 my-1"></div>
									<div className="px-4 py-1 text-xs opacity-75">
										Recent Posts
									</div>
									{recentPosts.slice(0, 3).map((post) => (
										<a href={`/post/${post.slug}`} key={post.id}>
											<div
												className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer truncate"
												onClick={() => handleRecentPostClick(post.title)}
											>
												{post.title}
											</div>
										</a>
									))}
								</>
							)}
						</div>
					)}
				</div>

				{/* View Menu */}
				<div className="relative">
					<button
						onClick={toggleViewMenu}
						className={`px-2 py-0.5 rounded ${
							viewMenuOpen ? "bg-black bg-opacity-10" : ""
						} hover:bg-black hover:bg-opacity-10`}
						aria-expanded={viewMenuOpen}
					>
						View
					</button>
					{viewMenuOpen && (
						<div
							className="absolute top-full left-0 mt-1 w-48 rounded shadow-lg z-50"
							style={{
								backgroundColor: theme.dropdownBackground,
								border:
									theme.name === "neoBrutalism" ? "2px solid #000" : undefined,
								boxShadow:
									theme.name === "neoBrutalism"
										? "3px 3px 0 #000"
										: theme.boxShadow,
							}}
						>
							<div
								className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
								onClick={() => {
									toggleRecentPosts();
									setViewMenuOpen(false);
								}}
							>
								Toggle Recent Posts
							</div>
							<div
								className="px-4 py-2 hover:bg-black hover:bg-opacity-10 cursor-pointer"
								onClick={() => {
									focusSearch();
									setViewMenuOpen(false);
								}}
							>
								Search
							</div>
							<div className="border-t border-gray-200 my-1"></div>
							<div
								className="px-4 py-2 hover:bg-black hover:bg-opacity-10 flex items-center justify-between"
								onClick={(e) => e.stopPropagation()}
							>
								<span>Theme</span>
								<ThemeSwitcher theme={theme} />
							</div>
						</div>
					)}
				</div>

				{/* Mobile-responsive menu extras */}
				{isMobile && (
					<div className="flex gap-2 ml-auto">
						<button
							onClick={() => {
								focusSearch();
								setBlogMenuOpen(false);
								setPostsMenuOpen(false);
								setViewMenuOpen(false);
							}}
							className="px-2 py-0.5 rounded hover:bg-black hover:bg-opacity-10"
						>
							🔍
						</button>
						<button
							onClick={() => {
								toggleRecentPosts();
								setBlogMenuOpen(false);
								setPostsMenuOpen(false);
								setViewMenuOpen(false);
							}}
							className="px-2 py-0.5 rounded hover:bg-black hover:bg-opacity-10"
						>
							📋
						</button>
					</div>
				)}
			</div>

			{/* Clock on right side - hide on very small screens */}
			<div className={`ml-auto ${isMobile ? "hidden sm:block" : "block"}`}>
				<span className="opacity-75">{currentTime.toLocaleTimeString()}</span>
			</div>
		</div>
	);
};
