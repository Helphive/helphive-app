import React, { type ReactNode } from "react";
import { Linking, View } from "react-native";
import dayjs from "dayjs";
import {
	Avatar,
	BookingStatusPill,
	LinkButton,
	Panel,
	ShiftRuler,
	StatusPill,
	Text,
	space,
	type BookingDisplayStatus,
	makeStyles,
	useTheme,
} from "@/ui";
import { EmailIcon, PhoneIcon, ProfileIcon, RatingIcon } from "@/ui/icons";
import { formatDay, formatMoney, formatTime, getDisplayStatus } from "@/lib/format";
import { profileImageUrl } from "@/lib/gcloud";
import { ServiceIcon, serviceName } from "@/features/booking/services";
import { MapPreview } from "@/features/booking/places/MapPreview";
import type { Booking, BookingPayment, BookingPerson } from "@/features/customer/types";
import { SummaryRow, TotalRow } from "@/features/booking/components/BookingSummary";
import MessageButton from "@/features/chat/components/MessageButton";
import { StatusTimeline } from "./StatusTimeline";

const HERO_TEXT: Record<BookingDisplayStatus, string> = {
	scheduled: "Waiting for a provider to accept this booking.",
	accepted: "A provider has accepted. They will start the job on the day.",
	awaiting_start_approval: "The provider is ready to start and needs your approval.",
	in_progress: "The job is in progress.",
	completed: "This job has been completed.",
	cancelled: "This booking was cancelled.",
	expired: "No provider accepted before the start time.",
};

/** Payment state as a pill. "Refunded" only when a refund was really issued (it has a refund id). */
export function PaymentPill({ payment }: { payment: BookingPayment | null | undefined }) {
	if (!payment) return null;
	if (payment.refundId) {
		if (payment.refundStatus === "succeeded") return <StatusPill tone="blue">Refunded</StatusPill>;
		if (payment.refundStatus === "failed" || payment.refundStatus === "cancelled")
			return <StatusPill tone="red">Refund failed</StatusPill>;
		return <StatusPill tone="amber">Refund pending</StatusPill>;
	}
	if (payment.status === "completed") return <StatusPill tone="green">Paid</StatusPill>;
	if (payment.status === "cancelled") return <StatusPill tone="grey">Not charged</StatusPill>;
	return <StatusPill tone="amber">Payment pending</StatusPill>;
}

function Cell({ label, value, right, top }: { label: string; value: string; right?: boolean; top?: boolean }) {
	const styles = useStyles();
	return (
		<View style={[styles.cell, right && styles.cellRight, top && styles.cellTop]}>
			<Text variant="caption">{label}</Text>
			<Text variant="uiStrong" weight="bold">
				{value}
			</Text>
		</View>
	);
}

function PersonPanel({ person, bookingId }: { person: BookingPerson | null; bookingId: string }) {
	const { color } = useTheme();
	const styles = useStyles();
	return (
		<Panel title="Provider">
			{person ? (
				<View style={styles.personStack}>
					<View style={styles.person}>
						<Avatar
							uri={profileImageUrl(person.profile)}
							firstName={person.firstName}
							lastName={person.lastName}
							size={44}
						/>
						<View style={styles.flex}>
							<Text variant="uiStrong" weight="bold">
								{[person.firstName, person.lastName].filter(Boolean).join(" ") || "Your provider"}
							</Text>
							{person.rating ? (
								<View style={styles.inline}>
									<RatingIcon size={14} weight="fill" color={color.amber500} />
									<Text variant="caption">{person.rating.toFixed(1)}</Text>
								</View>
							) : null}
						</View>
					</View>
					{person.email ? (
						<View style={styles.inline}>
							<EmailIcon size={16} weight="bold" color={color.ink500} />
							<Text variant="ui" style={styles.flex}>
								{person.email}
							</Text>
						</View>
					) : null}
					{person.phone ? (
						<View style={styles.inline}>
							<PhoneIcon size={16} weight="bold" color={color.ink500} />
							<Text variant="ui">{person.phone}</Text>
						</View>
					) : null}
					<MessageButton bookingId={bookingId} label="Message provider" />
				</View>
			) : (
				<View style={styles.person}>
					<View style={styles.emptyAvatar}>
						<ProfileIcon color={color.ink500} />
					</View>
					<Text variant="ui" color="ink600" style={styles.flex}>
						No provider has accepted yet
					</Text>
				</View>
			)}
		</Panel>
	);
}

