import React from "react";
import { GithubIcon, TwitterIcon, InstagramIcon } from "lucide-react";

interface StatusBarProps {
	theme: any;
	isMobile?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
	theme,
	isMobile = false,
}) => {
	return (
		<div
			className="w-full px-3 py-1 flex items-center justify-between text-xs"
			style={{
				backgroundColor: theme.statusBarBackground,
				color: theme.statusBarText,
				borderTop: theme.name === "neoBrutalism" ? "2px solid #000" : undefined,
			}}
		>
			<div className={`flex items-center ${isMobile ? "flex-wrap gap-2" : ""}`}>
				<span
					className={`inline-flex items-center ${isMobile ? "mr-2" : "mr-4"}`}
					title="Theme"
				>
					<span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
					Theme: {theme.name}
				</span>
				<span
					className={`inline-flex items-center ${
						isMobile ? "hidden sm:inline-flex" : ""
					}`}
					title="Version"
				>
					<span className="w-2 h-2 rounded-full mr-1 bg-blue-500"></span>
					Version: 1.0.0
				</span>
			</div>

			<div className={`flex items-center ${isMobile ? "text-[10px]" : ""}`}>
				<span className="opacity-75">© {new Date().getFullYear()} Blog OS</span>
			</div>
		</div>
	);
};
