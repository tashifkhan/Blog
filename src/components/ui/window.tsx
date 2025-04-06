import React from "react";
import { UbuntuWindow } from "./ubuntu-window";

interface WindowProps {
	title: string;
	theme: any;
	children: React.ReactNode;
	width?: string;
	onClose?: () => void;
}

export function Window({
	title,
	theme,
	children,
	width = "100%",
	onClose,
}: WindowProps) {
	// Special styling for different themes
	const isNeoBrutalism = theme.name === "neoBrutalism";
	const isUbuntu = theme.name === "ubuntu";

	// Use Ubuntu-specific styling
	if (isUbuntu) {
		return (
			<UbuntuWindow title={title} theme={theme} width={width} onClose={onClose}>
				{children}
			</UbuntuWindow>
		);
	}

	const windowStyles = {
		backgroundColor: theme.windowBackground,
		border: isNeoBrutalism
			? `3px solid ${theme.windowBorder}`
			: `1px solid ${theme.windowBorder}`,
		width,
		maxWidth: "100%",
		boxShadow: isNeoBrutalism
			? "5px 5px 0px #000000"
			: "2px 2px 10px rgba(0,0,0,0.2)",
		transform: isNeoBrutalism ? "rotate(-1deg)" : "none",
	};

	const titlebarStyles = {
		background: theme.windowTitlebarBg,
		borderBottom: isNeoBrutalism
			? `3px solid ${theme.windowBorder}`
			: `1px solid ${theme.windowBorder}`,
		padding: isNeoBrutalism ? "4px 8px" : "0px 2px",
		height: isNeoBrutalism ? "auto" : "1.5rem",
	};

	// Create button styles with neobrutalism-specific changes
	const buttonBaseStyle = isNeoBrutalism
		? {
				width: "16px",
				height: "16px",
				border: "2px solid #000000",
				borderRadius: "0",
		  }
		: {
				width: "12px",
				height: "12px",
				border: "1px solid rgba(0,0,0,0.2)",
				borderRadius: "50%",
		  };

	return (
		<div
			className={`rounded-${
				isNeoBrutalism ? "none" : "md"
			} shadow-[2px_2px_10px_rgba(0,0,0,0.2)]`}
			style={windowStyles}
		>
			<div className="flex items-center px-2" style={titlebarStyles}>
				<div className="flex space-x-1">
					<div
						className={`cursor-pointer`}
						style={{
							...buttonBaseStyle,
							backgroundColor: theme.closeButtonColor,
						}}
						onClick={onClose}
					></div>
					<div
						style={{
							...buttonBaseStyle,
							backgroundColor: theme.minimizeButtonColor,
						}}
					></div>
					<div
						style={{
							...buttonBaseStyle,
							backgroundColor: theme.maximizeButtonColor,
						}}
					></div>
				</div>
				<div
					className={`flex-1 text-center ${
						isNeoBrutalism ? "text-sm font-black" : "text-xs font-bold"
					}`}
					style={{ color: theme.textColor }}
				>
					{title.toUpperCase()}
				</div>
			</div>

			<div className={isNeoBrutalism ? "p-4 border-t-0" : "p-6"}>
				{children}
			</div>
		</div>
	);
}
