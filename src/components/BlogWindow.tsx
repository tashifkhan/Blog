import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowControls } from "./ui/window-controls";
import { BlogSection } from "./sections/blog-section";
import type { Post } from "@/types/post";

interface BlogWindowProps {
	theme?: any;
	windowTitle?: string;
	posts?: Post[];
	setWindowTitle?: (title: string) => void;
	searchQuery?: string;
}

export function BlogWindow({
	theme,
	windowTitle = "Blog - Posts",
	posts = [],
	setWindowTitle,
	searchQuery = "",
}: BlogWindowProps) {
	const [windowState, setWindowState] = useState<
		"normal" | "minimized" | "maximized"
	>("normal");

	// Window control handlers
	const handleClose = () => {
		if (setWindowTitle) setWindowTitle("Blog - Home");
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
		} as React.CSSProperties;

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
			className="w-full"
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
					{windowTitle}
				</span>

				<div className="w-16 flex justify-end">
					{/* Empty div for symmetrical spacing */}
				</div>
			</div>

			<AnimatePresence>
				{windowState !== "minimized" && (
					<motion.div
						className={`p-4 ${theme.name === "neoBrutalism" ? "pt-6" : ""}`}
						variants={contentVariants}
						initial="hidden"
						animate="visible"
						exit="hidden"
					>
						<BlogSection
							theme={theme}
							searchQuery={searchQuery}
							posts={posts}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
