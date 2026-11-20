import React, { memo } from "react";
import { Image, Linking, Pressable, View } from "react-native";
import { Text, radius, space, makeStyles, useTheme } from "@/ui";
import { FileIcon, RetryIcon } from "@/ui/icons";
import type { ChatMessage } from "../chatRuntime";
import { timeOfDay } from "../chatModel";

const statusText = (m: ChatMessage) => {
	if (m.state === "sending") return "Sending…";
	if (m.readAt) return "Read";
	if (m.deliveredAt) return "Delivered";
	return "Sent";
};

/** One message. Own messages on the right in ink; theirs on the left on white. Failed sends offer retry. */
function MessageBubble({
	message: m,
	showStatus,
	onRetry,
	onDiscard,
}: {
	message: ChatMessage;
	/** Delivery state under the latest own message. */
	showStatus: boolean;
	onRetry: (m: ChatMessage) => void;
	onDiscard: (m: ChatMessage) => void;
}) {
	const { color, scheme } = useTheme();
	const styles = useStyles();
	const failed = m.state === "failed";
	const time = timeOfDay(m.sentAt);
	const att = m.attachment;
	let content: React.ReactNode;
	if (m.kind === "deleted") {
		content = (
			<Text variant="ui" color={m.mine ? "ink200" : "ink500"} style={styles.italic}>
				Message deleted
			</Text>
		);
	} else {
		content = (
			<>
				{m.kind === "image" && att?.url ? (
					<Pressable
						accessibilityRole="imagebutton"
						accessibilityLabel={`Photo: ${att.name}. Open`}
						onPress={() => void Linking.openURL(att.url as string)}
					>
						<Image source={{ uri: att.url }} style={styles.image} resizeMode="cover" />
					</Pressable>
				) : null}
				{m.kind === "file" || (m.kind === "image" && !att?.url) ? (
					<Pressable
						accessibilityRole="link"
						accessibilityLabel={att?.url ? `File: ${att.name}. Open` : `File: ${att?.name}, not available`}
						disabled={!att?.url}
						onPress={() => att?.url && void Linking.openURL(att.url)}
						style={styles.file}
					>
						<FileIcon size={20} color={m.mine && scheme === "light" ? color.onInk : color.ink900} />
						<Text variant="uiStrong" numberOfLines={1} style={[styles.flex, m.mine && styles.onInk]}>
							{att?.name ?? "File"}
						</Text>
					</Pressable>
				) : null}
				{m.text ? (
					<Text variant="body" selectable style={m.mine ? styles.onInk : undefined}>
						{m.text}
					</Text>
				) : null}
			</>
		);
	}

	return (
		<View style={[styles.wrap, m.mine ? styles.right : styles.left]}>
			<View
				accessible
				accessibilityLabel={`${m.mine ? "You" : "They"} at ${time}: ${m.kind === "text" ? m.text : m.kind === "deleted" ? "message deleted" : m.kind === "image" ? "photo" : "file"}${failed ? ". Not sent" : ""}`}
				style={[
					styles.bubble,
					m.mine ? styles.mine : styles.theirs,
					failed && styles.failed,
					m.state === "sending" && styles.sending,
				]}
			>
				{content}
				<Text variant="caption" style={[styles.time, m.mine && styles.timeMine]}>
					{time}
				</Text>
			</View>
			{failed ? (
				<View style={styles.failRow}>
					<Text variant="caption" color="red700" style={styles.flexShrink}>
						{m.error ?? "Not sent."}
					</Text>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Retry sending"
						onPress={() => onRetry(m)}
						hitSlop={10}
						style={styles.action}
					>
						<RetryIcon size={16} weight="bold" color={color.ink900} />
						<Text variant="caption" color="ink900">
							Retry
						</Text>
					</Pressable>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Delete this unsent message"
						onPress={() => onDiscard(m)}
						hitSlop={10}
						style={styles.action}
					>
						<Text variant="caption" color="ink600">
							Delete
						</Text>
					</Pressable>
				</View>
			) : showStatus ? (
				<Text variant="caption" style={styles.status}>
					{statusText(m)}
				</Text>
			) : null}
		</View>
	);
}

export default memo(MessageBubble);

// Own bubbles: an ink slab in light; on dark a quiet ink200 grey with light text (as the web), since a near-white
// slab glares on a dark chat.
const useStyles = makeStyles(({ color, scheme }) => ({
	wrap: { maxWidth: "82%", marginVertical: 3 },
	left: { alignSelf: "flex-start" },
	right: { alignSelf: "flex-end", alignItems: "flex-end" },
	bubble: {
		borderRadius: radius.md + 4,
		paddingHorizontal: space[3],
		paddingTop: space[2],
		paddingBottom: 6,
		gap: space[1],
	},
	mine: { backgroundColor: scheme === "dark" ? color.ink200 : color.inkFill, borderBottomRightRadius: 4 },
	theirs: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderBottomLeftRadius: 4 },
	failed: { backgroundColor: color.ink600 },
	sending: { opacity: 0.75 },
	onInk: { color: scheme === "dark" ? color.ink900 : color.onInk },
	italic: { fontStyle: "italic" },
	time: { alignSelf: "flex-end", color: color.ink500, fontSize: 11, lineHeight: 14 },
	timeMine: { color: scheme === "dark" ? color.ink600 : color.ink200 },
	image: { width: 220, height: 220, borderRadius: radius.md, backgroundColor: color.skeleton },
	file: { flexDirection: "row", alignItems: "center", gap: space[2], minHeight: 44 },
	flex: { flex: 1 },
	flexShrink: { flexShrink: 1 },
	failRow: { flexDirection: "row", alignItems: "center", gap: space[3], marginTop: space[1] },
	action: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44 },
	status: { marginTop: 2, marginRight: space[1] },
}));
