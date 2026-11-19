import React, { useCallback, useRef, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/ui/paperTheme";
import services from "@/lib/services";
import { formatDateTime, formatMoney } from "@/lib/format";
import { providerApiSlice, useAcceptBookingMutation, useGetProviderBookingByIdQuery } from "@/features/provider/api";
import CustomSnackbar from "@/ui/legacy/CustomSnackbar";
import ActionBar from "@/features/bookings/details/ActionBar";
import DetailsSkeleton from "@/features/bookings/details/DetailsSkeleton";
import ErrorRetry from "@/features/bookings/details/ErrorRetry";
import { getDetailView } from "@/features/bookings/details/detailView";
import InfoCard from "@/features/bookings/details/InfoCard";
import InfoRow from "@/features/bookings/details/InfoRow";
import LocationMap from "@/features/bookings/details/LocationMap";
import PersonCard from "@/features/bookings/details/PersonCard";
import PriceBreakdown from "@/features/bookings/details/PriceBreakdown";
import { PAGE_BACKGROUND, SCREEN_PADDING, TEXT_STRONG } from "@/features/bookings/details/tokens";
import useConfirmedAction from "@/features/bookings/details/useConfirmedAction";
import { RootStackParamList } from "@/navigation/types";

const PLATFORM_FEE_RATE = 0.05;

const AcceptOrder = () => {
	const route = useRoute();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const insets = useSafeAreaInsets();
	const theme = useAppTheme();
	const { bookingId } = route.params as any;

	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [acceptBooking] = useAcceptBookingMutation();

	// Cached per booking: reopening shows the last result at once and refetches in the background.
	const { currentData, error, refetch } = useGetProviderBookingByIdQuery(
		{ bookingId },
		{ skip: !bookingId, refetchOnMountOrArgChange: true },
	);

	// The open-orders list already holds this booking (with the customer), so the first open can show it while the
	// details load. (Reads the cache only.)
	const { listed } = providerApiSlice.endpoints.getBookings.useQueryState(undefined, {
		selectFromResult: ({ data }) => ({
			listed: Array.isArray(data?.paidBookings)
				? data.paidBookings.find((b: any) => b?._id === bookingId)
				: undefined,
		}),
	});

	// Accepting removes the order from the open list; keep showing it while the screen closes instead of a skeleton.
	const lastShown = useRef<any>(null);
	const booking = currentData?.booking ?? listed ?? lastShown.current;
	lastShown.current = booking;

	const retry = useCallback(async () => {
		if (bookingId) await refetch();
	}, [bookingId, refetch]);

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

	const view = getDetailView({ booking, fresh: currentData, error });

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
			{view === "content" ? (
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
			) : view === "error" ? (
				<ErrorRetry error={error} onRetry={retry} />
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
