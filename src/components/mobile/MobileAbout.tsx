import React from "react";
import {
	FaGithub,
	FaLinkedin,
	FaGlobe,
	FaEnvelope,
	FaExternalLinkAlt,
	FaCode,
} from "react-icons/fa";

interface MobileAboutProps {
	theme: any;
	getCardStyle: () => React.CSSProperties;
}

export function MobileAbout({ theme, getCardStyle }: MobileAboutProps) {
	return (
		<section className="px-3 py-4">
			<h2 className="text-sm font-semibold mb-3">About the Author</h2>
			<div
				className={`border p-4 ${
					theme.name === "neoBrutalism" ? "rounded-none" : "rounded-lg"
				}`}
				style={getCardStyle()}
			>
				{/* Profile Header */}
				<div className="flex gap-3 mb-4">
					<div className="flex-shrink-0">
						<div
							className="w-16 h-16 rounded-lg overflow-hidden"
							style={{
								border: `1px solid ${theme.borderColor}`,
							}}
						>
							<img
								src="/favicon.png"
								alt="Tashif Ahmad Khan"
								className="w-full h-full object-cover"
							/>
						</div>
					</div>
					<div className="flex-1 min-w-0">
						<h3
							className="text-sm font-bold mb-1"
							style={{ color: theme.accentColor }}
						>
							Tashif Ahmad Khan
						</h3>
						<p
							className="text-xs mb-2"
							style={{ color: theme.mutedTextColor || theme.textColor }}
						>
							Full Stack Engineer | Engineering Undergraduate
						</p>
						<div className="flex items-center gap-1 mb-2">
							<FaEnvelope size={10} style={{ color: theme.accentColor }} />
							<a
								href="mailto:developer@tashif.codes"
								className="text-xs hover:underline"
								style={{ color: theme.accentColor }}
							>
								developer@tashif.codes
							</a>
						</div>
					</div>
				</div>

				{/* Bio */}
				<p
					className="text-xs leading-relaxed mb-3"
					style={{ color: theme.textColor }}
				>
					I'm a full-stack developer who wants to simplify life using code. 
					I build real-world solutions using modern web technologies and AI integration.
				</p>

				{/* Social Links */}
				<div className="flex flex-wrap gap-2 mb-3">
					<a
						href="https://github.com/tashifkhan"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
						style={{
							background: "transparent",
							color: theme.accentColor,
							textDecoration: "none",
							border: `1px solid ${theme.borderColor}`,
						}}
					>
						<FaGithub size={10} />
						GitHub
					</a>
					<a
						href="https://www.linkedin.com/in/tashif-ahmad-khan-982304244/"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
						style={{
							background: "transparent",
							color: theme.accentColor,
							textDecoration: "none",
							border: `1px solid ${theme.borderColor}`,
						}}
					>
						<FaLinkedin size={10} />
						LinkedIn
					</a>
					<a
						href="https://tashif.codes"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
						style={{
							background: "transparent",
							color: theme.accentColor,
							textDecoration: "none",
							border: `1px solid ${theme.borderColor}`,
						}}
					>
						<FaGlobe size={10} />
						Portfolio
					</a>
				</div>

				{/* Featured Projects Preview */}
				<div>
					<h4
						className="text-xs font-semibold mb-2"
						style={{ color: theme.accentColor }}
					>
						Featured Projects
					</h4>
					<div className="space-y-2">
						{[
							{
								title: "TalentSync AI",
								description: "AI-driven platform for resume analysis and talent management",
								liveUrl: "https://talentsync.tashif.codes/",
								githubUrl: "https://github.com/harleenkaur28/AI-Resume-Parser"
							},
							{
								title: "JPortal",
								description: "React PWA for JIIT WebKiosk with 4.5k+ users",
								liveUrl: "https://jportal.tashif.codes/",
								githubUrl: "https://github.com/tashifkhan/jportal"
							}
						].map((project) => (
							<div
								key={project.title}
								className="p-2 rounded"
								style={{
									background: `${theme.accentColor}08`,
									border: `1px solid ${theme.borderColor}`,
								}}
							>
								<div className="flex items-start justify-between mb-1">
									<h5
										className="text-xs font-medium"
										style={{ color: theme.accentColor }}
									>
										{project.title}
									</h5>
									<div className="flex gap-1">
										<a
											href={project.liveUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs"
											style={{ color: theme.accentColor }}
										>
											<FaExternalLinkAlt size={8} />
										</a>
										<a
											href={project.githubUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs"
											style={{ color: theme.accentColor }}
										>
											<FaCode size={8} />
										</a>
									</div>
								</div>
								<p
									className="text-[10px] leading-relaxed"
									style={{ color: theme.textColor }}
								>
									{project.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
