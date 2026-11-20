import React, { memo } from "react";
import { Pressable, View } from "react-native";
import { IconButton, Text, useToneStyle, radius, space, type Tone, makeStyles, useTheme } from "@/ui";
import {
	BookingsIcon,
	CheckMarkIcon,
	CloseIcon,
	DeleteIcon,
	ErrorIcon,
	NotificationsIcon,
	PaymentIcon,
	PayoutIcon,
	RetryIcon,
	SuccessIcon,
	TimeIcon,
	VerifiedIcon,
	type AppIcon,
} from "@/ui/icons";
import { formatTimeAgo } from "@/lib/format";
import type { AppNotification, NotificationType } from "../api";

// Tones follow the status pills (as the web): green done, blue in motion, amber needs action, red stopped.
const META: Record<NotificationType, { tone: Tone; icon: AppIcon }> = {
	booking_created: { tone: "amber", icon: BookingsIcon },
	booking_accepted: { tone: "blue", icon: CheckMarkIcon },
	booking_start_requested: { tone: "amber", icon: TimeIcon },
	booking_started: { tone: "blue", icon: TimeIcon },
	booking_completed: { tone: "green", icon: SuccessIcon },
	booking_cancelled: { tone: "red", icon: CloseIcon },
	booking_expired: { tone: "grey", icon: BookingsIcon },
	payment_succeeded: { tone: "green", icon: PaymentIcon },
	payment_refunded: { tone: "blue", icon: RetryIcon },
	payout_paid: { tone: "green", icon: PayoutIcon },
	account_approved: { tone: "green", icon: VerifiedIcon },
	account_rejected: { tone: "red", icon: ErrorIcon },
	general: { tone: "grey", icon: NotificationsIcon },
};

const metaOf = (type?: string) => META[type as NotificationType] ?? META.general;

/** A notification row: type icon, title, message, time, unread dot, delete. Unread rows are tinted and bold. */
function NotificationCard({
	notification: n,
	first,
	last,
	onOpen,
	onDelete,
}: {
	notification: AppNotification;
	first: boolean;
	last: boolean;
	onOpen: (n: AppNotification) => void;
	onDelete: (n: AppNotification) => void;
}) {
	const { color } = useTheme();
	const styles = useStyles();
	const meta = metaOf(n.type);
	const tone = useToneStyle(meta.tone);
	const Icon = meta.icon;
	const unread = !n.read;
	const time = formatTimeAgo(n.createdAt);
	return (
		<View
			style={[
				styles.frame,
				unread && styles.unread,
				first && styles.first,
				last && styles.last,
				!first && styles.line,
			]}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${unread ? "Unread: " : ""}${n.title}. ${n.message}. ${time}`}
				onPress={() => onOpen(n)}
				style={({ pressed }) => [styles.row, pressed && styles.pressed]}
			>
				<View style={[styles.icon, { backgroundColor: tone.bg }]}>
					<Icon size={18} color={tone.fg} />
				</View>
				<View style={styles.text}>
					<Text variant="uiStrong" weight={unread ? "bold" : "semibold"}>
						{n.title}
					</Text>
					<Text variant="small" numberOfLines={2}>
						{n.message}
					</Text>
					<Text variant="caption">{time}</Text>
				</View>
			</Pressable>
			{/* Trailing cluster: dot and delete share one centre line, the title's first line. The dot slot is always
			    reserved, so the delete button sits in the same place on read and unread rows. */}
			<View style={styles.trailing}>
				<View style={unread ? styles.dot : styles.dotSlot} />
				<IconButton
					icon={DeleteIcon}
					label={`Delete notification: ${n.title}`}
					size={18}
					color={color.ink500}
					onPress={() => onDelete(n)}
				/>
			</View>
		</View>
	);
}

export default memo(NotificationCard);

const useStyles = makeStyles(({ color, pressedControl, scheme }) => ({
	frame: {
		flexDirection: "row",
		alignItems: "flex-start",
		backgroundColor: color.surface,
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: color.line,
		overflow: "hidden",
	},
	first: { borderTopWidth: 1, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
	last: { borderBottomWidth: 1, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
	line: { borderTopWidth: 1, borderTopColor: color.line },
	row: {
		flex: 1,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: space[3],
		padding: space[4],
		paddingRight: space[3],
	},
	// Unread rows step forward: subtle in light; on dark one layer up (raised), because subtle is darker than the
	// surface there and reads as recessed. Pressed then goes one more step (skeleton) so it still shows.
	unread: { backgroundColor: scheme === "dark" ? color.raised : color.subtle },
	pressed: { backgroundColor: scheme === "dark" ? color.skeleton : pressedControl },
	icon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
	text: { flex: 1, minWidth: 0, gap: 2 },
	// IconButton is 44 tall; the title line is 20 tall and starts at the row padding (16): the cluster's top is
	// 16 + (20 - 44) / 2 = 4, so its centre is 26, the middle of the first title line.
	trailing: {
		height: 44,
		marginTop: space[4] + (20 - 44) / 2,
		marginRight: space[1],
		flexDirection: "row",
		alignItems: "center",
		gap: space[2],
	},
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.coral500 },
	dotSlot: { width: 8, height: 8 },
}));
