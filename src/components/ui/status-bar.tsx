import React from "react";
import { GithubIcon, TwitterIcon, InstagramIcon } from "lucide-react";

interface StatusBarProps {
	theme: any;
}

export function StatusBar({ theme }: StatusBarProps) {
	return (
		<div
			className="w-full mt-auto"
			style={{
				backgroundColor: theme.statusBarBackground,
				borderTop: `1px solid ${theme.statusBarBorder}`,
			}}
		>
			<div className="container mx-auto flex items-center h-6 px-2">
				<div className="flex items-center space-x-2">
					<GithubIcon size={12} style={{ color: theme.textColor }} />
					<TwitterIcon size={12} style={{ color: theme.textColor }} />
					<InstagramIcon size={12} style={{ color: theme.textColor }} />
				</div>
				<div className="ml-auto text-[10px]" style={{ color: theme.textColor }}>
					© {new Date().getFullYear()} • Blog OS Classic
				</div>
			</div>
		</div>
	);
}
