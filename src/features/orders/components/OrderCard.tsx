import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BookingStatusPill, Text, color, space } from "@/ui";
import { CalendarIcon, LocationIcon, TimeIcon, type AppIcon } from "@/ui/icons";
import { formatMoney, getDisplayStatus } from "@/lib/format";
import { formatDay, orderEarnings, pluralHours } from "../orderUtils";
import type { Booking } from "../types";
import { ServiceTile } from "./ServiceTile";

function Meta({ icon: Icon, children }: { icon: AppIcon; children: string }) {
	return (
		<View style={styles.meta}>
			<Icon size={16} weight="bold" color={color.ink500} />
			<Text variant="small" numberOfLines={1} style={styles.flex}>
				{children}
			</Text>
		</View>
	);
}

interface OrderCardProps {
	booking: Booking;
	onPress: (booking: Booking) => void;
	/** Open orders are all "scheduled", so only My orders shows the status. */
	showStatus?: boolean;
	/** "1.2 km away", when the provider's position is known. */
	distance?: string | null;
	/** First row of a flush panel without a header: no top hairline. */
	first?: boolean;
}

/** One order as a row inside a Panel: service, when, how long, where, and what the provider earns. */
function OrderCard({ booking, onPress, showStatus, distance, first }: OrderCardProps) {
	const start = new Date(booking.startDate);
	const service = booking.service?.name || "Service";
	const earn = formatMoney(orderEarnings(booking));
	const when = `${formatDay(start)}, ${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
	const where = distance ? `${booking.address} · ${distance}` : booking.address;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${service}, ${when}, ${pluralHours(booking.hours)}, ${where}, you earn ${earn}`}
			onPress={() => onPress(booking)}
			style={({ pressed }) => [styles.row, !first && styles.line, pressed && styles.pressed]}
		>
			<ServiceTile serviceId={booking.service?.id} size={36} />
			<View style={styles.body}>
				<Text variant="uiStrong" weight="bold" numberOfLines={1}>
					{service}
				</Text>
				<Meta icon={CalendarIcon}>{when}</Meta>
				<Meta icon={TimeIcon}>{`${pluralHours(booking.hours)} at ${formatMoney(booking.rate)}/hr`}</Meta>
				<Meta icon={LocationIcon}>{where}</Meta>
			</View>
			<View style={styles.right}>
				<Text variant="panelTitle" weight="extrabold">
					{earn}
				</Text>
				<Text variant="caption">You earn</Text>
				{showStatus ? <BookingStatusPill status={getDisplayStatus(booking)} /> : null}
			</View>
		</Pressable>
	);
}

export default memo(OrderCard);

const styles = StyleSheet.create({
	flex: { flex: 1 },
	row: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: space[3],
		paddingHorizontal: space[4],
		paddingVertical: space[4],
		backgroundColor: color.surface,
	},
	line: { borderTopWidth: 1, borderTopColor: color.line },
	pressed: { backgroundColor: color.subtle },
	body: { flex: 1, gap: 4, minWidth: 0 },
	meta: { flexDirection: "row", alignItems: "center", gap: space[2] },
	right: { alignItems: "flex-end", gap: 4 },
});
