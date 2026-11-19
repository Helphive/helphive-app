import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "../Text";
import { color, radius } from "../tokens";

export type Tone = "green" | "blue" | "amber" | "grey" | "red";

/** Green done, blue in motion, amber needs action, grey neutral, red stopped. Same as the web. */
export const TONE_STYLES: Record<Tone, { fg: string; bg: string; border: string }> = {
	green: { fg: color.green700, bg: color.green50, border: color.green200 },
	blue: { fg: color.blue700, bg: color.blue50, border: color.blue200 },
	amber: { fg: color.amber700, bg: color.amber50, border: color.amber200 },
	grey: { fg: color.ink600, bg: color.canvas, border: color.line },
	red: { fg: color.red700, bg: color.red50, border: color.red200 },
};

export type BookingDisplayStatus =
	| "scheduled"
	| "accepted"
	| "awaiting_start_approval"
	| "in_progress"
	| "completed"
	| "cancelled"
	| "expired";

export const BOOKING_STATUS: Record<BookingDisplayStatus, { label: string; tone: Tone }> = {
	scheduled: { label: "Scheduled", tone: "grey" },
	accepted: { label: "Accepted", tone: "blue" },
	awaiting_start_approval: { label: "Needs approval", tone: "amber" },
	in_progress: { label: "In progress", tone: "blue" },
	completed: { label: "Completed", tone: "green" },
	cancelled: { label: "Cancelled", tone: "red" },
	expired: { label: "Expired", tone: "grey" },
};

export interface StatusPillProps {
	tone?: Tone;
	children: string;
	size?: "sm" | "md";
	style?: ViewStyle;
}

/** Status is always a pill with a dot. The only fully rounded element besides counts. */
export function StatusPill({ tone = "grey", size = "sm", children, style }: StatusPillProps) {
	const t = TONE_STYLES[tone];
	return (
		<View
			accessibilityRole="text"
			accessibilityLabel={`Status: ${children}`}
			style={[styles.pill, size === "md" && styles.md, { backgroundColor: t.bg, borderColor: t.border }, style]}
		>
			<View style={[styles.dot, { backgroundColor: t.fg }]} />
			<Text variant="caption" weight="bold" style={{ color: t.fg, fontSize: size === "md" ? 13 : 12 }}>
				{children}
			</Text>
		</View>
	);
}

export function BookingStatusPill({ status, size }: { status: BookingDisplayStatus; size?: "sm" | "md" }) {
	const meta = BOOKING_STATUS[status] ?? BOOKING_STATUS.scheduled;
	return (
		<StatusPill tone={meta.tone} size={size}>
			{meta.label}
		</StatusPill>
	);
}

/** Small neutral count for tabs and lists ("Active 1"). Use `tone="coral"` only for unread counts. */
export function Count({ value, tone = "neutral" }: { value: number | string; tone?: "neutral" | "coral" }) {
	const coral = tone === "coral";
	return (
		<View style={[styles.count, coral ? styles.countCoral : styles.countNeutral]}>
			<Text
				variant="caption"
				weight="bold"
				style={{ fontSize: 11, lineHeight: 14, color: coral ? color.surface : color.ink700 }}
			>
				{String(value)}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	pill: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		gap: 6,
		height: 22,
		paddingHorizontal: 8,
		borderRadius: radius.pill,
		borderWidth: 1,
	},
	md: { height: 26, paddingHorizontal: 10 },
	dot: { width: 6, height: 6, borderRadius: 3 },
	count: {
		minWidth: 20,
		height: 18,
		paddingHorizontal: 6,
		borderRadius: radius.pill,
		alignItems: "center",
		justifyContent: "center",
	},
	countNeutral: { backgroundColor: color.canvas, borderWidth: 1, borderColor: color.line },
	// coral600, not 500: white text needs the text-bearing coral.
	countCoral: { backgroundColor: color.coral600 },
});

export default StatusPill;
