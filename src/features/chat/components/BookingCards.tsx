// Booking cards in the conversation (spec: scratch/chat-cards/spec.md, section B). An event message is not a bubble: it
// is a card that shows the booking as it is now (from the pair's bookings, loaded once and shared through context, never
// one request per card) plus what happened at this point in the conversation. Rules: ../bookingEvents.ts.
import React, { createContext, memo, useContext } from "react";
import { Pressable, View } from "react-native";
import dayjs from "dayjs";
import { BOOKING_STATUS, BookingStatusPill, Skeleton, Text, makeStyles, radius, space, useTheme } from "@/ui";
import { ChevronRightIcon } from "@/ui/icons";
import { formatDay } from "@/lib/format";
import { ServiceIcon } from "@/features/booking/services";
import type { ChatMessage } from "../chatRuntime";
import {
	EVENT_TITLE,
	LEGACY_ACCEPTED_TEXT,
	displayStatusOf,
	stagesOf,
	type EventLine,
	type PairBooking,
	type StreamItem,
} from "../bookingEvents";

export type EventItem = Extract<StreamItem<ChatMessage>, { type: "event" }>;
export type LineItem = Extract<StreamItem<ChatMessage>, { type: "line" }>;

export interface BookingCardsShared {
	bookings: ReadonlyMap<string, PairBooking>;
	/** Opens the booking (customer) or order (provider) detail. */
	open: (bookingId: string) => void;
}

/** The pair's bookings, once for every card of the conversation. */
export const BookingCardsContext = createContext<BookingCardsShared>({ bookings: new Map(), open: () => undefined });

const CARD_MAX_WIDTH = 420;
// Fixed line heights make the card's height known before it renders, so the skeleton has the same size:
// 2 border + 2 x 12 padding + 38 head + 10 gap + 27 progress + 10 gap + 18 per event line (+ 2 between lines).
const LINE_HEIGHT = 18;
const LINE_GAP = 2;
export const FULL_HEIGHT = 2 + 24 + 38 + 10 + 27 + 10 + LINE_HEIGHT;
export const COMPACT_HEIGHT = 44;

const timeOf = (msTime: number) => dayjs(msTime).format("HH:mm");

/** One line's time; with the day when it is not the day of the group's first line. */
const lineTime = (line: EventLine, first: EventLine) =>
	dayjs(line.at).isSame(dayjs(first.at), "day")
		? timeOf(line.at)
		: `${dayjs(line.at).format("D MMM")}, ${timeOf(line.at)}`;

const dateLine = (b: PairBooking) => {
	const start = dayjs(b.startDate);
	const end = start.add(b.hours || 0, "hour");
	return `${formatDay(start)} · ${start.format("HH:mm")}–${end.format("HH:mm")} · ${b.hours} h`;
};

const cardLabel = (b: PairBooking, lines: EventLine[]) => {
	const start = dayjs(b.startDate);
	const status = BOOKING_STATUS[displayStatusOf(b)]?.label.toLowerCase() ?? "";
	const what = lines
		.map((l, i) => {
			const title = EVENT_TITLE[l.event];
			return `${i ? title.charAt(0).toLowerCase() + title.slice(1) : title} at ${timeOf(l.at)}`;
		})
		.join(", ");
	return `${b.service?.name ?? "Booking"}, ${start.format("dddd D MMMM HH:mm")}, ${status}. ${what}. Open booking.`;
};

export function ServiceChip({ serviceId, size = 32 }: { serviceId?: number; size?: number }) {
	const { color } = useTheme();
	const styles = useStyles();
	return (
		<View style={[styles.chip, { width: size, height: size }]}>
			<ServiceIcon serviceId={serviceId} size={Math.round(size * 0.58)} color={color.coral600} />
		</View>
	);
}

function Progress({ booking }: { booking: PairBooking }) {
	const styles = useStyles();
	const { color } = useTheme();
	return (
		<View style={styles.progress}>
			{stagesOf(booking).map((st) => (
				<View key={st.label} style={styles.stage}>
					<View
						style={[
							styles.stageDot,
							st.state === "todo"
								? { borderWidth: 1.5, borderColor: color.ink300 }
								: { backgroundColor: st.state === "cancelled" ? color.red500 : color.green500 },
						]}
					/>
					<Text
						variant="caption"
						weight={st.state === "current" ? "extrabold" : "semibold"}
						color={st.state === "cancelled" ? "red700" : st.state === "todo" ? "ink500" : "ink900"}
						numberOfLines={1}
					>
						{st.label}
					</Text>
				</View>
			))}
		</View>
	);
}

