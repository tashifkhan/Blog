import React from "react";

interface UbuntuButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	className?: string;
	variant?: "primary" | "secondary" | "action";
}

export function UbuntuButton({
	children,
	onClick,
	className = "",
	variant = "primary",
}: UbuntuButtonProps) {
	// Ubuntu button color variants
	const colors = {
		primary: {
			background: "linear-gradient(to bottom, #f39c34, #e95420)",
			border: "#c34113",
			hover: "linear-gradient(to bottom, #f39c34, #dd4814)",
			text: "#FFFFFF",
		},
		secondary: {
			background: "linear-gradient(to bottom, #48b3e4, #19a6e2)",
			border: "#007aa6",
			hover: "linear-gradient(to bottom, #48b3e4, #0086c7)",
			text: "#FFFFFF",
		},
		action: {
			background: "linear-gradient(to bottom, #87cf3e, #6fac34)",
			border: "#5a8a2a",
			hover: "linear-gradient(to bottom, #87cf3e, #619a2a)",
			text: "#FFFFFF",
		},
	};

	const colorSet = colors[variant];

	return (
		<button
			onClick={onClick}
			className={`px-4 py-2 font-medium text-sm transition-all rounded ${className}`}
			style={{
				background: colorSet.background,
				border: `1px solid ${colorSet.border}`,
				color: colorSet.text,
				boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
			}}
			onMouseOver={(e) => {
				e.currentTarget.style.background = colorSet.hover;
			}}
			onMouseOut={(e) => {
				e.currentTarget.style.background = colorSet.background;
			}}
		>
			{children}
		</button>
	);
}
