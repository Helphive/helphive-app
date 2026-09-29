import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../utils/CustomTypes";
import services from "../../utils/services";
import { DisplayStatus, formatDateTime, formatMoney, getDisplayStatus } from "../../utils/format";
import { useAppTheme } from "../../utils/theme";
import InfoCard from "./InfoCard";
import InfoRow from "./InfoRow";
import LocationMap from "./LocationMap";
import PersonCard from "./PersonCard";
import PriceBreakdown, { PriceLine } from "./PriceBreakdown";
import StatusHero from "./StatusHero";
import Timeline from "./Timeline";
import { buildBookingTimeline } from "./bookingTimeline";
import { SCREEN_PADDING } from "./tokens";

const PLATFORM_FEE_RATE = 0.05;

type Props = {
	booking: any;
	payment?: any;
	role: "user" | "provider";
	onChat?: () => void;
};

// Shared read-only body for the customer booking screen and the provider order screen.
const BookingDetailsBody = ({ booking, payment, role, onChat }: Props) => {
	const theme = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const isProvider = role === "provider";

	const status: DisplayStatus = getDisplayStatus(booking);
	const serviceName = booking.service?.name || services.find((s) => s.id === booking.service?.id)?.name || "Service";
	const counterpart = isProvider ? booking.userId : booking.providerId;
	const active = booking.status === "pending" || booking.status === "in progress";

	const rate = Number(booking.rate) || 0;
	const hours = Number(booking.hours) || 0;
	const subtotal = rate * hours;
	const fee = subtotal * PLATFORM_FEE_RATE;

	const lines: PriceLine[] = [
		{ label: "Rate", value: `${formatMoney(rate)} / hour` },
		{ label: "Hours", value: String(hours) },
		{ label: "Subtotal", value: formatMoney(subtotal) },
	];
	if (isProvider) lines.push({ label: "Platform fee (5%)", value: `-${formatMoney(fee)}`, muted: true });

	return (
		<View style={{ padding: SCREEN_PADDING, gap: 16 }}>
			<StatusHero
				status={status}
				title={serviceName}
				date={booking.startDate}
				reference={`#${String(booking._id).slice(-6).toUpperCase()}`}
			/>

			<InfoCard title="Details">
				<InfoRow icon="calendar-clock" label="Date and time" value={formatDateTime(booking.startDate)} />
				<InfoRow icon="timer-outline" label="Duration" value={`${hours} ${hours === 1 ? "hour" : "hours"}`} />
				<InfoRow icon="map-marker-outline" label="Address" value={booking.address} />
				<LocationMap latitude={booking.latitude} longitude={booking.longitude} address={booking.address} />
			</InfoCard>

			<InfoCard title="Progress">
				<Timeline
					steps={buildBookingTimeline({
						status: booking.status,
						createdAt: booking.createdAt,
						hasProvider: !!booking.providerId,
						startedAt: booking.startedAt,
						completedAt: booking.completedAt,
						cancelledAt: booking.cancelledAt,
						cancellationReason: booking.cancellationReason,
						expired: status === "expired",
					})}
				/>
			</InfoCard>

			<PersonCard
				title={isProvider ? "Customer" : "Your provider"}
				person={counterpart}
				showActions={active}
				onChat={active ? onChat : undefined}
			/>

			<InfoCard title={isProvider ? "Your earnings" : "Price details"}>
				<PriceBreakdown
					lines={lines}
					totalLabel={isProvider ? "You earn" : "Total"}
					total={isProvider ? subtotal - fee : subtotal}
				/>
			</InfoCard>

			{!!payment?.refundId && (
				<InfoCard title="Refund">
					<PriceBreakdown
						lines={[
							{ label: "Status", value: capitalize(payment.refundStatus) },
							{ label: "Requested", value: formatDateTime(payment.refundCreated) },
						]}
						totalLabel="Refund amount"
						total={Number(payment.refundAmount) || 0}
					/>
				</InfoCard>
			)}

			<Button
				mode="outlined"
				icon="receipt-text-outline"
				onPress={() => navigation.navigate("Receipt", { bookingId: String(booking._id) })}
				textColor={theme.colors.onSurface}
				labelStyle={{ fontFamily: theme.colors.fontSemiBold }}
			>
				View receipt
			</Button>
		</View>
	);
};

const capitalize = (value?: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "—");

export default BookingDetailsBody;
