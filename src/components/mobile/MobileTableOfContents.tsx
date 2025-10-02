import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { Menu, X, ChevronRight } from "lucide-react";

interface Heading {
	id: string;
	level: number;
	text: string;
	element: HTMLElement;
}

interface MobileTableOfContentsProps {
	theme: any;
}

export interface MobileTableOfContentsRef {
	open: () => void;
	close: () => void;
}

export const MobileTableOfContents = forwardRef<
	MobileTableOfContentsRef,
	MobileTableOfContentsProps
>(({ theme }, ref) => {
	const [headings, setHeadings] = useState<Heading[]>([]);
	const [activeHeading, setActiveHeading] = useState<string>("");
	const [isOpen, setIsOpen] = useState(false);

	// Expose methods to parent
	useImperativeHandle(ref, () => ({
		open: () => setIsOpen(true),
		close: () => setIsOpen(false),
	}));

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

		// Re-extract when content changes
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
			const scrollPosition = window.scrollY + 100;

			for (let i = headings.length - 1; i >= 0; i--) {
				const heading = headings[i];
				if (heading.element.offsetTop <= scrollPosition) {
					setActiveHeading(heading.id);
					break;
				}
			}
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll();

		return () => window.removeEventListener("scroll", handleScroll);
	}, [headings]);

	const scrollToHeading = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
			setIsOpen(false); // Close the menu after navigation
		}
	};

	const getIndentLevel = (level: number) => {
		return Math.max(0, (level - 1) * 16); // 16px per level for mobile
	};

	// Don't show the button if there are no headings or very few headings
	if (headings.length <= 1) {
		return null;
	}

	return (
		<>
			{/* Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-50"
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* Table of Contents Panel */}
			<div
				className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				} shadow-2xl`}
				style={{
					backgroundColor: theme.windowBackground,
					borderLeft: `1px solid ${theme.borderColor}`,
				}}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between p-4 border-b"
					style={{ borderColor: theme.borderColor }}
				>
					<h3
						className="text-lg font-semibold"
						style={{ color: theme.textColor }}
					>
						Table of Contents
					</h3>
					<button
						onClick={() => setIsOpen(false)}
						className="p-2 rounded-full hover:bg-opacity-10 transition-colors"
						style={{ color: theme.textColor }}
						aria-label="Close table of contents"
					>
						<X size={20} />
					</button>
				</div>

				{/* Contents List */}
				<div className="overflow-y-auto h-full pb-20">
					{headings.map((heading) => (
						<button
							key={heading.id}
							className={`w-full text-left px-4 py-3 transition-all duration-150 flex items-center gap-2 ${
								activeHeading === heading.id ? "font-semibold" : ""
							}`}
							style={{
								paddingLeft: `${16 + getIndentLevel(heading.level)}px`,
								backgroundColor:
									activeHeading === heading.id
										? theme.menuItemHoverBg
										: "transparent",
								color:
									activeHeading === heading.id
										? theme.menuItemHoverText
										: theme.textColor,
								borderLeft:
									activeHeading === heading.id
										? `3px solid ${theme.accentColor}`
										: "3px solid transparent",
							}}
							onClick={() => scrollToHeading(heading.id)}
						>
							<span className="flex-1 text-sm leading-relaxed">
								{heading.text}
							</span>
							{activeHeading === heading.id && (
								<ChevronRight
									size={16}
									className="flex-shrink-0"
									style={{ color: theme.accentColor }}
								/>
							)}
						</button>
					))}
				</div>
			</div>
		</>
	);
});

MobileTableOfContents.displayName = "MobileTableOfContents";
