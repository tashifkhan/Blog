import React from "react";
import { motion } from "framer-motion";

interface AboutSectionProps {
	theme: any;
}

export function AboutSection({ theme }: AboutSectionProps) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: 0.3 }}
		>
			<h2
				className="text-2xl font-bold mb-4"
				style={{ color: theme.headingColor || theme.textColor }}
			>
				About Me
			</h2>

			<div
				className="p-4 rounded-md"
				style={{
					background: theme.cardBackground || theme.windowBackground,
					border: `${theme.borderWidth}px solid ${theme.borderColor}`,
				}}
			>
				<div className="flex flex-col md:flex-row gap-6">
					{/* Profile section */}
					<div className="md:w-1/3">
						<div
							className="w-full aspect-square rounded-md overflow-hidden mb-4"
							style={{
								border: `${theme.borderWidth}px solid ${theme.borderColor}`,
							}}
						>
							{/* Placeholder for profile image */}
							<div
								className="w-full h-full flex items-center justify-center text-4xl"
								style={{
									background: theme.accentColor,
									color: theme.titleColor,
								}}
							>
								👤
							</div>
						</div>

						<div className="space-y-2">
							<h3
								className="text-xl font-bold"
								style={{ color: theme.accentColor }}
							>
								Tashif Ahmad Khan
							</h3>

							<p
								className="text-sm"
								style={{ color: theme.mutedTextColor || theme.textColor }}
							>
								Pre Final Year Student, Full-stack Developer & App Developer
							</p>

							<div className="flex gap-2">
								{["GitHub", "Twitter", "LinkedIn"].map((platform) => (
									<motion.span
										key={platform}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										className="text-xs px-2 py-1 cursor-pointer rounded"
										style={{
											background: theme.tagBackground || theme.accentColor,
											color: theme.tagTextColor || theme.windowBackground,
										}}
									>
										{platform}
									</motion.span>
								))}
							</div>
						</div>
					</div>

					{/* Biography section */}
					<div className="md:w-2/3 space-y-4">
						<p style={{ color: theme.textColor }}>
							I'm a passionate developer focused on creating interesting user
							interfaces and experiences. My work combines technical expertise
							with creative design to produce applications that are both
							functional and visually engaging.
						</p>

						<p style={{ color: theme.textColor }}>
							With experience in React, Next.js, and various design systems, I
							enjoy bringing unique visual styles like neobrutalism and
							cyberpunk aesthetics into modern web applications.
						</p>

						<div>
							<h4
								className="text-lg font-semibold mb-2"
								style={{ color: theme.headingColor || theme.textColor }}
							>
								Skills
							</h4>

							<div className="flex flex-wrap gap-2">
								{[
									"React",
									"TypeScript",
									"Next.js",
									"TailwindCSS",
									"Framer Motion",
									"UI/UX Design",
									"Node.js",
									"Express",
								].map((skill) => (
									<span
										key={skill}
										className="text-xs px-2 py-1 cursor-pointer rounded"
										style={{
											background: theme.tagBackground || theme.accentColor,
											color: theme.tagTextColor || theme.windowBackground,
										}}
									>
										{skill}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
