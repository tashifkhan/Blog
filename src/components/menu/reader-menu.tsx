import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
} from "../ui/menubar";

interface ReaderMenuProps {
	theme: any;
}

export function ReaderMenu({ theme }: ReaderMenuProps) {
	const setVar = (name: string, value: string) =>
		document.documentElement.style.setProperty(name, value);

	const getVar = (name: string, fallback: number): number => {
		const v = getComputedStyle(document.documentElement).getPropertyValue(name);
		const n = parseFloat(v);
		return Number.isFinite(n) && n > 0 ? n : fallback;
	};

	const inc = (
		name: string,
		step: number,
		min: number,
		max: number,
		suffix = ""
	) => {
		const cur = getVar(name, min);
		const next = Math.min(max, Math.max(min, +(cur + step).toFixed(2)));
		setVar(name, `${next}${suffix}`);
	};

	const reset = () => {
		setVar("--reader-font-scale", "1");
		setVar("--reader-line-height", "1.7");
		setVar("--reader-content-width", "65");
	};

	return (
		<MenubarMenu>
			<MenubarTrigger
				className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold"
				style={{ color: theme.textColor, backgroundColor: "transparent" }}
				data-theme-hover-bg={theme.menuItemHoverBg}
				data-theme-hover-text={theme.menuItemHoverText}
			>
				Reader
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[220px] rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
					color: theme.textColor,
				}}
			>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => inc("--reader-font-scale", 0.05, 0.85, 1.4)}
				>
					Increase Font Size
				</MenubarItem>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => inc("--reader-font-scale", -0.05, 0.85, 1.4)}
				>
					Decrease Font Size
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => inc("--reader-line-height", 0.1, 1.3, 2.0)}
				>
					Increase Line Height
				</MenubarItem>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => inc("--reader-line-height", -0.1, 1.3, 2.0)}
				>
					Decrease Line Height
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => inc("--reader-content-width", 2, 40, 90)}
				>
					Wider Content
				</MenubarItem>
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={() => inc("--reader-content-width", -2, 40, 90)}
				>
					Narrower Content
				</MenubarItem>
				<MenubarSeparator style={{ backgroundColor: theme.menuBarBorder }} />
				<MenubarItem
					className="rounded-none text-xs font-medium"
					onClick={reset}
				>
					Reset Reader
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
