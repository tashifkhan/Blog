import React, { useState, useEffect } from "react";
import {
	Menubar,
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
} from "./ui/menubar";
import {
	GithubIcon,
	InstagramIcon,
	TwitterIcon,
	Apple,
	MonitorIcon,
} from "lucide-react";
import { activeTheme } from "@/lib/theme-config";
import ThemeSwitcher from "./theme-switcher";

export default function Navbar() {
	const [theme, setTheme] = useState(activeTheme);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [windowTitle, setWindowTitle] = useState("Blog - Home");

	// Update theme when it changes
	useEffect(() => {
		const handleThemeChange = () => {
			setTheme(activeTheme);
		};

		window.addEventListener("themechange", handleThemeChange);
		return () => window.removeEventListener("themechange", handleThemeChange);
	}, []);

	// Update clock
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	// Create dynamic styles based on active theme
	const styles = {
		menuBar: {
			background: theme.menuBarBackground,
			borderBottom: `1px solid ${theme.menuBarBorder}`,
			fontFamily: theme.fontFamily,
		},
		menuTrigger: {
			color: theme.textColor,
			"&:hover": {
				backgroundColor: theme.menuItemHoverBg,
				color: theme.menuItemHoverText,
			},
		},
		windowChrome: {
			background: theme.windowTitlebarBg,
			borderBottom: `1px solid ${theme.windowBorder}`,
		},
		window: {
			background: theme.windowBackground,
			border: `1px solid ${theme.windowBorder}`,
		},
		statusBar: {
			background: theme.statusBarBackground,
			borderTop: `1px solid ${theme.statusBarBorder}`,
		},
	};

	return (
		<div
			className="w-full flex flex-col items-center min-h-screen"
			style={{
				background: theme.backgroundColor,
				color: theme.textColor,
				fontFamily: theme.fontFamily,
			}}
		>
			{/* Top Mac-style menubar */}
			<div
				className="w-full shadow-sm sticky top-0 z-50"
				style={styles.menuBar}
			>
				<div className="container mx-auto flex items-center h-6">
					<div className="flex items-center mr-4">
						<Apple size={16} className="text-black" />
					</div>
					<Menubar className="border-none bg-transparent h-6 p-0 flex space-x-0">
						<MenubarMenu>
							<MenubarTrigger
								className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold hover:text-white focus:text-white data-[state=open]:text-white"
								style={{
									color: theme.textColor,
									backgroundColor: "transparent",
								}}
								data-theme-hover-bg={theme.menuItemHoverBg}
								data-theme-hover-text={theme.menuItemHoverText}
							>
								File
							</MenubarTrigger>
							<MenubarContent
								className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
								style={{
									backgroundColor: theme.menuBarBackground,
									border: `1px solid ${theme.menuBarBorder}`,
								}}
							>
								<MenubarItem className="rounded-none text-xs font-medium">
									New Post
									<MenubarShortcut>⌘N</MenubarShortcut>
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									Open Recent
								</MenubarItem>
								<MenubarSeparator
									style={{ backgroundColor: theme.menuBarBorder }}
								/>
								<MenubarItem className="rounded-none text-xs font-medium">
									Save
									<MenubarShortcut>⌘S</MenubarShortcut>
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									Save As...
									<MenubarShortcut>⇧⌘S</MenubarShortcut>
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger
								className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold hover:bg-[#0058AE] hover:text-white focus:bg-[#0058AE] focus:text-white data-[state=open]:bg-[#0058AE] data-[state=open]:text-white"
								style={{
									":hover": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									":focus": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									"&[data-state=open]": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
								}}
							>
								Edit
							</MenubarTrigger>
							<MenubarContent
								className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
								style={{
									backgroundColor: theme.menuBarBackground,
									border: `1px solid ${theme.menuBarBorder}`,
								}}
							>
								<MenubarItem className="rounded-none text-xs font-medium">
									Undo
									<MenubarShortcut>⌘Z</MenubarShortcut>
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									Redo
									<MenubarShortcut>⇧⌘Z</MenubarShortcut>
								</MenubarItem>
								<MenubarSeparator
									style={{ backgroundColor: theme.menuBarBorder }}
								/>
								<MenubarItem className="rounded-none text-xs font-medium">
									Cut
									<MenubarShortcut>⌘X</MenubarShortcut>
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									Copy
									<MenubarShortcut>⌘C</MenubarShortcut>
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									Paste
									<MenubarShortcut>⌘V</MenubarShortcut>
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger
								className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold hover:bg-[#0058AE] hover:text-white focus:bg-[#0058AE] focus:text-white data-[state=open]:bg-[#0058AE] data-[state=open]:text-white"
								style={{
									":hover": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									":focus": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									"&[data-state=open]": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
								}}
							>
								View
							</MenubarTrigger>
							<MenubarContent
								className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
								style={{
									backgroundColor: theme.menuBarBackground,
									border: `1px solid ${theme.menuBarBorder}`,
								}}
							>
								<MenubarItem className="rounded-none text-xs font-medium">
									Zoom In
									<MenubarShortcut>⌘+</MenubarShortcut>
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									Zoom Out
									<MenubarShortcut>⌘-</MenubarShortcut>
								</MenubarItem>
								<MenubarSeparator
									style={{ backgroundColor: theme.menuBarBorder }}
								/>
								<MenubarItem className="rounded-none text-xs font-medium">
									Toggle Sidebar
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger
								className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold hover:bg-[#0058AE] hover:text-white focus:bg-[#0058AE] focus:text-white data-[state=open]:bg-[#0058AE] data-[state=open]:text-white"
								style={{
									":hover": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									":focus": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									"&[data-state=open]": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
								}}
							>
								Navigate
							</MenubarTrigger>
							<MenubarContent
								className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
								style={{
									backgroundColor: theme.menuBarBackground,
									border: `1px solid ${theme.menuBarBorder}`,
								}}
							>
								<MenubarItem className="rounded-none text-xs font-medium">
									Blog
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									Projects
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									About
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									Contact
								</MenubarItem>
								<MenubarSeparator
									style={{ backgroundColor: theme.menuBarBorder }}
								/>
								<MenubarSub>
									<MenubarSubTrigger className="rounded-none text-xs font-medium">
										More Pages
									</MenubarSubTrigger>
									<MenubarSubContent
										className="rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
										style={{
											backgroundColor: theme.menuBarBackground,
											border: `1px solid ${theme.menuBarBorder}`,
										}}
									>
										<MenubarItem className="rounded-none text-xs font-medium">
											Archive
										</MenubarItem>
										<MenubarItem className="rounded-none text-xs font-medium">
											Tags
										</MenubarItem>
										<MenubarItem className="rounded-none text-xs font-medium">
											Categories
										</MenubarItem>
									</MenubarSubContent>
								</MenubarSub>
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger
								className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold hover:bg-[#0058AE] hover:text-white focus:bg-[#0058AE] focus:text-white data-[state=open]:bg-[#0058AE] data-[state=open]:text-white"
								style={{
									":hover": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									":focus": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									"&[data-state=open]": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
								}}
							>
								Appearance
							</MenubarTrigger>
							<MenubarContent
								className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
								style={{
									backgroundColor: theme.menuBarBackground,
									border: `1px solid ${theme.menuBarBorder}`,
								}}
							>
								<ThemeSwitcher />
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger
								className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold hover:bg-[#0058AE] hover:text-white focus:bg-[#0058AE] focus:text-white data-[state=open]:bg-[#0058AE] data-[state=open]:text-white"
								style={{
									":hover": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									":focus": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
									"&[data-state=open]": {
										backgroundColor: theme.menuItemHoverBg,
										color: theme.menuItemHoverText,
									},
								}}
							>
								Help
							</MenubarTrigger>
							<MenubarContent
								className="min-w-[180px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
								style={{
									backgroundColor: theme.menuBarBackground,
									border: `1px solid ${theme.menuBarBorder}`,
								}}
							>
								<MenubarItem className="rounded-none text-xs font-medium">
									Documentation
								</MenubarItem>
								<MenubarItem className="rounded-none text-xs font-medium">
									About This Blog
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>
					</Menubar>

					<div className="ml-auto flex items-center space-x-2 mr-2">
						<div className="text-[10px]" style={{ color: theme.textColor }}>
							{currentTime.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Main window content area */}
			<div
				className="container mx-auto my-8 rounded-md shadow-[2px_2px_10px_rgba(0,0,0,0.2)]"
				style={{
					backgroundColor: theme.windowBackground,
					border: `1px solid ${theme.windowBorder}`,
				}}
			>
				<div
					className="h-6 flex items-center px-2"
					style={{
						background: theme.windowTitlebarBg,
						borderBottom: `1px solid ${theme.windowBorder}`,
					}}
				>
					<div className="flex space-x-1">
						<div
							className="w-3 h-3 rounded-full border"
							style={{
								backgroundColor: theme.closeButtonColor,
								borderColor: "rgba(0,0,0,0.2)",
							}}
						></div>
						<div
							className="w-3 h-3 rounded-full border"
							style={{
								backgroundColor: theme.minimizeButtonColor,
								borderColor: "rgba(0,0,0,0.2)",
							}}
						></div>
						<div
							className="w-3 h-3 rounded-full border"
							style={{
								backgroundColor: theme.maximizeButtonColor,
								borderColor: "rgba(0,0,0,0.2)",
							}}
						></div>
					</div>
					<div
						className="flex-1 text-center text-xs font-bold"
						style={{ color: theme.textColor }}
					>
						{windowTitle}
					</div>
				</div>

				<div className="p-6">
					<div
						className="text-4xl font-bold mb-8 text-center py-6 px-4 shadow-inner"
						style={{
							backgroundColor: `${theme.backgroundColor}20`,
							border: `2px solid ${theme.borderColor}`,
							borderRadius: "4px",
							color: theme.textColor,
						}}
					>
						Welcome to My Retro Blog
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{["Blog", "Projects", "About"].map((item) => (
							<a
								key={item}
								href={`/${item.toLowerCase()}`}
								className="block p-4 hover:bg-opacity-80 transition-colors shadow-sm"
								style={{
									backgroundColor: `${theme.backgroundColor}50`,
									border: `1px solid ${theme.borderColor}`,
									borderRadius: "4px",
									color: theme.textColor,
								}}
								onClick={(e) => {
									e.preventDefault();
									setWindowTitle(`Blog - ${item}`);
								}}
							>
								<h2 className="text-xl font-bold mb-2">{item}</h2>
								<p className="text-sm">
									{item === "Blog" && "Read my latest thoughts and articles"}
									{item === "Projects" && "Browse my latest work and creations"}
									{item === "About" && "Learn more about me and my background"}
								</p>
							</a>
						))}
					</div>
				</div>
			</div>

			{/* Status bar */}
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
					<div
						className="ml-auto text-[10px]"
						style={{ color: theme.textColor }}
					>
						© {new Date().getFullYear()} • Blog OS Classic
					</div>
				</div>
			</div>
		</div>
	);
}
