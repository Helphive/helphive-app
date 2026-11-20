// The bookings row under the conversation header (spec: scratch/chat-cards/spec.md, section C): the most relevant
// booking with this person in one fixed-height row that never scrolls sideways, and "All (N)", which opens the timeline
// in a bottom sheet. Ordering rules: ../bookingEvents.ts.
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import dayjs from "dayjs";
import {
	BOOKING_STATUS,
	BookingStatusPill,
	BottomSheet,
	Skeleton,
	TONE_STYLES,
	Text,
	layout,
	makeStyles,
	radius,
	space,
	useTheme,
} from "@/ui";
import { ChevronDownIcon, ChevronRightIcon } from "@/ui/icons";
import { formatDay } from "@/lib/format";
import { ServiceIcon } from "@/features/booking/services";
import { displayStatusOf, mostRelevantBooking, timelineGroups, type PairBooking } from "../bookingEvents";
import { ServiceChip } from "./BookingCards";

export const HEADER_ROW_HEIGHT = 48;

const range = (b: PairBooking) => {
	const start = dayjs(b.startDate);
	return `${start.format("HH:mm")}–${start.add(b.hours || 0, "hour").format("HH:mm")}`;
};
const when = (b: PairBooking) => `${formatDay(b.startDate)}, ${dayjs(b.startDate).format("HH:mm")}`;
const statusLabel = (b: PairBooking) => BOOKING_STATUS[displayStatusOf(b)]?.label.toLowerCase() ?? "";

function TimelineRow({
	booking,
	onOpen,
	first,
	last,
}: {
	booking: PairBooking;
	onOpen: (id: string) => void;
	first: boolean;
	last: boolean;
}) {
	const styles = useStyles();
	const { color, scheme } = useTheme();
	const status = displayStatusOf(booking);
	const tone = BOOKING_STATUS[status]?.tone ?? "grey";
	return (
		<View style={styles.timelineItem}>
			{/* The rail column: a line from the row above, the dot (centred on the row), a line to the row below. */}
			<View style={styles.railColumn}>
				<View style={[styles.railLine, first && styles.hidden]} />
				<View style={[styles.dot, { backgroundColor: TONE_STYLES[scheme][tone].dot }]} />
				<View style={[styles.railLine, last && styles.hidden]} />
			</View>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${booking.service?.name ?? "Booking"}, ${formatDay(booking.startDate)} ${range(booking)}, ${statusLabel(booking)}. Open booking.`}
				onPress={() => onOpen(booking._id)}
				style={({ pressed }) => [styles.timelineRow, pressed && styles.pressed]}
			>
				<ServiceChip serviceId={booking.service?.id} />
				<View style={styles.flex}>
					<Text variant="uiStrong" numberOfLines={1}>
						{booking.service?.name ?? "Booking"}
					</Text>
					<Text variant="small" color="ink600">
						{`${formatDay(booking.startDate)} ${range(booking)}`}
					</Text>
				</View>
				<View style={styles.noShrink}>
					<BookingStatusPill status={status} />
				</View>
				<ChevronRightIcon size={14} weight="bold" color={color.ink500} />
			</Pressable>
		</View>
	);
}

function TimelineGroup({
	title,
	bookings,
	onOpen,
}: {
	title: string;
	bookings: PairBooking[];
	onOpen: (id: string) => void;
}) {
	const styles = useStyles();
	if (!bookings.length) return null;
	return (
		<View style={styles.group}>
			<Text
				variant="caption"
				weight="extrabold"
				color="ink500"
				accessibilityRole="header"
				style={styles.groupTitle}
			>
				{title.toUpperCase()}
			</Text>
			<View>
				{bookings.map((b, i) => (
					<TimelineRow
						key={b._id}
						booking={b}
						onOpen={onOpen}
						first={i === 0}
						last={i === bookings.length - 1}
					/>
				))}
			</View>
		</View>
	);
}

export default function BookingsHeader({
	bookings,
	firstName,
	loading,
	onOpen,
}: {
	bookings: PairBooking[];
	firstName: string;
	/** The bookings are still loading: a placeholder row of the same height, so nothing jumps when they arrive. */
	loading: boolean;
	onOpen: (bookingId: string) => void;
}) {
	const styles = useStyles();
	const { color } = useTheme();
	const { height } = useWindowDimensions();
	const [open, setOpen] = useState(false);
	const now = Date.now();
	const current = mostRelevantBooking(bookings, now);
	const groups = useMemo(() => (open ? timelineGroups(bookings, Date.now()) : null), [bookings, open]);

	if (!current) {
		return loading ? (
			<View style={styles.bar} accessibilityRole="progressbar" accessibilityLabel="Loading bookings">
				<Skeleton width="60%" height={22} radius={radius.sm} />
			</View>
		) : null;
	}

	const status = displayStatusOf(current);
	const many = bookings.length > 1;
	const openBooking = (id: string) => {
		setOpen(false);
		onOpen(id);
	};

	return (
		<View style={styles.bar}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${current.service?.name ?? "Booking"}, ${when(current)}, ${statusLabel(current)}. Open booking.`}
				onPress={() => onOpen(current._id)}
				style={({ pressed }) => [styles.current, pressed && styles.pressed]}
			>
				<ServiceIcon serviceId={current.service?.id} size={20} color={color.coral600} />
				<View style={styles.flex}>
					<Text variant="small" weight="bold" color="ink900" numberOfLines={1}>
						{current.service?.name ?? "Booking"}
					</Text>
					<Text variant="caption" color="ink600" numberOfLines={1}>
						{when(current)}
					</Text>
				</View>
				<View style={styles.noShrink}>
					<BookingStatusPill status={status} />
				</View>
			</Pressable>
			{many ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`All bookings (${bookings.length})`}
					accessibilityHint="Opens the timeline of your bookings with this person"
					accessibilityState={{ expanded: open }}
					onPress={() => setOpen(true)}
					style={({ pressed }) => [styles.all, pressed && styles.pressed]}
				>
					<Text variant="small" weight="bold" color="ink900" numberOfLines={1}>
						{`All (${bookings.length})`}
					</Text>
					<ChevronDownIcon size={14} weight="bold" color={color.ink900} />
				</Pressable>
			) : null}
			{many ? (
				<BottomSheet
					visible={open}
					onClose={() => setOpen(false)}
					title={`Bookings with ${firstName || "them"}`}
				>
					<ScrollView
						style={{ maxHeight: Math.round(height * 0.62) }}
						contentContainerStyle={styles.sheetList}
					>
						{groups ? (
							<>
								<TimelineGroup
									title="Active and upcoming"
									bookings={groups.active}
									onOpen={openBooking}
								/>
								<TimelineGroup title="Past" bookings={groups.past} onOpen={openBooking} />
							</>
						) : null}
					</ScrollView>
				</BottomSheet>
			) : null}
		</View>
	);
}

