import React from "react";
import { NeoButton } from "../ui/neo-button";
import { UbuntuButton } from "../ui/ubuntu-button";

interface Post {
	id: number;
	title: string;
	date: string;
	excerpt: string;
}

interface SearchResultsProps {
	results: Post[];
	theme: any;
	isNeoBrutalism?: boolean;
	isUbuntu?: boolean;
}

export function SearchResults({
	results,
	theme,
	isNeoBrutalism = false,
	isUbuntu = false,
}: SearchResultsProps) {
	if (results.length === 0) {
		return null;
	}

	// Colors for neobrutalism result items
	const neoColors = ["#4DEEEA", "#FF498B", "#FFC857", "#74EE15"];

	// Ubuntu variant colors
	const ubuntuVariants = ["primary", "secondary", "action"];

	return (
		<div className="mt-4">
			<h3
				className={`${
					isNeoBrutalism
						? "text-xl font-black uppercase"
						: isUbuntu
						? "text-lg font-medium"
						: "text-lg font-bold"
				} mb-2`}
			>
				{isUbuntu ? "Search Results" : "Search Results:"}
			</h3>
			<ul className="space-y-4">
				{results.map((post, index) => (
					<li key={post.id} className="mb-2">
						{isNeoBrutalism ? (
							<div
								className="block p-3 relative transform"
								style={{
									backgroundColor: neoColors[index % neoColors.length],
									border: "3px solid #000000",
									boxShadow: "5px 5px 0px #000000",
									transform: "translateX(-2px) translateY(-2px)",
								}}
							>
								<h4 className="text-lg font-black uppercase">{post.title}</h4>
								<p className="text-sm font-bold my-1">{post.excerpt}</p>
								<p className="text-xs font-bold mt-2 flex justify-between items-center">
									<span>{post.date}</span>
									<button className="bg-white px-3 py-1 text-black border-2 border-black hover:bg-gray-100">
										READ
									</button>
								</p>
							</div>
						) : isUbuntu ? (
							<div
								className="block p-4 rounded"
								style={{
									backgroundColor: "rgba(255, 255, 255, 0.1)",
									border: "1px solid rgba(255,255,255,0.1)",
									boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
								}}
							>
								<h4 className="text-lg font-medium text-white">{post.title}</h4>
								<p className="text-sm text-gray-300 my-2">{post.excerpt}</p>
								<div className="flex justify-between items-center">
									<span className="text-xs text-gray-400">{post.date}</span>
									<UbuntuButton
										variant={
											ubuntuVariants[index % ubuntuVariants.length] as any
										}
										className="px-3 py-1 text-sm"
									>
										Read More
									</UbuntuButton>
								</div>
							</div>
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
								<h4 className="text-md font-bold">{post.title}</h4>
								<p className="text-sm">{post.excerpt}</p>
								<p className="text-xs text-gray-500">{post.date}</p>
							</a>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
