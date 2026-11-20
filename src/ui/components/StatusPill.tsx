import React from "react";
import { View, type ViewStyle } from "react-native";
import { Text } from "../Text";
import { radius } from "../tokens";
import { byScheme, makeStyles, useTheme } from "../theme";

export type Tone = "green" | "blue" | "amber" | "grey" | "red";

/** Green done, blue in motion, amber needs action, grey neutral, red stopped. Same as the web. */
export interface ToneStyle {
	fg: string;
	bg: string;
	border: string;
	/** Dots and bars: the status colour itself (the 500s on dark, where the text colour is a light tint). */
	dot: string;
}
export const TONE_STYLES = byScheme((color, scheme): Record<Tone, ToneStyle> => {
	const dark = scheme === "dark";
	return {
		green: {
			fg: color.green700,
			bg: color.green50,
			border: color.green200,
			dot: dark ? color.green500 : color.green700,
		},
		blue: { fg: color.blue700, bg: color.blue50, border: color.blue200, dot: dark ? color.blue500 : color.blue700 },
		amber: {
			fg: color.amber700,
			bg: color.amber50,
			border: color.amber200,
			dot: dark ? color.amber500 : color.amber700,
		},
		grey: { fg: color.ink600, bg: color.canvas, border: color.line, dot: color.ink600 },
		red: { fg: color.red700, bg: color.red50, border: color.red200, dot: dark ? color.red500 : color.red700 },
	};
});

/** The colours of a tone for the active scheme. */
export function useToneStyle(tone: Tone): ToneStyle {
	const { scheme } = useTheme();
	return TONE_STYLES[scheme][tone];
}

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
	const styles = useStyles();
	const t = useToneStyle(tone);
	return (
		<View
			accessibilityRole="text"
			accessibilityLabel={`Status: ${children}`}
			style={[styles.pill, size === "md" && styles.md, { backgroundColor: t.bg, borderColor: t.border }, style]}
		>
			<View style={[styles.dot, { backgroundColor: t.dot }]} />
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
	const { color } = useTheme();
	const styles = useStyles();
	const coral = tone === "coral";
	return (
		<View style={[styles.count, coral ? styles.countCoral : styles.countNeutral]}>
			<Text
				variant="caption"
				weight="bold"
				style={{ fontSize: 11, lineHeight: 14, color: coral ? color.onBrand : color.ink700 }}
			>
				{String(value)}
			</Text>
		</View>
	);
}

const useStyles = makeStyles(({ color }) => ({
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
	// brandFill, not coral500: white text needs the text-bearing coral fill.
	countCoral: { backgroundColor: color.brandFill },
}));

export default StatusPill;
