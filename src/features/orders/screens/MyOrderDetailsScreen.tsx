import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Button, ErrorState, Notice, Screen, ScreenHeader } from "@/ui";
import { ChatIcon, ReceiptIcon } from "@/ui/icons";
import { getErrorMessage } from "@/services/api/errors";
import { useAppSelector } from "@/store";
import { selectCurrentLocation } from "@/features/provider/slice";
import { providerApiSlice, useGetProviderBookingByIdQuery } from "@/features/provider/api";
import type { RootScreenProps } from "@/navigation/types";
import OrderDetailsView from "../components/OrderDetailsView";
import { describeDistance } from "../orderUtils";
import { isCounterparty } from "../types";
import { useOrderActions } from "../useOrderActions";
import { DetailsSkeleton } from "./AcceptOrderScreen";

const STATE_NOTICE = {
	awaiting_start_approval: { tone: "info", text: "Waiting for the customer to approve the job start." },
	in_progress: { tone: "info", text: "The job is under way. Complete it when the work is finished." },
	completed: { tone: "success", text: "This job has been completed." },
	cancelled: { tone: "error", text: "This order was cancelled." },
	expired: { tone: "warning", text: "This order expired before it started." },
} as const;

/** One of the provider's orders, with what they can do next. (Route name is in push payloads: keep it.) */
export default function MyOrderDetailsScreen({ navigation, route }: RootScreenProps<"MyOrderDetails">) {
	const { bookingId } = route.params;
	const position = useAppSelector(selectCurrentLocation);
	const { currentData, error, isFetching, refetch } = useGetProviderBookingByIdQuery(
		{ bookingId },
		{ refetchOnMountOrArgChange: true },
	);
	// My orders already holds this order (without the customer), so the first open can show it at once.
	const { listed } = providerApiSlice.endpoints.getMyOrders.useQueryState(undefined, {
		selectFromResult: ({ data }) => ({ listed: data?.find((b) => b._id === bookingId) }),
	});
	const booking = currentData?.booking ?? (error ? undefined : listed);
	const { status, available, ask, busy, dialog } = useOrderActions(booking);

	// An unassigned order (opened from a notification) is accepted on its own screen.
	const unassigned = !!currentData && !currentData.booking.providerId && currentData.booking.status === "pending";
	useEffect(() => {
		if (unassigned) navigation.replace("AcceptOrder", { bookingId });
	}, [unassigned, navigation, bookingId]);

	if (!booking || unassigned) {
		return (
			<Screen header={<ScreenHeader title="Order details" />}>
				{error ? (
					<>
						<ErrorState
							title="Could not load this order"
							message={getErrorMessage(error, "This order was not found. It may have been removed.")}
							onRetry={refetch}
							retrying={isFetching}
						/>
						<Button variant="secondary" onPress={() => navigation.navigate("MyOrders")}>
							My orders
						</Button>
					</>
				) : (
					<DetailsSkeleton />
				)}
			</Screen>
		);
	}

	const customer = isCounterparty(booking.userId) ? booking.userId : null;
	const notice = status && status in STATE_NOTICE ? STATE_NOTICE[status as keyof typeof STATE_NOTICE] : null;
	const primary = available.start ? (
		<Button style={styles.grow} onPress={() => ask("start")} disabled={busy}>
			Start job
		</Button>
	) : available.complete ? (
		<Button style={styles.grow} onPress={() => ask("complete")} disabled={busy}>
			Complete job
		</Button>
	) : null;

	return (
		<Screen
			header={<ScreenHeader title="Order details" />}
			refreshing={isFetching && !!currentData}
			onRefresh={refetch}
			footer={primary ?? undefined}
		>
			<OrderDetailsView
				booking={booking}
				distance={status === "completed" || status === "cancelled" ? null : describeDistance(position, booking)}
				showContact
				notice={notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
			>
				<View style={styles.actions}>
					{customer && status !== "cancelled" ? (
						<Button
							variant="secondary"
							icon={ChatIcon}
							onPress={() =>
								navigation.navigate("ProviderHome", {
									screen: "ChatTab",
									params: { uid: customer._id },
								})
							}
						>
							Message the customer
						</Button>
					) : null}
					{status === "completed" ? (
						<Button
							variant="secondary"
							icon={ReceiptIcon}
							onPress={() => navigation.navigate("Receipt", { bookingId })}
						>
							View receipt
						</Button>
					) : null}
					{available.cancel ? (
						<Button variant="text" onPress={() => ask("cancel")} disabled={busy}>
							Cancel order
						</Button>
					) : null}
				</View>
			</OrderDetailsView>
			{dialog}
		</Screen>
	);
}

const styles = StyleSheet.create({
	actions: { gap: 8 },
	grow: { flex: 1 },
});
