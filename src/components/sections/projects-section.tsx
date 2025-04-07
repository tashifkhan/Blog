import React from "react";
import { motion } from "framer-motion";

interface ProjectsSectionProps {
	theme: any;
}

export function ProjectsSection({ theme }: ProjectsSectionProps) {
	// Sample projects data
	const projects = [
		{
			id: 1,
			title: "NeoBrutalist UI Kit",
			description:
				"A collection of UI components with a neobrutalist design style.",
			tags: ["React", "TypeScript", "CSS"],
			link: "#",
		},
		{
			id: 2,
			title: "Blog Template Engine",
			description:
				"A flexible and customizable blog template system with multiple themes.",
			tags: ["NextJS", "TypeScript", "TailwindCSS"],
			link: "#",
		},
		{
			id: 3,
			title: "Window Manager Component",
			description:
				"A React component for managing window-like interfaces with animations.",
			tags: ["React", "Framer Motion", "UI/UX"],
			link: "#",
		},
	];

	return (
		<div>
			<h2
				className="text-2xl font-bold mb-4"
				style={{ color: theme.headingColor || theme.textColor }}
			>
				Featured Projects
			</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{projects.map((project, index) => (
					<motion.div
						key={project.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 * index }}
						className="p-4 rounded-md"
						style={{
							background: theme.cardBackground || theme.windowBackground,
							border: `${theme.borderWidth}px solid ${theme.borderColor}`,
							cursor: "pointer",
						}}
						whileHover={{
							scale: 1.03,
							boxShadow: theme.hoverBoxShadow || theme.boxShadow,
						}}
					>
						<h3
							className="text-xl font-bold mb-2"
							style={{ color: theme.accentColor }}
						>
							{project.title}
						</h3>
						<p className="mb-3" style={{ color: theme.textColor }}>
							{project.description}
						</p>
						<div className="flex flex-wrap gap-2">
							{project.tags.map((tag) => (
								<span
									key={tag}
									className="text-xs font-medium px-2 py-1 rounded"
									style={{
										background: theme.tagBackground || theme.accentColor,
										color: theme.tagTextColor || theme.windowBackground,
									}}
								>
									{tag}
								</span>
							))}
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}
