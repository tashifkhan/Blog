import React from "react";
import type { ThemeConfig } from "@/lib/theme-config";
import { fetchJSON } from "@/lib/api";
import {
	FaHeart,
	FaEye,
	FaGithub,
	FaTwitter,
	FaLinkedin,
	FaGlobe,
} from "react-icons/fa";

type Props = {
	slug: string;
	author?: {
		name: string;
		bio?: string;
		socials?:
			| string[]
			| {
					github?: string;
					twitter?: string;
					linkedin?: string;
					website?: string;
			  };
	};
	theme?: ThemeConfig;
};

export function PostMetaHeader({ slug, author, theme }: Props) {
	const [views, setViews] = React.useState<number>(0);
	const [likes, setLikes] = React.useState<number>(0);

	const t = theme;

	const cardStyle: React.CSSProperties = {
		background: t?.windowBackground || "#fff",
		border: `1px solid ${t?.borderColor ?? "#ddd"}`,
		borderRadius: t?.windowRadius ?? "10px",
		boxShadow: t?.cardBoxShadow ?? "0 6px 16px rgba(0,0,0,0.12)",
		color: t?.textColor || "inherit",
		padding: "1rem",
		marginBottom: "1rem",
	};

	const tagStyle: React.CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		padding: "0.25rem 0.5rem",
		borderRadius: 999,
		border: `1px solid ${t?.borderColor ?? "#ddd"}`,
		background: "transparent",
		fontSize: "0.875rem",
	};

	const socialLinkStyle: React.CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		gap: 4,
		padding: "0.25rem 0.5rem",
		borderRadius: 6,
		color: t?.accentColor || "#0088ff",
		textDecoration: "none",
		border: `1px solid ${t?.borderColor ?? "#ddd"}`,
		transition: "all 0.2s ease",
	};

	// use shared fetchJSON

	React.useEffect(() => {
		const loadStats = async () => {
			const [viewsData, likesData] = await Promise.all([
				fetchJSON(`/views/${slug}`),
				fetchJSON(`/likes/${slug}`),
			]);

			if (viewsData) setViews(viewsData.views ?? 0);
			if (likesData) setLikes(likesData.likes ?? 0);
		};

		loadStats();
	}, [slug]);

	const defaultAuthor = {
		name: "Tashif Ahmad Khan",
		socials: [
			"https://www.github.com/tashifkhan",
			"https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
			"https://tashif.codes",
		],
	};

	const authorInfo = author || defaultAuthor;

	// Parse socials from array format to object format
	const parseSocials = (
		socials?:
			| string[]
			| {
					github?: string;
					twitter?: string;
					linkedin?: string;
					website?: string;
			  }
	) => {
		if (!socials) return {};

		if (Array.isArray(socials)) {
			const parsed: {
				github?: string;
				twitter?: string;
				linkedin?: string;
				website?: string;
			} = {};

			socials.forEach((url) => {
				if (url.includes("github.com")) {
					parsed.github = url;
				} else if (url.includes("linkedin.com")) {
					parsed.linkedin = url;
				} else if (url.includes("twitter.com") || url.includes("x.com")) {
					parsed.twitter = url;
				} else {
					// Default to website for other URLs
					parsed.website = url;
				}
			});

			return parsed;
		}

		return socials;
	};

	const socialLinks = parseSocials(authorInfo.socials);

	return (
		<section style={cardStyle}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					flexWrap: "wrap",
					gap: "1rem",
				}}
			>
				{/* Author Info */}
				<div style={{ flex: 1, minWidth: "250px" }}>
					<h3
						style={{
							margin: "0 0 0.5rem 0",
							color: t?.accentColor,
							fontSize: "1.1rem",
						}}
					>
						{authorInfo.name}
					</h3>
					{authorInfo.socials && (
						<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
							{socialLinks.github && (
								<a
									href={socialLinks.github}
									target="_blank"
									rel="noopener noreferrer"
									style={socialLinkStyle}
									title="GitHub"
								>
									<FaGithub size={14} />
									GitHub
								</a>
							)}
							{socialLinks.twitter && (
								<a
									href={socialLinks.twitter}
									target="_blank"
									rel="noopener noreferrer"
									style={socialLinkStyle}
									title="Twitter"
								>
									<FaTwitter size={14} />
									Twitter
								</a>
							)}
							{socialLinks.linkedin && (
								<a
									href={socialLinks.linkedin}
									target="_blank"
									rel="noopener noreferrer"
									style={socialLinkStyle}
									title="LinkedIn"
								>
									<FaLinkedin size={14} />
									LinkedIn
								</a>
							)}
							{socialLinks.website && (
								<a
									href={socialLinks.website}
									target="_blank"
									rel="noopener noreferrer"
									style={socialLinkStyle}
									title="Website"
								>
									<FaGlobe size={14} />
									Website
								</a>
							)}
						</div>
					)}
				</div>

				{/* Stats */}
				<div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
					<span style={tagStyle} title="Views">
						<FaEye color={t?.accentColor} size={14} />
						<span>{views.toLocaleString()}</span>
					</span>
					<span style={tagStyle} title="Likes">
						<FaHeart color={t?.accentColor} size={14} />
						<span>{likes.toLocaleString()}</span>
					</span>
				</div>
			</div>
		</section>
	);
}

export default PostMetaHeader;
