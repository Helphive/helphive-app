import React, { type ReactNode } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import dayjs from "dayjs";
import { Avatar, BookingStatusPill, Button, Panel, ShiftRuler, StatusPill, Text, color, space } from "@/ui";
import { LocationIcon, RatingIcon } from "@/ui/icons";
import { formatMoney, getDisplayStatus } from "@/lib/format";
import { profileImageUrl } from "@/lib/gcloud";
import {
	PLATFORM_FEE_RATE,
	formatDay,
	orderCode,
	orderEarnings,
	orderTotal,
	pluralHours,
	timeRange,
	venueName,
} from "../orderUtils";
import { isCounterparty, type Booking } from "../types";
import { ServiceTile } from "./ServiceTile";

/** Label left, value right: a summary line. */
export function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
	return (
		<View style={styles.infoRow}>
			<Text variant="ui" color="ink600" style={styles.flex}>
				{label}
			</Text>
			<Text variant={strong ? "figure" : "uiStrong"} align="right" style={styles.value}>
				{value}
			</Text>
		</View>
	);
}

/** Labels above values, in the order date, start, hours, rate (the web's ticket strip). */
function TicketStrip({ booking }: { booking: Booking }) {
	const cells = [
		{ label: "Date", value: formatDay(booking.startDate) },
		{ label: "Start", value: dayjs(booking.startDate).format("HH:mm") },
		{ label: "Hours", value: String(booking.hours) },
		{ label: "Rate", value: `${formatMoney(booking.rate)}/hr` },
	];
	return (
		<View style={styles.strip}>
			{cells.map((c, i) => (
				<View key={c.label} style={[styles.cell, i > 0 && styles.cellLine]}>
					<Text variant="caption">{c.label}</Text>
					<Text variant="uiStrong" weight="bold" numberOfLines={1}>
						{c.value}
					</Text>
				</View>
			))}
		</View>
	);
}

const openInMaps = (booking: Booking) => {
	const q = encodeURIComponent(booking.address);
	const hasPin = booking.latitude != null && booking.longitude != null;
	const url =
		Platform.OS === "ios"
			? `http://maps.apple.com/?q=${q}${hasPin ? `&ll=${booking.latitude},${booking.longitude}` : ""}`
			: hasPin
				? `geo:${booking.latitude},${booking.longitude}?q=${booking.latitude},${booking.longitude}(${q})`
				: `geo:0,0?q=${q}`;
	Linking.openURL(url).catch(() =>
		Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => undefined),
	);
};

/** When things happened, oldest first. Only the steps that have a time. */
function Timeline({ booking }: { booking: Booking }) {
	const steps: { label: string; at?: string | null }[] = [
		{ label: "Booked and paid", at: booking.createdAt },
		{ label: "Accepted by you", at: booking.acceptedAt },
		{ label: "Start requested", at: booking.startRequestedAt },
		{ label: "Started", at: booking.startedAt },
		{ label: "Completed", at: booking.completedAt },
		{ label: "Cancelled", at: booking.cancelledAt },
	];
	const shown = steps.filter((s) => !!s.at);
	if (!shown.length) return null;
	return (
		<Panel title="Timeline">
			<View accessibilityRole="list" style={styles.timeline}>
				{shown.map((s, i) => (
					<View key={s.label} style={styles.step}>
						<View style={styles.rail}>
							<View style={[styles.dot, i === shown.length - 1 && styles.dotLast]} />
							{i < shown.length - 1 ? <View style={styles.railLine} /> : null}
						</View>
						<View style={styles.stepText}>
							<Text variant="uiStrong">{s.label}</Text>
							<Text variant="small">{dayjs(s.at).format("ddd D MMM, HH:mm")}</Text>
						</View>
					</View>
				))}
			</View>
		</Panel>
	);
}

interface Props {
	booking: Booking;
	/** "1.2 km away", when known. */
	distance?: string | null;
	/** Show the customer's email and phone (only once the order is the provider's). */
	showContact?: boolean;
	/** Extra content under the header (a notice about the order's state). */
	notice?: ReactNode;
	/** Extra content at the end (the chat or receipt button). */
	children?: ReactNode;
}