/** The customer's view of one booking: the web's BookingDetailView stacked for a phone. */
export function BookingDetailView({
	booking,
	payment,
	actions,
}: {
	booking: Booking;
	payment: BookingPayment | null | undefined;
	/** Buttons for this booking (confirm dialogs live in the screen). */
	actions: ReactNode;
}) {
	const styles = useStyles();
	const status = getDisplayStatus(booking);
	const start = dayjs(booking.startDate);
	const end = start.add(booking.hours || 0, "hour");
	const subtotal = (booking.rate || 0) * (booking.hours || 0);
	const hasPin = typeof booking.latitude === "number" && typeof booking.longitude === "number";
	// When the customer typed their own address, say where the pin is too.
	const pinAddress =
		booking.location?.customAddress && booking.location.formattedAddress !== booking.address
			? booking.location.formattedAddress
			: null;
	const provider = booking.providerId && typeof booking.providerId === "object" ? booking.providerId : null;
	const openMaps = () =>
		void Linking.openURL(
			`https://www.google.com/maps/search/?api=1&query=${booking.latitude},${booking.longitude}`,
		);

	return (
		<>
			<Panel flush>
				<View style={styles.hero}>
					<ServiceIcon serviceId={booking.service?.id} tile />
					<View style={styles.flex}>
						<View style={styles.titleRow}>
							<Text variant="subheading" accessibilityRole="header" style={styles.shrink}>
								{serviceName(booking.service?.id, booking.service?.name)}
							</Text>
							<BookingStatusPill status={status} />
						</View>
						<Text variant="ui" color="ink600">
							{HERO_TEXT[status]}
						</Text>
						{status === "cancelled" && booking.cancellationReason ? (
							<Text variant="ui" color="ink600">{`Reason: ${booking.cancellationReason}`}</Text>
						) : null}
					</View>
				</View>
				<View style={styles.grid}>
					<View style={styles.gridRow}>
						<Cell label="Date" value={formatDay(start)} />
						<Cell label="Start" value={formatTime(start)} right />
					</View>
					<View style={styles.gridRow}>
						<Cell label="Hours" value={String(booking.hours || 0)} top />
						<Cell label="Rate" value={`${formatMoney(booking.rate)}/hr`} right top />
					</View>
				</View>
				<View style={styles.where}>
					<ShiftRuler
						blocks={[
							{
								start: booking.startDate,
								hours: booking.hours || 1,
								// A shift that will not happen is drawn soft, not in focus.
								tone: status === "cancelled" || status === "expired" ? "soft" : "coral",
							},
						]}
					/>
					<View style={styles.address}>
						<Text variant="uiStrong" weight="bold">
							{booking.address}
						</Text>
						<Text variant="caption">
							{`${start.format("dddd D MMMM YYYY")}, ${formatTime(start)} to ${formatTime(end)}`}
						</Text>
						{pinAddress ? <Text variant="caption">{`Map pin: ${pinAddress}`}</Text> : null}
					</View>
				</View>
				{hasPin ? (
					<>
						<MapPreview
							point={{ latitude: booking.latitude ?? 0, longitude: booking.longitude ?? 0 }}
							height={140}
							onPress={openMaps}
							label="Open the location in Google Maps"
						/>
						<View style={styles.mapsLink}>
							<LinkButton onPress={openMaps}>Open in Google Maps</LinkButton>
						</View>
					</>
				) : null}
			</Panel>

			<Panel title="Price breakdown" actions={<PaymentPill payment={payment} />}>
				<SummaryRow label="Hourly rate" value={formatMoney(booking.rate)} />
				<SummaryRow label="Hours" value={String(booking.hours || 0)} />
				<SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
				<TotalRow amount={payment?.amount ?? subtotal} />
				{payment?.refundId && payment.refundAmount ? (
					<Text variant="small" style={styles.refund}>
						{`Refunded ${formatMoney(payment.refundAmount)}`}
					</Text>
				) : null}
			</Panel>

			<Panel title="Progress">
				<StatusTimeline
					status={status}
					hasProvider={!!booking.providerId}
					createdAt={booking.createdAt}
					startedAt={booking.startedAt}
					completedAt={booking.completedAt}
					cancelledAt={booking.cancelledAt}
				/>
			</Panel>

			<PersonPanel person={provider} bookingId={booking._id} />

			<Panel>
				<View style={styles.actions}>
					{actions}
					{booking.createdAt ? (
						<Text variant="caption">{`Booked ${formatDay(booking.createdAt)}, ${formatTime(booking.createdAt)}`}</Text>
					) : null}
				</View>
			</Panel>
		</>
	);
}

const useStyles = makeStyles(({ color }) => ({
	flex: { flex: 1 },
	shrink: { flexShrink: 1 },
	inline: { flexDirection: "row", alignItems: "center", gap: space[2] },
	hero: { flexDirection: "row", gap: space[3], padding: space[4], alignItems: "flex-start" },
	titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space[2], marginBottom: 2 },
	grid: { borderTopWidth: 1, borderTopColor: color.line },
	gridRow: { flexDirection: "row" },
	cell: { flex: 1, paddingHorizontal: space[4], paddingVertical: space[3], gap: 2 },
	cellRight: { borderLeftWidth: 1, borderLeftColor: color.line },
	cellTop: { borderTopWidth: 1, borderTopColor: color.line },
	where: { padding: space[4], gap: space[4], borderTopWidth: 1, borderTopColor: color.line },
	address: { gap: 2 },
	mapsLink: { paddingHorizontal: space[4], paddingVertical: space[1] },
	refund: { marginTop: space[2] },
	personStack: { gap: space[3] },
	person: { flexDirection: "row", alignItems: "center", gap: space[3] },
	emptyAvatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: color.canvas,
		borderWidth: 1,
		borderColor: color.line,
		alignItems: "center",
		justifyContent: "center",
	},
	actions: { gap: space[3] },
}));
