import React, { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../../../../utils/theme";
import services from "../../../../../utils/services";
import { formatDateTime, formatMoney } from "../../../../../utils/format";
import {
	useAcceptBookingMutation,
	useGetProviderBookingByIdMutation,
} from "../../../../../features/provider/providerApiSlice";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import ActionBar from "../../../../../components/details/ActionBar";
import DetailsSkeleton from "../../../../../components/details/DetailsSkeleton";
import ErrorRetry from "../../../../../components/details/ErrorRetry";
import InfoCard from "../../../../../components/details/InfoCard";
import InfoRow from "../../../../../components/details/InfoRow";
import LocationMap from "../../../../../components/details/LocationMap";
import PersonCard from "../../../../../components/details/PersonCard";
import PriceBreakdown from "../../../../../components/details/PriceBreakdown";
import { PAGE_BACKGROUND, SCREEN_PADDING, TEXT_STRONG } from "../../../../../components/details/tokens";
import useConfirmedAction from "../../../../../components/details/useConfirmedAction";
import { RootStackParamList } from "../../../../../utils/CustomTypes";

const PLATFORM_FEE_RATE = 0.05;

const AcceptOrder = () => {
	const route = useRoute();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const insets = useSafeAreaInsets();
	const theme = useAppTheme();
	const { bookingId } = route.params as any;

	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [booking, setBooking] = useState<any>(null);
	const [getProviderBookingById, { error }] = useGetProviderBookingByIdMutation();
	const [acceptBooking] = useAcceptBookingMutation();

	const load = useCallback(async () => {
		const result = await getProviderBookingById({ bookingId }).unwrap();
		setBooking(result.booking);
		return result;
	}, [bookingId, getProviderBookingById]);

	useEffect(() => {
		if (bookingId) load().catch((err) => console.error("Error fetching booking:", err));
	}, [bookingId, load]);

	const { ask, busyKey, dialog } = useConfirmedAction(async () => navigation.goBack(), setSnackbarMessage);

	const handleAccept = () =>
		ask({
			key: "accept",
			title: "Accept this booking?",
			message: "You will be committed to this job at the date and time shown.",
			buttonText: "Yes, accept",
			run: () => acceptBooking({ bookingId: booking._id }).unwrap(),
			errorMessage: "An error occurred while accepting the booking.",
			conflictMessage: "This order was already accepted by another provider.",
		});

	const serviceName =
		booking?.service?.name || services.find((s) => s.id === booking?.service?.id)?.name || "Service";
	const rate = Number(booking?.rate) || 0;
	const hours = Number(booking?.hours) || 0;
	const subtotal = rate * hours;
	const fee = subtotal * PLATFORM_FEE_RATE;

	return (
		<View style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}>
			<View
				style={{
					alignItems: "center",
					paddingTop: 10 + (Platform.OS === "android" ? insets.top : 0),
					paddingBottom: 12,
					backgroundColor: theme.colors.surface,
				}}
			>
				<View style={{ width: 48, height: 4, backgroundColor: "#D0D5DD", borderRadius: 2, marginBottom: 12 }} />
				<Text variant="titleLarge" style={{ fontFamily: theme.colors.fontBold, color: TEXT_STRONG }}>
					New booking request
				</Text>
			</View>
			{booking ? (
				<>
					<ScrollView
						contentContainerStyle={{ padding: SCREEN_PADDING, gap: 16 }}
						showsVerticalScrollIndicator={false}
					>
						<View>
							<Text style={{ fontFamily: theme.colors.fontBold, fontSize: 24, color: TEXT_STRONG }}>
								{serviceName}
							</Text>
							<Text style={{ color: theme.colors.bodyColor, marginTop: 2 }}>
								#{String(booking._id).slice(-6).toUpperCase()}
							</Text>
						</View>
						<InfoCard title="Details">
							<InfoRow
								icon="calendar-clock"
								label="Date and time"
								value={formatDateTime(booking.startDate)}
							/>
							<InfoRow
								icon="timer-outline"
								label="Duration"
								value={`${hours} ${hours === 1 ? "hour" : "hours"}`}
							/>
							<InfoRow icon="map-marker-outline" label="Address" value={booking.address} />
							<LocationMap
								latitude={booking.latitude}
								longitude={booking.longitude}
								address={booking.address}
							/>
						</InfoCard>
						<InfoCard title="Your earnings">
							<PriceBreakdown
								lines={[
									{ label: "Rate", value: `${formatMoney(rate)} / hour` },
									{ label: "Hours", value: String(hours) },
									{ label: "Subtotal", value: formatMoney(subtotal) },
									{ label: "Platform fee (5%)", value: `-${formatMoney(fee)}`, muted: true },
								]}
								totalLabel="You earn"
								total={subtotal - fee}
							/>
						</InfoCard>
						<PersonCard title="Customer" person={booking.userId} showActions={false} />
					</ScrollView>
					<ActionBar
						actions={[
							{
								label: "Decline",
								mode: "outlined",
								disabled: !!busyKey,
								onPress: () => navigation.goBack(),
							},
							{ label: "Accept", icon: "check", loading: busyKey === "accept", onPress: handleAccept },
						]}
					/>
				</>
			) : error ? (
				<ErrorRetry error={error} onRetry={() => load().catch(() => {})} />
			) : (
				<DetailsSkeleton />
			)}
			{dialog}
			<CustomSnackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage("")} duration={3000}>
				{snackbarMessage}
			</CustomSnackbar>
		</View>
	);
};

export default AcceptOrder;
