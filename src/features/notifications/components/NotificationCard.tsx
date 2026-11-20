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
				{unread ? <View style={styles.dot} /> : null}
			</Pressable>
			<IconButton
				icon={DeleteIcon}
				label={`Delete notification: ${n.title}`}
				size={18}
				color={color.ink500}
				onPress={() => onDelete(n)}
				style={styles.delete}
			/>
		</View>
	);
}

export default memo(NotificationCard);

const useStyles = makeStyles(({ color, pressedControl }) => ({
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
		paddingRight: space[1],
	},
	unread: { backgroundColor: color.subtle },
	pressed: { backgroundColor: pressedControl },
	icon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
	text: { flex: 1, minWidth: 0, gap: 2 },
	dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: color.coral500 },
	delete: { marginTop: space[2], marginRight: space[1] },
}));
