import * as React from "react";
import type { ThemeConfig } from "@/lib/theme-config";
import { FaHeart, FaEye, FaReply, FaPaperPlane } from "react-icons/fa";
import { fetchJSON, recordView } from "@/lib/api";

type CommentNode = {
	id: string;
	name: string;
	text: string;
	date?: string;
	replies?: CommentNode[];
};

type Props = {
	slug: string;
	theme?: ThemeConfig; // injected by Desktop
};

type CommentItemProps = {
	c: CommentNode;
	depth?: number;
	t?: ThemeConfig;
	subtleText: React.CSSProperties;
	buttonStyle: (primary?: boolean) => React.CSSProperties;
	inputStyle: React.CSSProperties;
	openReplies: Record<string, boolean>;
	setOpenReplies: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	replyName: Record<string, string>;
	setReplyName: React.Dispatch<React.SetStateAction<Record<string, string>>>;
	replyText: Record<string, string>;
	setReplyText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
	submitReply: (parentId: string) => Promise<void>;
};

const CommentItem: React.FC<CommentItemProps> = ({
	c,
	depth = 0,
	t,
	subtleText,
	buttonStyle,
	inputStyle,
	openReplies,
	setOpenReplies,
	replyName,
	setReplyName,
	replyText,
	setReplyText,
	submitReply,
}) => {
	const isNeo = t?.name === "neoBrutalism";
	const border = isNeo
		? `2px solid ${t?.borderColor ?? "#000"}`
		: `1px solid ${t?.borderColor ?? "#ddd"}`;
	const marginLeft = Math.min(depth * 14, 56);

	return (
		<div
			style={{
				marginLeft,
				borderLeft: border,
				paddingLeft: 10,
				marginTop: 10,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<strong>{c.name}</strong>
				{c.date && (
					<span style={{ ...subtleText, fontSize: 12 }}>
						{new Date(c.date).toLocaleString()}
					</span>
				)}
			</div>
			<div style={{ whiteSpace: "pre-wrap", margin: "6px 0" }}>{c.text}</div>
			<button
				style={buttonStyle(false)}
				onClick={() => setOpenReplies((s) => ({ ...s, [c.id]: !s[c.id] }))}
			>
				<FaReply /> Reply
			</button>
			{openReplies[c.id] && (
				<div style={{ marginTop: 8 }}>
					<input
						style={inputStyle}
						placeholder="Your name"
						value={replyName[c.id] || ""}
						onChange={(e) =>
							setReplyName((s) => ({ ...s, [c.id]: e.target.value }))
						}
					/>
					<textarea
						style={{ ...inputStyle, marginTop: 6 }}
						placeholder="Your reply"
						value={replyText[c.id] || ""}
						onChange={(e) =>
							setReplyText((s) => ({ ...s, [c.id]: e.target.value }))
						}
					/>
					<div
						style={{
							display: "flex",
							justifyContent: "flex-end",
							marginTop: 6,
						}}
					>
						<button style={buttonStyle(true)} onClick={() => submitReply(c.id)}>
							<FaPaperPlane /> Post Reply
						</button>
					</div>
				</div>
			)}
			{(c.replies || []).map((r) => (
				<CommentItem
					key={r.id}
					c={r}
					depth={depth + 1}
					t={t}
					subtleText={subtleText}
					buttonStyle={buttonStyle}
					inputStyle={inputStyle}
					openReplies={openReplies}
					setOpenReplies={setOpenReplies}
					replyName={replyName}
					setReplyName={setReplyName}
					replyText={replyText}
					setReplyText={setReplyText}
					submitReply={submitReply}
				/>
			))}
		</div>
	);
};

export function EngagementPanel({ slug, theme }: Props) {
	const [views, setViews] = React.useState<number>(0);
	const [likes, setLikes] = React.useState<number>(0);
	const [comments, setComments] = React.useState<CommentNode[]>([]);
	const [name, setName] = React.useState("");
	const [text, setText] = React.useState("");
	const [replyText, setReplyText] = React.useState<Record<string, string>>({});
	const [replyName, setReplyName] = React.useState<Record<string, string>>({});
	const [openReplies, setOpenReplies] = React.useState<Record<string, boolean>>(
		{}
	);

	// Loading states
	const [isLoadingViews, setIsLoadingViews] = React.useState(true);
	const [isLoadingLikes, setIsLoadingLikes] = React.useState(true);
	const [hasLiked, setHasLiked] = React.useState<boolean>(false); // client-side like state
	const likeActionRef = React.useRef<number | null>(null); // debounce timer id
	const intendedLikeRef = React.useRef<boolean>(false); // final state the user asked for

	// Initialize hasLiked from localStorage (per slug) on mount
	React.useEffect(() => {
		try {
			const key = `liked:${slug}`;
			const liked = localStorage.getItem(key) === "1";
			setHasLiked(liked);
			// Keep the debounce ref in sync with the restored state, otherwise the
			// first click would compute the wrong target action.
			intendedLikeRef.current = liked;
		} catch {}
	}, [slug]);

	const t = theme;

	const cardStyle: React.CSSProperties = {
		background: t?.windowBackground || "#fff",
		border: `1px solid ${t?.borderColor ?? "#ddd"}`,
		borderRadius: t?.windowRadius ?? "10px",
		boxShadow: t?.cardBoxShadow ?? "0 6px 16px rgba(0,0,0,0.12)",
		color: t?.textColor || "inherit",
		padding: "1rem",
	};

	const subtleText: React.CSSProperties = { opacity: 0.8 };

	const buttonStyle = (primary = false): React.CSSProperties => ({
		display: "inline-flex",
		alignItems: "center",
		gap: 8,
		padding: "0.5rem 0.75rem",
		borderRadius: 8,
		border: `1px solid ${t?.borderColor ?? "#ccc"}`,
		background: primary ? t?.accentColor ?? "#0088ff" : "transparent",
		color: primary ? t?.windowBackground ?? "#fff" : t?.textColor ?? "#000",
		cursor: "pointer",
		boxShadow: primary ? t?.hoverBoxShadow : undefined,
	});

	const tagStyle: React.CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		padding: "0.25rem 0.5rem",
		borderRadius: 999,
		border: `1px solid ${t?.borderColor ?? "#ddd"}`,
		background: "transparent",
	};

	const inputStyle: React.CSSProperties = {
		width: "100%",
		padding: "0.5rem 0.75rem",
		borderRadius: 8,
		border: `1px solid ${t?.borderColor ?? "#ccc"}`,
		background: t?.windowBackground || "#fff",
		color: t?.textColor || "inherit",
	};

	const dividerStyle: React.CSSProperties = {
		borderTop: `1px solid ${t?.borderColor ?? "#e5e5e5"}`,
		margin: "1rem 0",
	};

	// use fetchJSON from lib/api

	const loadViews = React.useCallback(async () => {
		setIsLoadingViews(true);
		try {
			// Add minimum loading time to make loader visible
			// Deduplicated with PostMetaHeader's call on the same page.
			const [viewCount] = await Promise.all([
				recordView(slug),
				new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms loading
			]);
			setViews(viewCount ?? 0);
		} catch (error) {
			console.error("Error loading views:", error);
		} finally {
			setIsLoadingViews(false);
		}
	}, [slug]);

	const loadLikes = React.useCallback(async () => {
		setIsLoadingLikes(true);
		try {
			// Add minimum loading time to make loader visible
			const [data] = await Promise.all([
				fetchJSON<{ likes: number }>(`/likes/${slug}`),
				new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms loading
			]);
			setLikes(data.likes ?? 0);
		} catch (error) {
			console.error("Error loading likes:", error);
		} finally {
			setIsLoadingLikes(false);
		}
	}, [slug]);

	// Debounced like toggle. Rapid clicks collapse into a single request that
	// matches the final intended state.
	//
	// The intended state is tracked in a ref rather than read from `hasLiked`
	// inside the timeout: that closure captures the value from the render at
	// click time, which is stale once several clicks land within one debounce
	// window.
	const toggleLike = () => {
		const nextLiked = !intendedLikeRef.current;
		intendedLikeRef.current = nextLiked;

		// Optimistic UI
		setHasLiked(nextLiked);
		setLikes((l) => Math.max(0, l + (nextLiked ? 1 : -1)));

		if (likeActionRef.current) {
			window.clearTimeout(likeActionRef.current);
		}
		likeActionRef.current = window.setTimeout(async () => {
			const desired = intendedLikeRef.current;
			try {
				const data = await fetchJSON<{ likes: number }>(`/likes/${slug}`, {
					method: desired ? "POST" : "DELETE",
				});
				setLikes(data.likes ?? 0);
				try {
					localStorage.setItem(`liked:${slug}`, desired ? "1" : "0");
				} catch {}
			} catch {
				// Revert to the server's view of the world on failure.
				intendedLikeRef.current = !desired;
				setHasLiked(!desired);
				try {
					const data = await fetchJSON<{ likes: number }>(`/likes/${slug}`);
					setLikes(data.likes ?? 0);
				} catch {
					setLikes((l) => Math.max(0, l + (desired ? -1 : 1)));
				}
			}
		}, 400); // 400ms debounce window
	};

	const loadComments = React.useCallback(async () => {
		try {
			const data = await fetchJSON<{ comments: CommentNode[] }>(
				`/comments/${slug}`
			);
			setComments(data.comments ?? []);
		} catch {}
	}, [slug]);

	const submitComment = async () => {
		if (!name.trim() || !text.trim()) return;
		await fetchJSON(`/comments/${slug}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: name.trim(), text: text.trim() }),
		});
		setText("");
		await loadComments();
	};

	const submitReply = async (parentId: string) => {
		const rName = (replyName[parentId] || "").trim();
		const rText = (replyText[parentId] || "").trim();
		if (!rName || !rText) return;
		await fetchJSON(`/comments/${slug}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: rName, text: rText, parentId }),
		});
		setReplyText((s) => ({ ...s, [parentId]: "" }));
		await loadComments();
	};

	React.useEffect(() => {
		loadViews();
		loadLikes();
		loadComments();
	}, [loadViews, loadLikes, loadComments]);

	const isNeo = t?.name === "neoBrutalism";

	// Cute loader component
	const CuteLoader = () => (
		<span
			style={{
				display: "inline-block",
				animation: "pulse 1.2s ease-in-out infinite",
				fontSize: "0.9em",
				color: t?.accentColor || "#0088ff",
			}}
		>
			⬢⬢⬢
		</span>
	);

	return (
		<>
			<style>
				{`
					@keyframes pulse {
						0%, 100% { opacity: 0.4; }
						50% { opacity: 1; }
					}
				`}
			</style>
			<section style={cardStyle}>
				{/* Stats Row */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 12,
						flexWrap: "wrap",
					}}
				>
					<span style={tagStyle} title="Views">
						<FaEye color={t?.accentColor} />{" "}
						<span style={subtleText}>
							{isLoadingViews ? <CuteLoader /> : views}
						</span>
					</span>
					<span style={tagStyle} title="Likes">
						<FaHeart color={t?.accentColor} />{" "}
						<span style={subtleText}>
							{isLoadingLikes ? <CuteLoader /> : likes}
						</span>
					</span>
					<button
						style={buttonStyle(true)}
						onClick={toggleLike}
						aria-label={hasLiked ? "Unlike this post" : "Like this post"}
					>
						<FaHeart color={hasLiked ? t?.windowBackground : undefined} />{" "}
						{hasLiked ? "Liked" : "Like"}
					</button>
				</div>

				<div style={dividerStyle} />

				{/* Comments */}
				<h3 style={{ marginBottom: 8, color: t?.accentColor }}>Comments</h3>

				<div>
					{comments.length === 0 && (
						<div
							style={{ ...subtleText, fontStyle: "italic", marginBottom: 8 }}
						>
							Be the first to comment.
						</div>
					)}
					{comments.map((c) => (
						<CommentItem
							key={c.id}
							c={c}
							t={theme}
							subtleText={subtleText}
							buttonStyle={buttonStyle}
							inputStyle={inputStyle}
							openReplies={openReplies}
							setOpenReplies={setOpenReplies}
							replyName={replyName}
							setReplyName={setReplyName}
							replyText={replyText}
							setReplyText={setReplyText}
							submitReply={submitReply}
						/>
					))}
				</div>

				<div style={dividerStyle} />

				{/* New comment form */}
				<div>
					<input
						style={inputStyle}
						placeholder="Your name"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<textarea
						style={{ ...inputStyle, marginTop: 8 }}
						placeholder="Your comment"
						value={text}
						onChange={(e) => setText(e.target.value)}
					/>
					<div
						style={{
							display: "flex",
							justifyContent: "flex-end",
							marginTop: 8,
						}}
					>
						<button style={buttonStyle(true)} onClick={submitComment}>
							<FaPaperPlane /> Post Comment
						</button>
					</div>
				</div>
			</section>
		</>
	);
}

export default EngagementPanel;