const useStyles = makeStyles(({ color, pressedRow }) => ({
	bar: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[1],
		height: HEADER_ROW_HEIGHT,
		paddingLeft: layout.gutter,
		paddingRight: space[1],
		overflow: "hidden",
		backgroundColor: color.subtle,
		borderBottomWidth: 1,
		borderBottomColor: color.line,
	},
	current: {
		flex: 1,
		minWidth: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: space[2],
		height: "100%",
	},
	pressed: { backgroundColor: pressedRow },
	flex: { flex: 1, minWidth: 0 },
	noShrink: { flexShrink: 0 },
	all: {
		flexShrink: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: space[1],
		height: "100%",
		paddingHorizontal: space[3],
	},
	sheetList: { paddingBottom: space[2] },
	group: { marginBottom: space[3] },
	groupTitle: { letterSpacing: 0.5, marginBottom: space[1] },
	timelineItem: { flexDirection: "row", alignItems: "stretch" },
	// 10 wide plus 12 to the content: 22, as the web.
	railColumn: { width: 10, marginRight: 12, alignItems: "center" },
	railLine: { flex: 1, width: 2, backgroundColor: color.line },
	hidden: { opacity: 0 },
	// The 3px gap around the dot (sheet colour) cuts the rail, as on the web.
	dot: { width: 10, height: 10, borderRadius: 5, marginVertical: 3 },
	timelineRow: {
		flex: 1,
		minWidth: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		minHeight: 58,
		paddingVertical: 10,
		paddingRight: space[1],
		borderRadius: radius.sm,
	},
}));
