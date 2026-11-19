import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import dayjs from "dayjs";
import { BOOKING_STATUS, BookingStatusPill, TONE_STYLES, Text, color, space } from "@/ui";
import { CalendarIcon, LocationIcon, TimeIcon, type AppIcon } from "@/ui/icons";
import { formatDay, formatMoney, formatTime, getDisplayStatus, pluralHours } from "@/lib/format";
import { serviceName } from "@/features/booking/services";
import type { Booking } from "@/features/customer/types";

/** True when the booking still waits for its payment (only scheduled bookings can be paid). */
export const needsPayment = (b: Booking) =>
	getDisplayStatus(b) === "scheduled" && !(b.payments ?? []).some((p) => p.status === "completed");

function Meta({ icon: Icon, children }: { icon: AppIcon; children: string }) {
	return (
		<View style={styles.meta}>
			<Icon size={15} weight="bold" color={color.ink500} />
			<Text variant="small" numberOfLines={1} style={styles.flex}>
				{children}
			</Text>
		</View>
	);
}

/** A booking as a row in the list panel (the web's job row): status bar, service, pill, meta, total. */
export const BookingCard = memo(function BookingCard({
	booking,
	first,
	onPress,
}: {
	booking: Booking;
	first: boolean;
	onPress: (booking: Booking) => void;
}) {
	const status = getDisplayStatus(booking);
	const start = dayjs(booking.startDate);
	const total = (booking.rate || 0) * (booking.hours || 0);
	const name = serviceName(booking.service?.id, booking.service?.name);
	const unpaid = needsPayment(booking);
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${name}, ${BOOKING_STATUS[status].label}, ${formatDay(start)} at ${formatTime(start)}, ${formatMoney(total)}${unpaid ? ", payment required" : ""}`}
			accessibilityHint="Opens the booking details"
			onPress={() => onPress(booking)}
			style={({ pressed }) => [styles.row, !first && styles.line, pressed && styles.pressed]}
		>
			<View style={[styles.bar, { backgroundColor: TONE_STYLES[BOOKING_STATUS[status].tone].fg }]} />
			<View style={styles.body}>
				<View style={styles.titleRow}>
					<Text variant="uiStrong" weight="bold" numberOfLines={1} style={styles.shrink}>
						{name}
					</Text>
					<BookingStatusPill status={status} />
				</View>
				<Meta icon={CalendarIcon}>{formatDay(start)}</Meta>
				<Meta icon={TimeIcon}>{`${formatTime(start)}, ${pluralHours(booking.hours)}`}</Meta>
				<Meta icon={LocationIcon}>{booking.address || "No address"}</Meta>
				{unpaid ? (
					<Text variant="small" color="amber700" weight="semibold">
						Payment required
					</Text>
				) : null}
			</View>
			<View style={styles.amount}>
				<Text variant="caption">Total</Text>
				<Text variant="uiStrong" weight="extrabold">
					{formatMoney(total)}
				</Text>
			</View>
		</Pressable>
	);
});

const styles = StyleSheet.create({
	flex: { flex: 1 },
	shrink: { flexShrink: 1 },
	row: {
		flexDirection: "row",
		gap: space[3],
		paddingHorizontal: space[4],
		paddingVertical: space[4],
		backgroundColor: color.surface,
	},
	line: { borderTopWidth: 1, borderTopColor: color.line },
	pressed: { backgroundColor: color.subtle },
	bar: { width: 4, borderRadius: 2, alignSelf: "stretch" },
	body: { flex: 1, gap: 4, minWidth: 0 },
	titleRow: { flexDirection: "row", alignItems: "center", gap: space[2], flexWrap: "wrap", marginBottom: 2 },
	meta: { flexDirection: "row", alignItems: "center", gap: 6 },
	amount: { alignItems: "flex-end" },
});

export default BookingCard;