function FullCard({ item, booking }: { item: EventItem; booking: PairBooking }) {
	const styles = useStyles();
	const { color } = useTheme();
	const { open } = useContext(BookingCardsContext);
	const first = item.lines[0];
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={cardLabel(booking, item.lines)}
			onPress={() => open(booking._id)}
			style={({ pressed }) => [styles.card, styles.full, pressed && styles.pressed]}
		>
			<View style={styles.head}>
				<ServiceChip serviceId={booking.service?.id} />
				<View style={styles.flex}>
					<Text variant="uiStrong" numberOfLines={1}>
						{booking.service?.name ?? "Booking"}
					</Text>
					<Text variant="small" color="ink600" numberOfLines={1}>
						{dateLine(booking)}
					</Text>
				</View>
				<View style={styles.noShrink}>
					<BookingStatusPill status={displayStatusOf(booking)} />
				</View>
			</View>
			<View style={styles.rule}>
				<Progress booking={booking} />
			</View>
			<View style={styles.foot}>
				<View style={[styles.flex, styles.lines]}>
					{item.lines.map((l) => (
						<Text key={l.key} variant="small" color="ink600" numberOfLines={1} style={styles.line}>
							<Text variant="small" weight="semibold" color="ink900">
								{EVENT_TITLE[l.event]}
							</Text>
							{` · ${lineTime(l, first)}`}
						</Text>
					))}
				</View>
				<View style={styles.view}>
					<Text variant="small" weight="bold" color="coral600" style={styles.line}>
						View
					</Text>
					<ChevronRightIcon size={14} weight="bold" color={color.coral600} />
				</View>
			</View>
		</Pressable>
	);
}

function CompactRow({ item, booking }: { item: EventItem; booking: PairBooking }) {
	const styles = useStyles();
	const { color } = useTheme();
	const { open } = useContext(BookingCardsContext);
	const last = item.lines[item.lines.length - 1];
	const text = `${EVENT_TITLE[last.event]} · ${booking.service?.name ?? "Booking"}, ${formatDay(booking.startDate)}`;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${text}. ${timeOf(last.at)}. Open booking.`}
			onPress={() => open(booking._id)}
			style={({ pressed }) => [styles.card, styles.compact, pressed && styles.pressed]}
		>
			<ServiceChip serviceId={booking.service?.id} size={24} />
			<Text variant="small" weight="semibold" color="ink900" numberOfLines={1} style={styles.flex}>
				{text}
			</Text>
			<Text variant="caption" color="ink500">
				{timeOf(last.at)}
			</Text>
			<ChevronRightIcon size={14} weight="bold" color={color.ink500} />
		</Pressable>
	);
}

/** The list item for a booking event group: the card, the compact row, or a skeleton of the same size while loading. */
export const BookingEventItem = memo(function BookingEventItem({ item }: { item: EventItem }) {
	const styles = useStyles();
	const { bookings } = useContext(BookingCardsContext);
	const booking = bookings.get(item.bookingId);
	if (item.loading || !booking) {
		const height =
			item.variant === "full"
				? FULL_HEIGHT + (LINE_HEIGHT + LINE_GAP) * Math.max(0, item.lines.length - 1)
				: COMPACT_HEIGHT;
		return (
			<View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="Loading booking">
				<Skeleton height={height} radius={radius.md} style={styles.skeleton} />
			</View>
		);
	}
	return (
		<View style={styles.row}>
			{item.variant === "full" ? (
				<FullCard item={item} booking={booking} />
			) : (
				<CompactRow item={item} booking={booking} />
			)}
		</View>
	);
});

/** A neutral system line: a legacy "A booking was accepted." that matches no booking (the client's constant text). */
export const SystemLine = memo(function SystemLine({ item }: { item: LineItem }) {
	const styles = useStyles();
	return (
		<Text variant="caption" color="ink500" align="center" style={styles.system}>
			{`${LEGACY_ACCEPTED_TEXT} · ${timeOf(item.m.sentAt)}`}
		</Text>
	);
});

const useStyles = makeStyles(({ color, pressedRow }) => ({
	row: { alignItems: "center", marginVertical: space[1] },
	skeleton: { width: "100%", maxWidth: CARD_MAX_WIDTH },
	card: {
		width: "100%",
		maxWidth: CARD_MAX_WIDTH,
		backgroundColor: color.surface,
		borderWidth: 1,
		borderColor: color.line,
		borderRadius: radius.md,
	},
	pressed: { backgroundColor: pressedRow },
	full: { padding: space[3], gap: 10 },
	compact: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[2],
		minHeight: COMPACT_HEIGHT,
		paddingHorizontal: 10,
	},
	chip: {
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.sm,
		backgroundColor: color.coral50,
	},
	head: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 38 },
	flex: { flex: 1, minWidth: 0 },
	noShrink: { flexShrink: 0 },
	rule: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: 10 },
	progress: { flexDirection: "row", alignItems: "center", gap: space[4], minHeight: 16 },
	stage: { flexDirection: "row", alignItems: "center", gap: 6 },
	stageDot: { width: 8, height: 8, borderRadius: 4 },
	foot: { flexDirection: "row", alignItems: "flex-end", gap: space[2] },
	lines: { gap: LINE_GAP },
	line: { lineHeight: LINE_HEIGHT },
	view: { flexDirection: "row", alignItems: "center", gap: 2, height: LINE_HEIGHT },
	system: { paddingVertical: space[1] },
}));
