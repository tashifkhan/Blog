import React from "react";
import { motion } from "framer-motion";

interface WindowControlsProps {
	theme: any;
	onClose: () => void;
	onMinimize: () => void;
	onMaximize: () => void;
}

export function WindowControls({
	theme,
	onClose,
	onMinimize,
	onMaximize,
}: WindowControlsProps) {
	// Determine button stylings based on theme
	const getButtonStyles = () => {
		// For neon/cyberpunk themes
		if (theme.name === "cyberpunk" || theme.name === "neon") {
			return {
				close: {
					background: "#ff3b5b",
					border: "1px solid #ff0f3f",
					boxShadow: "0 0 8px rgba(255, 59, 91, 0.8)",
				},
				minimize: {
					background: "#ffbd2e",
					border: "1px solid #ffac00",
					boxShadow: "0 0 8px rgba(255, 189, 46, 0.8)",
				},
				maximize: {
					background: "#29cc41",
					border: "1px solid #15aa26",
					boxShadow: "0 0 8px rgba(41, 204, 65, 0.8)",
				},
			};
		}

		// For neobrutalism theme
		if (theme.name === "neoBrutalism") {
			return {
				close: {
					background: "#FF5F56",
					border: "2px solid #000",
					boxShadow: "3px 3px 0 #000",
				},
				minimize: {
					background: "#FFBD2E",
					border: "2px solid #000",
					boxShadow: "3px 3px 0 #000",
				},
				maximize: {
					background: "#27C93F",
					border: "2px solid #000",
					boxShadow: "3px 3px 0 #000",
				},
			};
		}

		// Default/minimal theme
		return {
			close: {
				background: "#FF5F56",
				border: "1px solid #E0443E",
			},
			minimize: {
				background: "#FFBD2E",
				border: "1px solid #DEA123",
			},
			maximize: {
				background: "#27C93F",
				border: "1px solid #1AAB29",
			},
		};
	};

	const buttonStyles = getButtonStyles();

	// Special hover effects based on theme
	const getHoverEffect = (type: "close" | "minimize" | "maximize") => {
		if (theme.name === "cyberpunk" || theme.name === "neon") {
			return {
				scale: 1.15,
				boxShadow:
					type === "close"
						? "0 0 12px rgba(255, 59, 91, 0.9)"
						: type === "minimize"
						? "0 0 12px rgba(255, 189, 46, 0.9)"
						: "0 0 12px rgba(41, 204, 65, 0.9)",
			};
		}

		if (theme.name === "neoBrutalism") {
			return {
				scale: 1.1,
				y: -2,
				boxShadow: "4px 4px 0 #000",
			};
		}

		// Default hover effect
		return {
			scale: 1.1,
		};
	};

	return (
		<div className="flex items-center space-x-2">
			{/* Close button */}
			<motion.div
				className="w-3.5 h-3.5 rounded-full cursor-pointer flex items-center justify-center"
				style={buttonStyles.close}
				whileHover={getHoverEffect("close")}
				whileTap={{ scale: 0.9 }}
				onClick={onClose}
				title="Close"
				transition={{ type: "spring", stiffness: 400, damping: 15 }}
			>
				{theme.name === "neoBrutalism" && (
					<span className="text-[8px] font-bold">✕</span>
				)}
			</motion.div>

			{/* Minimize button */}
			<motion.div
				className="w-3.5 h-3.5 rounded-full cursor-pointer flex items-center justify-center"
				style={buttonStyles.minimize}
				whileHover={getHoverEffect("minimize")}
				whileTap={{ scale: 0.9 }}
				onClick={onMinimize}
				title="Minimize"
				transition={{ type: "spring", stiffness: 400, damping: 15 }}
			>
				{theme.name === "neoBrutalism" && (
					<span className="text-[8px] font-bold">−</span>
				)}
			</motion.div>

			{/* Maximize button */}
			<motion.div
				className="w-3.5 h-3.5 rounded-full cursor-pointer flex items-center justify-center"
				style={buttonStyles.maximize}
				whileHover={getHoverEffect("maximize")}
				whileTap={{ scale: 0.9 }}
				onClick={onMaximize}
				title="Maximize"
				transition={{ type: "spring", stiffness: 400, damping: 15 }}
			>
				{theme.name === "neoBrutalism" && (
					<span className="text-[8px] font-bold">+</span>
				)}
			</motion.div>
		</div>
	);
}
