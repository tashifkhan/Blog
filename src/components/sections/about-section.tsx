import React from "react";
import { motion } from "framer-motion";
import {
	FaGithub,
	FaLinkedin,
	FaGlobe,
	FaEnvelope,
	FaMapMarkerAlt,
	FaExternalLinkAlt,
	FaCode,
} from "react-icons/fa";

interface AboutSectionProps {
	theme: any;
}

export function AboutSection({ theme }: AboutSectionProps) {
	const linkStyle = {
		display: "inline-flex",
		alignItems: "center",
		gap: "0.5rem",
		padding: "0.5rem 1rem",
		borderRadius: "6px",
		textDecoration: "none",
		border: `1px solid ${theme.borderColor}`,
		background: "transparent",
		color: theme.accentColor,
		fontSize: "0.875rem",
		transition: "all 0.2s ease",
	};

	const featuredProjects = [
		{
			title: "FindexAI — AI-Powered Browser Discovery Engine",
			description:
				"Pioneered FindexAI, an AI-powered browser extension transforming conventional browser search into a sophisticated discovery engine. Features multi-agent architecture with LangChain and LangGraph, vector-based similarity search with FAISS and ChromaDB, and a customizable theme engine including MacOS Classic, Windows XP, and Neobrutal styles.",
			tech: [
				"Next.js",
				"React",
				"FastAPI",
				"LangChain",
				"LangGraph",
				"FAISS",
				"ChromaDB",
				"Docker",
				"WebExtension APIs",
			],
			liveUrl: "https://findex.tashif.codes/",
			githubUrl: "https://github.com/tashifkhan/findex",
		},
		{
			title: "TalentSync AI",
			description:
				"AI-driven Next.js platform for comprehensive resume analysis, job category prediction, and efficient talent management. Features intelligent parsing, personalized cold email generation, targeted interview questions, and compelling answer frameworks using LangChain and RAG.",
			tech: [
				"Next.js",
				"TypeScript",
				"FastAPI",
				"LangChain",
				"LangGraph",
				"PostgreSQL",
				"Docker",
			],
			liveUrl: "https://talentsync.tashif.codes/",
			githubUrl: "https://github.com/harleenkaur28/AI-Resume-Parser",
		},
		{
			title: "JIIT Tool Suite",
			description: "Bundled tools for JIIT students",
			tech: ["React", "Python", "WASM (Pyodide)", "MongoDB", "PWA"],
			liveUrl: "https://jiit-tools.tashif.codes/",
			githubUrl: "https://github.com/tashifkhan/JIIT-tools-docs",
		},
		{
			title: "SolarHelper",
			description:
				"React PWA delivering personalized solar sizing, cost projections, and savings forecasts. Features AI chatbot with LangChain and RAG for solar guidance, LightGBM for yield forecasts, and FastAPI backend for web scraping and real-time data processing.",
			tech: [
				"React",
				"TypeScript",
				"FastAPI",
				"PWA",
				"RAG - Langchain",
				"Vector DB",
				"LightGBM",
			],
			liveUrl: "https://solar-helper.tashif.codes/",
			githubUrl: "https://github.com/tashifkhan/SolarHelper",
		},
	];

	const skillCategories = [
		{
			title: "Programming Languages",
			skills: ["Python", "JavaScript", "TypeScript", "Go"],
		},
		{
			title: "Frameworks & Libraries",
			skills: [
				"Next.js",
				"React.js",
				"Node.js",
				"Astro",
				"Express.js",
				"FastAPI",
				"Redux Toolkit",
				"Framer Motion",
			],
		},
		{
			title: "Databases",
			skills: ["MongoDB", "PostgreSQL", "MySQL", "FAISS", "ChromaDB"],
		},
		{
			title: "Tools & Platforms",
			skills: [
				"Git/GitHub",
				"Docker",
				"Vercel",
				"Tailwind CSS",
				"UI/UX Design",
			],
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.3 }}
		>
			<h2
				className="text-2xl font-bold mb-6"
				style={{ color: theme.headingColor || theme.textColor }}
			>
				About Me
			</h2>

			<div
				className="rounded-lg overflow-hidden"
				style={{
					background: theme.cardBackground || theme.windowBackground,
					border: `1px solid ${theme.borderColor}`,
					boxShadow: theme.cardBoxShadow || "0 4px 12px rgba(0,0,0,0.1)",
				}}
			>
				{/* Header Section */}
				<div
					className="p-6 border-b"
					style={{ borderColor: theme.borderColor }}
				>
					<div className="flex flex-col md:flex-row gap-6 items-start">
						{/* Profile Image */}
						<div className="flex-shrink-0">
							<div
								className="w-32 h-32 rounded-lg overflow-hidden"
								style={{
									border: `2px solid ${theme.borderColor}`,
								}}
							>
								<img
									src="/favicon.png"
									alt="Tashif Ahmad Khan"
									className="w-full h-full object-cover"
								/>
							</div>
						</div>

						{/* Basic Info */}
						<div className="flex-1 min-w-0">
							<h1
								className="text-2xl font-bold mb-2"
								style={{ color: theme.accentColor }}
							>
								Tashif Ahmad Khan
							</h1>

							<p
								className="text-lg mb-4"
								style={{ color: theme.mutedTextColor || theme.textColor }}
							>
								Engineering Undergraduate | Tech Enthusiast | Full Stack
								Engineer
							</p>

							<div className="flex flex-wrap gap-3 mb-4">
								<div className="flex items-center gap-2">
									<FaMapMarkerAlt
										size={14}
										style={{ color: theme.accentColor }}
									/>
									<span className="text-sm" style={{ color: theme.textColor }}>
										Delhi, India
									</span>
								</div>
								<div className="flex items-center gap-2">
									<FaEnvelope size={14} style={{ color: theme.accentColor }} />
									<a
										href="mailto:developer@tashif.codes"
										className="text-sm hover:underline"
										style={{ color: theme.accentColor }}
									>
										developer@tashif.codes
									</a>
								</div>
							</div>

							{/* Social Links */}
							<div className="flex flex-wrap gap-3">
								<motion.a
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									href="https://github.com/tashifkhan"
									target="_blank"
									rel="noopener noreferrer"
									style={linkStyle}
								>
									<FaGithub size={16} />
									GitHub
								</motion.a>
								<motion.a
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									href="https://www.linkedin.com/in/tashif-ahmad-khan-982304244/"
									target="_blank"
									rel="noopener noreferrer"
									style={linkStyle}
								>
									<FaLinkedin size={16} />
									LinkedIn
								</motion.a>
								<motion.a
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									href="https://tashif.codes"
									target="_blank"
									rel="noopener noreferrer"
									style={linkStyle}
								>
									<FaGlobe size={16} />
									Portfolio
								</motion.a>
							</div>
						</div>
					</div>
				</div>

				{/* Bio Section */}
				<div className="p-6">
					<div className="prose max-w-none mb-6">
						<p
							className="text-base leading-relaxed mb-4"
							style={{ color: theme.textColor }}
						>
							I'm a full-stack developer and engineering undergraduate who wants
							to simplify his life and others using code. I have built projects
							/ real world solutions using various modern web technologies, AI
							integration.
						</p>

						<p
							className="text-base leading-relaxed mb-4"
							style={{ color: theme.textColor }}
						>
							I have hands-on experience building applications using React,
							Next.js, FastAPI, and various AI technologies including LangChain
							and vector databases. I enjoy working on projects that combine
							cutting-edge technology with practical solutions.
						</p>

						<p
							className="text-base leading-relaxed"
							style={{ color: theme.textColor }}
						>
							I am currently pursuing B.Tech in Electronics & Communication
							Engineering at JIIT Noida.
						</p>
					</div>

					{/* Featured Projects Section */}
					<div className="mb-8">
						<h3
							className="text-xl font-semibold mb-6"
							style={{ color: theme.headingColor || theme.textColor }}
						>
							Featured Projects
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{featuredProjects.map((project, index) => (
								<motion.div
									key={project.title}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 + index * 0.1 }}
									className="p-5 rounded-lg"
									style={{
										background: theme.tagBackground || `${theme.accentColor}05`,
										border: `1px solid ${theme.borderColor}`,
									}}
								>
									<div className="mb-4">
										<h4
											className="text-lg font-semibold mb-2"
											style={{ color: theme.accentColor }}
										>
											{project.title}
										</h4>
										<p
											className="text-sm leading-relaxed mb-3"
											style={{ color: theme.textColor }}
										>
											{project.description}
										</p>
									</div>

									{/* Tech Stack */}
									<div className="mb-4">
										<div className="flex flex-wrap gap-1">
											{project.tech.map((tech) => (
												<span
													key={tech}
													className="text-xs px-2 py-1 rounded"
													style={{
														background: `${theme.accentColor}15`,
														color: theme.textColor,
														border: `1px solid ${theme.borderColor}`,
													}}
												>
													{tech}
												</span>
											))}
										</div>
									</div>

									{/* Links */}
									<div className="flex gap-3">
										<motion.a
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											href={project.liveUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded"
											style={{
												background: theme.accentColor,
												color: theme.windowBackground,
												textDecoration: "none",
											}}
										>
											<FaExternalLinkAlt size={12} />
											Live Demo
										</motion.a>
										<motion.a
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											href={project.githubUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded"
											style={{
												background: "transparent",
												color: theme.accentColor,
												textDecoration: "none",
												border: `1px solid ${theme.accentColor}`,
											}}
										>
											<FaCode size={12} />
											Source
										</motion.a>
									</div>
								</motion.div>
							))}
						</div>
					</div>

					{/* Skills Section */}
					<div>
						<h3
							className="text-xl font-semibold mb-4"
							style={{ color: theme.headingColor || theme.textColor }}
						>
							Technical Skills
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{skillCategories.map((category, index) => (
								<motion.div
									key={category.title}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 + index * 0.1 }}
								>
									<h4
										className="text-sm font-semibold mb-3"
										style={{ color: theme.accentColor }}
									>
										{category.title}
									</h4>
									<div className="flex flex-wrap gap-2">
										{category.skills.map((skill) => (
											<span
												key={skill}
												className="text-xs px-3 py-1 rounded-full"
												style={{
													background:
														theme.tagBackground || `${theme.accentColor}15`,
													color: theme.textColor,
													border: `1px solid ${theme.borderColor}`,
												}}
											>
												{skill}
											</span>
										))}
									</div>
								</motion.div>
							))}
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
