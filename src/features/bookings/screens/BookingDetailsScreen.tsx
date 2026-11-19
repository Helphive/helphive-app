import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSelector } from "react-redux";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useGetBookingByIdQuery } from "@/features/customer/api";
import { selectBookingList } from "@/features/bookings/listSlice";
import CustomSnackbar from "@/ui/legacy/CustomSnackbar";
import ActionBar from "@/features/bookings/details/ActionBar";
import BookingDetailsBody from "@/features/bookings/details/BookingDetailsBody";
import DetailsHeader from "@/features/bookings/details/DetailsHeader";
import DetailsSkeleton from "@/features/bookings/details/DetailsSkeleton";
import ErrorRetry from "@/features/bookings/details/ErrorRetry";
import { getDetailView } from "@/features/bookings/details/detailView";
import { PAGE_BACKGROUND } from "@/features/bookings/details/tokens";
import { RootStackParamList } from "@/navigation/types";
import useBookingActionBar from "@/features/bookings/components/useBookingActionBar";

const BookingDetails = () => {
	const route = useRoute();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const { bookingId } = route.params as any;

	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	// Cached per booking: reopening shows the last result at once and refetches in the background.
	const { currentData, error, refetch } = useGetBookingByIdQuery(
		{ bookingId },
		{ skip: !bookingId, refetchOnMountOrArgChange: true },
	);

	// The bookings list already holds this booking, so the first open can show it while the details load.
	const listed = useSelector((state: any) => {
		const list = selectBookingList(state);
		return [list?.active, list?.scheduled, list?.history]
			.flatMap((bookings) => bookings ?? [])
			.find((b: any) => b?._id === bookingId);
	});

	const booking = currentData?.booking ?? listed;
	const payment = currentData?.payment;

	const refresh = useCallback(async () => {
		if (bookingId) await refetch();
	}, [bookingId, refetch]);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await refresh();
		} finally {
			setRefreshing(false);
		}
	}, [refresh]);

	const { actions, hint, dialog } = useBookingActionBar(booking, refresh, setSnackbarMessage);

	const handleChat = () => navigation.navigate("CustomerHome", { screen: "ChatTab" });

	const view = getDetailView({ booking, fresh: currentData, error });

	return (
		<View style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}>
			<DetailsHeader title="Booking details" />
			{view === "content" ? (
				<>
					<ScrollView
						contentContainerStyle={{ paddingBottom: 16 }}
						showsVerticalScrollIndicator={false}
						refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
					>
						<BookingDetailsBody booking={booking} payment={payment} role="user" onChat={handleChat} />
					</ScrollView>
					<ActionBar actions={actions} hint={hint} />
				</>
			) : view === "error" ? (
				<ErrorRetry error={error} onRetry={refresh} />
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

export default BookingDetails;
