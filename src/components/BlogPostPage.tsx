import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowControls } from "./ui/window-controls";

interface BlogPostPageProps {
	theme?: any;
	title?: string;
	date?: string;
	excerpt?: string;
	tags?: string[];
	children?: React.ReactNode;
	setWindowTitle?: (title: string) => void;
}

export function BlogPostPage({
	theme,
	title = "Blog Post",
	date,
	excerpt,
	tags,
	children,
	setWindowTitle,
}: BlogPostPageProps) {
	const [windowState, setWindowState] = useState<
		"normal" | "minimized" | "maximized"
	>("normal");

	// Window control handlers
	const handleClose = () => {
		window.history.back();
	};

	const handleMinimize = () => {
		setWindowState("minimized");
	};

	const handleMaximize = () => {
		setWindowState(windowState === "maximized" ? "normal" : "maximized");
	};

	// Window animation variants
	const getWindowVariants = () => {
		return {
			minimized: {
				height: "40px",
				opacity: 1,
			},
			normal: {
				height: "auto",
				opacity: 1,
			},
			maximized: {
				height: "auto",
				opacity: 1,
			},
		};
	};

	const contentVariants = {
		hidden: { opacity: 0, height: 0 },
		visible: { opacity: 1, height: "auto" },
	};

	// Get window style based on theme
	const getWindowStyle = () => {
		if (!theme) return {};

		const baseStyle = {
			background: theme.windowBackground,
			border: `${theme.borderWidth || 1}px solid ${theme.borderColor}`,
			borderRadius: theme.windowRadius || "1rem",
			overflow: "hidden",
		};

		if (theme.name === "neoBrutalism") {
			return {
				...baseStyle,
				boxShadow: "8px 8px 0px #000, 0 15px 30px rgba(0,0,0,0.1)",
				border: "2px solid #000",
				borderRadius: "0px",
			};
		}

		if (theme.name === "win95") {
			return {
				...baseStyle,
				boxShadow:
					"inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, 4px 4px 8px rgba(0,0,0,0.2)",
				borderRadius: "0",
			};
		}

		if (theme.name === "modernMacOS") {
			return {
				...baseStyle,
				boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
				borderRadius: "10px",
				border: "1px solid rgba(0,0,0,0.1)",
			};
		}

		if (theme.name === "dark") {
			return {
				...baseStyle,
				boxShadow: "0 15px 35px rgba(0,0,0,0.3), 0 5px 15px rgba(0,0,0,0.2)",
				border: "1px solid rgba(255,255,255,0.1)",
			};
		}

		return {
			...baseStyle,
			boxShadow: "0 12px 28px rgba(0,0,0,0.12), 0 5px 10px rgba(0,0,0,0.08)",
		};
	};

	// Get title bar style based on theme
	const getTitleBarStyle = () => {
		if (!theme) return {};

		const baseStyle = {
			background: theme.titleBarBackground || theme.accentColor,
			borderBottom: `${theme.borderWidth || 1}px solid ${theme.borderColor}`,
		};

		if (theme.name === "neoBrutalism") {
			return {
				...baseStyle,
				background: theme.accentColor || "#ff90e8",
				borderBottom: "2px solid #000",
			};
		}

		if (theme.name === "cyberpunk") {
			return {
				...baseStyle,
				background: "linear-gradient(90deg, #ff00ff, #00ffff)",
				borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
			};
		}

		if (theme.name === "neon") {
			return {
				...baseStyle,
				background: "rgba(20, 20, 40, 0.9)",
				borderBottom: `1px solid ${theme.accentColor}`,
			};
		}

		return baseStyle;
	};

	if (!theme) {
		return <div>Loading...</div>;
	}

	return (
		<motion.div
			className="w-full max-w-4xl mx-auto"
			variants={getWindowVariants()}
			animate={windowState}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 25,
			}}
			style={getWindowStyle()}
		>
			{/* Window Title Bar */}
			<div
				className="p-2 flex items-center justify-between"
				style={getTitleBarStyle()}
			>
				<WindowControls
					theme={theme}
					onClose={handleClose}
					onMinimize={handleMinimize}
					onMaximize={handleMaximize}
				/>

				<span
					className={`flex-grow text-center font-bold ${
						theme.name === "neoBrutalism" ? "text-black" : ""
					}`}
					style={{ color: theme.titleColor }}
				>
					{title}
				</span>

				<div className="w-16 flex justify-end">
					{/* Empty div for symmetrical spacing */}
				</div>
			</div>

			<AnimatePresence>
				{windowState !== "minimized" && (
					<motion.div
						className={`p-6 ${theme.name === "neoBrutalism" ? "pt-8" : ""}`}
						variants={contentVariants}
						initial="hidden"
						animate="visible"
						exit="hidden"
					>
						{/* Article Header */}
						<header className="mb-6">
							<h1
								className={`text-3xl md:text-4xl font-bold mb-3 ${
									theme.name === "neoBrutalism"
										? "uppercase tracking-wider"
										: ""
								}`}
								style={{
									color: theme.accentColor,
									textShadow:
										theme.name === "neon"
											? `0 0 8px ${theme.accentColor}`
											: undefined,
								}}
							>
								{title}
							</h1>

							{date && (
								<p
									className="text-sm mb-2"
									style={{ color: theme.textColor, opacity: 0.7 }}
								>
									{new Date(date).toLocaleDateString()}
								</p>
							)}

							{tags && tags.length > 0 && (
								<div className="flex flex-wrap gap-2 mb-3">
									{tags.map((tag) => (
										<span
											key={tag}
											className={`px-2 py-1 text-xs font-medium ${
												theme.name === "neoBrutalism"
													? "border-2 border-black"
													: "rounded"
											}`}
											style={{
												backgroundColor: theme.accentColor,
												color: theme.windowBackground,
												boxShadow:
													theme.name === "neoBrutalism"
														? "2px 2px 0 #000"
														: undefined,
											}}
										>
											{tag}
										</span>
									))}
								</div>
							)}

							{excerpt && (
								<p
									className="text-base md:text-lg italic mb-4"
									style={{ color: theme.textColor, opacity: 0.8 }}
								>
									{excerpt}
								</p>
							)}
						</header>

						{/* Article Content */}
						<div
							className="prose prose-lg max-w-none"
							style={{ color: theme.textColor }}
						>
							{children}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
