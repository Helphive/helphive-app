import React, { memo } from "react";
import { Pressable, View } from "react-native";
import { Avatar, Count, Text, space, makeStyles } from "@/ui";
import { formatDate } from "@/lib/format";
import type { Presence } from "../chatRuntime";
import { listTime } from "../chatModel";
import type { ConversationItem } from "../useConversations";

/** Avatar with a green dot when the person is online (friends-only presence). */
export function PersonAvatar({
	name,
	uri,
	presence,
	size = 40,
}: {
	name: string;
	uri?: string;
	presence?: Presence;
	size?: number;
}) {
	const styles = useStyles();
	const [first, ...rest] = name.split(" ");
	return (
		<View>
			<Avatar uri={uri} firstName={first} lastName={rest.join(" ")} size={size} />
			{presence?.online ? <View style={styles.online} accessibilityLabel="Online" /> : null}
		</View>
	);
}

function ConversationRow({
	item,
	presence,
	typing,
	first,
	onPress,
}: {
	item: ConversationItem;
	presence?: Presence;
	typing: boolean;
	first: boolean;
	onPress: () => void;
}) {
	const styles = useStyles();
	const unread = item.unread > 0;
	const status = item.blocked
		? "Blocked"
		: item.open === false
			? "Chat closed"
			: item.until
				? `Chat closes on ${formatDate(item.until)}`
				: "";
	const last = typing ? "Typing…" : item.lastText || (item.open ? "No messages yet" : "");
	const unreadLabel = unread ? `, ${item.unread} unread` : "";
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${item.name}${unreadLabel}. ${last}${status ? `. ${status}` : ""}`}
			onPress={onPress}
			style={({ pressed }) => [styles.row, !first && styles.line, pressed && styles.pressed]}
		>
			<PersonAvatar name={item.name} uri={item.avatar} presence={presence} />
			<View style={styles.text}>
				<Text variant="uiStrong" weight={unread ? "bold" : "semibold"} numberOfLines={1}>
					{item.name}
				</Text>
				{last ? (
					<Text variant="small" color={unread ? "ink900" : "ink600"} numberOfLines={1}>
						{last}
					</Text>
				) : null}
				{status ? (
					<Text variant="caption" numberOfLines={1}>
						{status}
					</Text>
				) : null}
			</View>
			<View style={styles.meta}>
				<Text variant="caption" color={unread ? "coral600" : "ink500"}>
					{listTime(item.lastAt)}
				</Text>
				{unread ? <Count value={item.unread > 99 ? "99+" : item.unread} tone="coral" /> : null}
			</View>
		</Pressable>
	);
}

export default memo(ConversationRow);

const useStyles = makeStyles(({ color, pressedControl }) => ({
	row: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: space[3],
		paddingHorizontal: space[4],
		paddingVertical: space[3],
		minHeight: 64,
	},
	line: { borderTopWidth: 1, borderTopColor: color.line },
	pressed: { backgroundColor: pressedControl },
	text: { flex: 1, minWidth: 0, gap: 2 },
	meta: { alignItems: "flex-end", gap: 6 },
	online: {
		position: "absolute",
		right: 0,
		bottom: 0,
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: color.green500,
		borderWidth: 2,
		borderColor: color.surface,
	},
}));