/** Everything about one order, as panels: status, when, where, pay, customer, timeline. */
export default function OrderDetailsView({ booking, distance, showContact, notice, children }: Props) {
	const status = getDisplayStatus(booking);
	const customer = isCounterparty(booking.userId) ? booking.userId : null;
	const customerName = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "Customer";
	const total = orderTotal(booking);
	return (
		<>
			<View style={styles.head}>
				<ServiceTile serviceId={booking.service?.id} size={48} />
				<View style={styles.flex}>
					<Text variant="heading" accessibilityRole="header">
						{booking.service?.name || "Service"}
					</Text>
					<Text variant="small">Order {orderCode(booking)}</Text>
				</View>
				<BookingStatusPill status={status} size="md" />
			</View>
			{notice}

			<Panel title="When" subtitle={`${formatDay(booking.startDate)}, ${timeRange(booking)}`}>
				<View style={styles.gap}>
					<ShiftRuler blocks={[{ start: booking.startDate, hours: Number(booking.hours) || 1 }]} />
					<TicketStrip booking={booking} />
				</View>
			</Panel>

			<Panel
				title="Where"
				actions={
					<Button size="sm" variant="secondary" icon={LocationIcon} onPress={() => openInMaps(booking)}>
						Open in maps
					</Button>
				}
			>
				<View style={styles.gapSm}>
					<Text variant="uiStrong">{venueName(booking)}</Text>
					<Text variant="ui" color="ink600">
						{booking.address}
					</Text>
					{distance ? <StatusPill tone="grey">{distance}</StatusPill> : null}
				</View>
			</Panel>

			<Panel title="Your pay">
				<View style={styles.gapSm}>
					<InfoRow
						label={`${pluralHours(booking.hours)} at ${formatMoney(booking.rate)}/hr`}
						value={formatMoney(total)}
					/>
					<InfoRow
						label={`Platform fee (${Math.round(PLATFORM_FEE_RATE * 100)}%)`}
						value={`-${formatMoney(total * PLATFORM_FEE_RATE)}`}
					/>
					<View style={styles.divider} />
					<InfoRow label="You earn" value={formatMoney(orderEarnings(booking))} strong />
				</View>
			</Panel>

			<Panel title="Customer">
				<View style={styles.person}>
					<Avatar
						uri={profileImageUrl(customer?.profile)}
						firstName={customer?.firstName}
						lastName={customer?.lastName}
						size={44}
					/>
					<View style={styles.flex}>
						<Text variant="uiStrong" weight="bold">
							{customerName}
						</Text>
						{customer?.rating ? (
							<View style={styles.rating}>
								<RatingIcon size={14} weight="fill" color={color.amber500} />
								<Text variant="small">{`${customer.rating.toFixed(1)} rating`}</Text>
							</View>
						) : null}
						{showContact && customer?.email ? <Text variant="small">{customer.email}</Text> : null}
						{showContact && customer?.phone ? <Text variant="small">{customer.phone}</Text> : null}
					</View>
				</View>
			</Panel>

			<Timeline booking={booking} />
			{children}
		</>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	head: { flexDirection: "row", alignItems: "center", gap: space[3] },
	gap: { gap: space[4] },
	gapSm: { gap: space[2] },
	infoRow: { flexDirection: "row", alignItems: "center", gap: space[3] },
	value: { flexShrink: 0 },
	divider: { height: 1, backgroundColor: color.line, marginVertical: space[1] },
	strip: { flexDirection: "row", borderWidth: 1, borderColor: color.line, borderRadius: 6 },
	cell: { flex: 1, paddingVertical: space[2], paddingHorizontal: space[2], gap: 2 },
	cellLine: { borderLeftWidth: 1, borderLeftColor: color.line },
	person: { flexDirection: "row", alignItems: "center", gap: space[3] },
	rating: { flexDirection: "row", alignItems: "center", gap: 4 },
	timeline: { gap: 0 },
	step: { flexDirection: "row", gap: space[3] },
	rail: { width: 12, alignItems: "center" },
	dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: color.ink300 },
	dotLast: { backgroundColor: color.ink900 },
	railLine: { flex: 1, width: 2, backgroundColor: color.line, marginVertical: 2 },
	stepText: { flex: 1, paddingBottom: space[3], gap: 2 },
});
