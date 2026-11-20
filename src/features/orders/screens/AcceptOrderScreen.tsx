import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, ConfirmDialog, ErrorState, Notice, Screen, ScreenHeader, Skeleton, Text, space, useToast } from "@/ui";
import { formatMoney } from "@/lib/format";
import { getErrorMessage, getErrorStatus } from "@/services/api/errors";
import { useAppSelector } from "@/store";
import { selectCurrentLocation } from "@/features/provider/slice";
import { providerApiSlice, useAcceptBookingMutation, useGetProviderBookingByIdQuery } from "@/features/provider/api";
import type { RootScreenProps } from "@/navigation/types";
import OrderDetailsView, { InfoRow } from "../components/OrderDetailsView";
import { describeDistance, formatDay, orderEarnings, timeRange } from "../orderUtils";
import type { Booking } from "../types";

/** Loading placeholder shaped like the details: header, then panels. */
export function DetailsSkeleton() {
	return (
		<View accessibilityRole="progressbar" accessibilityLabel="Loading order" style={styles.skeleton}>
			<Skeleton width="60%" height={24} />
			<Skeleton height={120} radius={10} />
			<Skeleton height={96} radius={10} />
			<Skeleton height={120} radius={10} />
		</View>
	);
}

/** An open order: review the job and the pay, then accept it. (Route name is in push payloads: keep it.) */
export default function AcceptOrderScreen({ navigation, route }: RootScreenProps<"AcceptOrder">) {
	const { bookingId } = route.params;
	const toast = useToast();
	const position = useAppSelector(selectCurrentLocation);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [acceptBooking, { isLoading: accepting }] = useAcceptBookingMutation();
	const { currentData, error, isFetching, refetch } = useGetProviderBookingByIdQuery(
		{ bookingId },
		{ refetchOnMountOrArgChange: true },
	);
	// The open-orders list already holds this order, so the first open can show it while the details load.
	const { listed } = providerApiSlice.endpoints.getBookings.useQueryState(undefined, {
		selectFromResult: ({ data }) => ({ listed: data?.paidBookings?.find((b) => b._id === bookingId) }),
	});
	// Accepting drops the order from the list; keep showing it while the screen closes.
	const lastShown = useRef<Booking | undefined>(undefined);
	const booking = currentData?.booking ?? (error ? undefined : listed) ?? lastShown.current;
	lastShown.current = booking;

	// Already assigned (to this provider): its page is My order details.
	const assigned = !!booking?.providerId && !accepting;
	useEffect(() => {
		if (assigned && currentData) navigation.replace("MyOrderDetails", { bookingId });
	}, [assigned, currentData, navigation, bookingId]);

	const accept = async () => {
		try {
			await acceptBooking({ bookingId }).unwrap();
			setConfirmOpen(false);
			toast.success("Order accepted");
			navigation.replace("MyOrderDetails", { bookingId });
		} catch (err) {
			setConfirmOpen(false);
			toast.error(getErrorMessage(err, "Could not accept the order. Try again."));
		}
	};

	const header = <ScreenHeader title="Available order" />;

	if (!booking) {
		if (error) {
			const taken = getErrorStatus(error) === 409;
			return (
				<Screen header={header}>
					<ErrorState
						title={taken ? "This order was taken" : "Could not load this order"}
						message={getErrorMessage(error, "This order was not found. It may have been removed.")}
						onRetry={taken ? undefined : refetch}
						retrying={isFetching}
					/>
					<Button
						variant="secondary"
						onPress={() => navigation.navigate("ProviderHome", { screen: "OrdersTab" }, { pop: true })}
					>
						Available orders
					</Button>
				</Screen>
			);
		}
		return (
			<Screen header={header}>
				<DetailsSkeleton />
			</Screen>
		);
	}

	const canAccept = !booking.providerId && booking.status === "pending";
	return (
		<Screen
			header={header}
			refreshing={isFetching && !!currentData}
			onRefresh={refetch}
			footer={
				canAccept ? (
					<View style={styles.footer}>
						<Button fullWidth onPress={() => setConfirmOpen(true)} disabled={accepting}>
							Accept order
						</Button>
						<Text variant="caption" align="center">
							Accepting commits you to arrive at the scheduled time.
						</Text>
					</View>
				) : undefined
			}
		>
			<OrderDetailsView
				booking={booking}
				distance={describeDistance(position, booking)}
				notice={
					canAccept ? (
						<Text variant="body" color="ink600">
							Review the job and your pay before you accept.
						</Text>
					) : (
						<Notice tone="info">
							This order can no longer be accepted. Browse available orders for other jobs.
						</Notice>
					)
				}
			/>
			<ConfirmDialog
				visible={confirmOpen}
				title="Accept this order?"
				description="You are committing to complete this job at the scheduled time."
				confirmLabel="Accept order"
				cancelLabel="Not now"
				loading={accepting}
				onConfirm={accept}
				onClose={() => setConfirmOpen(false)}
			>
				<View style={styles.summary}>
					<InfoRow label="Date" value={formatDay(booking.startDate)} />
					<InfoRow label="Time" value={timeRange(booking)} />
					<InfoRow label="You earn" value={formatMoney(orderEarnings(booking))} />
				</View>
			</ConfirmDialog>
		</Screen>
	);
}

const styles = StyleSheet.create({
	skeleton: { gap: space[5] },
	footer: { flex: 1, gap: space[2] },
	summary: { gap: space[2] },
});
