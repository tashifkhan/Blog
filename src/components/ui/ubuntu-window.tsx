import React from "react";
import { Window } from "./window";

interface UbuntuWindowProps {
	title: string;
	theme: any;
	children: React.ReactNode;
	width?: string;
	onClose?: () => void;
}

export function UbuntuWindow({
	title,
	theme,
	children,
	width = "100%",
	onClose,
}: UbuntuWindowProps) {
	// Only apply Ubuntu styling if the theme is actually Ubuntu
	const isUbuntu = theme.name === "ubuntu";

	if (!isUbuntu) {
		return (
			<Window title={title} theme={theme} width={width} onClose={onClose}>
				{children}
			</Window>
		);
	}

	// Ubuntu-specific button styling
	const buttonStyle = {
		width: "14px",
		height: "14px",
		borderRadius: "50%",
		border: "1px solid rgba(0,0,0,0.3)",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		fontSize: "10px",
		color: "#000000",
		fontWeight: "bold" as const,
		marginRight: "6px",
	};

	return (
		<div
			className="rounded-t-lg shadow-lg overflow-hidden"
			style={{
				backgroundColor: theme.windowBackground,
				border: `1px solid ${theme.windowBorder}`,
				borderBottom: `2px solid ${theme.windowBorder}`,
				width,
				maxWidth: "100%",
			}}
		>
			{/* Ubuntu titlebar with gradient */}
			<div
				className="h-8 flex items-center px-2"
				style={{
					background: theme.windowTitlebarBg,
					paddingLeft: "8px",
				}}
			>
				{/* Ubuntu-style window controls - positioned on the LEFT side */}
				<div className="flex items-center space-x-2">
					<div
						className="cursor-pointer flex-center"
						style={{
							...buttonStyle,
							backgroundColor: theme.closeButtonColor,
						}}
						onClick={onClose}
					>
						×
					</div>
					<div
						style={{
							...buttonStyle,
							backgroundColor: theme.minimizeButtonColor,
						}}
					>
						-
					</div>
					<div
						style={{
							...buttonStyle,
							backgroundColor: theme.maximizeButtonColor,
						}}
					>
						+
					</div>
				</div>

				{/* Ubuntu window title - centered */}
				<div
					className="flex-1 text-center text-sm font-medium"
					style={{ color: "#FFFFFF" }}
				>
					{title}
				</div>
			</div>

			{/* Window content area with Ubuntu styling */}
			<div
				className="p-4"
				style={{
					backgroundColor: theme.windowBackground,
					borderTop: `1px solid ${theme.windowBorder}`,
				}}
			>
				{children}
			</div>
		</div>
	);
}
