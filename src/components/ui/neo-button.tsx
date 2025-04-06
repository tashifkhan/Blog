import React from "react";

interface NeoButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	className?: string;
	color?: string;
	textColor?: string;
}

export function NeoButton({
	children,
	onClick,
	className = "",
	color = "#4DEEEA",
	textColor = "#000000",
}: NeoButtonProps) {
	return (
		<button
			onClick={onClick}
			className={`px-4 py-2 font-bold relative transition-all hover:translate-x-0 hover:translate-y-0 
                 hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none ${className}`}
			style={{
				backgroundColor: color,
				color: textColor,
				border: "3px solid #000000",
				boxShadow: "4px 4px 0px #000000",
				transform: "translateX(-2px) translateY(-2px)",
			}}
		>
			{children}
		</button>
	);
}
