import { useEffect, useState } from "react";
import {
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
} from "../ui/menubar";

interface Heading {
	id: string;
	level: number;
	text: string;
	element: HTMLElement;
}

interface TableOfContentsMenuProps {
	theme: any;
}

export function TableOfContentsMenu({ theme }: TableOfContentsMenuProps) {
	const [headings, setHeadings] = useState<Heading[]>([]);
	const [activeHeading, setActiveHeading] = useState<string>("");

	useEffect(() => {
		// Extract headings from the current page
		const extractHeadings = () => {
			const headingElements = document.querySelectorAll(
				"h1, h2, h3, h4, h5, h6"
			);
			const headingsList: Heading[] = [];

			headingElements.forEach((heading, index) => {
				const element = heading as HTMLElement;
				let id = element.id;

				// Generate ID if not present
				if (!id) {
					id = `heading-${index}-${
						element.textContent
							?.toLowerCase()
							.replace(/[^a-z0-9]+/g, "-")
							.replace(/(^-|-$)/g, "") || "untitled"
					}`;
					element.id = id;
				}

				headingsList.push({
					id,
					level: parseInt(element.tagName.substring(1)),
					text: element.textContent || "",
					element,
				});
			});

			setHeadings(headingsList);
		};

		// Initial extraction
		extractHeadings();

		// Re-extract when content changes (useful for dynamic content)
		const observer = new MutationObserver(() => {
			extractHeadings();
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		// Track active heading based on scroll position
		const handleScroll = () => {
			const scrollPosition = window.scrollY + 100; // Offset for better UX

			for (let i = headings.length - 1; i >= 0; i--) {
				const heading = headings[i];
				if (heading.element.offsetTop <= scrollPosition) {
					setActiveHeading(heading.id);
					break;
				}
			}
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll(); // Initial call

		return () => window.removeEventListener("scroll", handleScroll);
	}, [headings]);

	const scrollToHeading = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	};

	const getIndentLevel = (level: number) => {
		// Create indentation based on heading level
		return Math.max(0, (level - 1) * 12); // 12px per level
	};

	if (headings.length <= 1) {
		return null; // Don't render if no meaningful headings found
	}

	return (
		<MenubarMenu>
			<MenubarTrigger
				className="rounded-none border-none h-6 px-3 py-0 text-xs font-bold"
				style={{ color: theme.textColor, backgroundColor: "transparent" }}
				data-theme-hover-bg={theme.menuItemHoverBg}
				data-theme-hover-text={theme.menuItemHoverText}
			>
				Contents
			</MenubarTrigger>
			<MenubarContent
				className="min-w-[240px] max-h-96 overflow-y-auto rounded-none shadow-[2px_2px_5px_rgba(0,0,0,0.3)]"
				style={{
					backgroundColor: theme.menuBarBackground,
					border: `1px solid ${theme.menuBarBorder}`,
					color: theme.textColor,
				}}
			>
				{headings.map((heading) => {
					const indent = getIndentLevel(heading.level);
					return (
						<MenubarItem
							key={heading.id}
							className={`rounded-none text-xs font-medium leading-snug pr-4 py-1.5 cursor-pointer transition-colors ${
								activeHeading === heading.id ? "font-semibold" : ""
							}`}
							style={{
								backgroundColor:
									activeHeading === heading.id
										? theme.menuItemHoverBg
										: "transparent",
								color:
									activeHeading === heading.id
										? theme.menuItemHoverText
										: theme.textColor,
							}}
							onClick={() => scrollToHeading(heading.id)}
						>
							<span
								className="block truncate"
								style={{ paddingLeft: 12 + indent }}
								title={heading.text}
							>
								{heading.text}
							</span>
						</MenubarItem>
					);
				})}
			</MenubarContent>
		</MenubarMenu>
	);
}
