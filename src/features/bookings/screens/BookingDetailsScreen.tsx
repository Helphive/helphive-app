import React from "react";
import { StyleSheet, View } from "react-native";
import { ErrorState, Notice, Panel, Screen, ScreenHeader, Skeleton, ListSkeleton, Text, space } from "@/ui";
import { getErrorMessage, getErrorStatus } from "@/services/api/errors";
import { useAppSelector } from "@/store";
import type { RootScreenProps } from "@/navigation/types";
import { useGetBookingByIdQuery } from "@/features/customer/api";
import { selectListedBooking } from "../listSlice";
import { BookingDetailView } from "../components/BookingDetailView";
import { useBookingActions } from "../useBookingActions";

/** One booking for the customer (route name is part of the push contract: do not rename). */
export default function BookingDetailsScreen({ route }: RootScreenProps<"BookingDetails">) {
	const { bookingId } = route.params;
	// Cached per booking: reopening shows the last result at once and refetches in the background.
	const { currentData, error, isFetching, refetch } = useGetBookingByIdQuery(
		{ bookingId },
		{ refetchOnMountOrArgChange: true },
	);
	// The bookings list already holds this booking, so the first open can show it while the details load.
	const listed = useAppSelector(selectListedBooking(bookingId));
	const booking = currentData?.booking ?? listed;
	const payment = currentData?.payment;
	const { primary, secondary, dialog } = useBookingActions(booking, payment);

	// The server said no (403, 404...): that wins over a list copy. A network error keeps what is shown.
	const refused = !currentData && typeof getErrorStatus(error) === "number";
	const reference = booking ? `Booking ${booking._id.slice(-6).toUpperCase()}` : "Booking details";

	if (refused || (!booking && error)) {
		return (
			<Screen header={<ScreenHeader title="Booking details" />}>
				<ErrorState
					title="Could not load this booking"
					message={getErrorMessage(error, "This booking was not found. It may have been removed.")}
					onRetry={() => void refetch()}
					retrying={isFetching}
				/>
			</Screen>
		);
	}

	if (!booking) {
		return (
			<Screen header={<ScreenHeader title="Booking details" />}>
				<View accessibilityRole="progressbar" accessibilityLabel="Loading the booking" style={styles.stack}>
					<Panel>
						<View style={styles.stack}>
							<Skeleton width="55%" height={20} />
							<Skeleton width="80%" />
							<Skeleton height={30} radius={6} />
						</View>
					</Panel>
					<ListSkeleton rows={3} />
				</View>
			</Screen>
		);
	}

	return (
		<Screen
			header={<ScreenHeader title={reference} />}
			refreshing={isFetching && !!currentData}
			onRefresh={() => void refetch()}
			footer={primary ? <View style={styles.footer}>{primary}</View> : undefined}
		>
			{error && !currentData ? (
				<Notice tone="warning" title="Showing saved details">
					{getErrorMessage(error, "Could not refresh this booking.")}
				</Notice>
			) : null}
			{!currentData && !error ? (
				<Text variant="caption" accessibilityLiveRegion="polite">
					Loading the latest details
				</Text>
			) : null}
			<BookingDetailView booking={booking} payment={payment} actions={secondary} />
			{dialog}
		</Screen>
	);
}

const styles = StyleSheet.create({
	stack: { gap: space[3] },
	footer: { flex: 1 },
});
