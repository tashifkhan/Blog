import React from "react";
import { ClockIcon } from "lucide-react";
import { Window } from "../ui/window";

interface Post {
	id: number;
	title: string;
	date: string;
	excerpt: string;
}

interface RecentPostsProps {
	posts: Post[];
	theme: any;
	onClose: () => void;
}

export function RecentPosts({ posts, theme, onClose }: RecentPostsProps) {
	const isNeoBrutalism = theme.name === "neoBrutalism";
	const neoColors = ["#4DEEEA", "#FF498B", "#FFC857", "#74EE15"];

	return (
		<Window
			title={isNeoBrutalism ? "RECENT POSTS" : "Recent Posts"}
			theme={theme}
			width="300px"
			onClose={onClose}
		>
			<div className="flex items-center mb-4">
				<ClockIcon
					size={isNeoBrutalism ? 24 : 16}
					style={{ color: theme.textColor }}
				/>
				<span
					className={`ml-2 ${
						isNeoBrutalism
							? "text-base font-black uppercase"
							: "text-sm font-bold"
					}`}
				>
					{isNeoBrutalism ? "LATEST UPDATES" : "Latest Updates"}
				</span>
			</div>
			<ul className="space-y-3">
				{posts.map((post, index) => (
					<li key={post.id}>
						{isNeoBrutalism ? (
							<a
								href={`/post/${post.id}`}
								className="block p-2 relative"
								style={{
									backgroundColor: neoColors[index % neoColors.length],
									border: "3px solid #000000",
									color: "#000000",
									boxShadow: "3px 3px 0px #000000",
									transform: "translateX(-1px) translateY(-1px)",
									transition: "all 0.1s ease",
								}}
								onMouseOver={(e) => {
									e.currentTarget.style.transform =
										"translateX(0) translateY(0)";
									e.currentTarget.style.boxShadow = "1px 1px 0px #000000";
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.transform =
										"translateX(-1px) translateY(-1px)";
									e.currentTarget.style.boxShadow = "3px 3px 0px #000000";
								}}
							>
								<h4 className="text-sm font-black uppercase">{post.title}</h4>
								<p className="text-xs font-bold mt-1">{post.date}</p>
							</a>
						) : (
							<a
								href={`/post/${post.id}`}
								className="block p-2 hover:bg-opacity-80 transition-colors shadow-sm"
								style={{
									backgroundColor: `${theme.backgroundColor}50`,
									border: `1px solid ${theme.borderColor}`,
									borderRadius: "4px",
									color: theme.textColor,
								}}
							>
								<h4 className="text-sm font-bold">{post.title}</h4>
								<p className="text-xs text-gray-500">{post.date}</p>
							</a>
						)}
					</li>
				))}
			</ul>
			{isNeoBrutalism && (
				<div className="mt-4">
					<button
						className="w-full py-2 text-center font-bold uppercase"
						style={{
							backgroundColor: "#FFC857",
							border: "3px solid #000000",
							color: "#000000",
						}}
					>
						View All Posts
					</button>
				</div>
			)}
		</Window>
	);
}
