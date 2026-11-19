import React, { useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Button, EmptyState, ErrorState, ListSkeleton, PageTitle, Panel, Screen } from "@/ui";
import { AvailableOrdersIcon, OrdersIcon } from "@/ui/icons";
import { getErrorMessage } from "@/services/api/errors";
import { useAppSelector } from "@/store";
import { selectCurrentLocation } from "@/features/provider/slice";
import { useGetBookingsQuery } from "@/features/provider/api";
import OrderCard from "../components/OrderCard";
import { describeDistance } from "../orderUtils";
import type { Booking } from "../types";

/** Orders tab: open orders the provider can accept, soonest first. */
export default function OpenOrdersScreen() {
	const navigation = useNavigation();
	const position = useAppSelector(selectCurrentLocation);
	const { data, error, isLoading, isFetching, refetch } = useGetBookingsQuery();
	const orders = data?.paidBookings ?? [];

	// Fresh on every visit: open orders come and go quickly.
	useFocusEffect(
		useCallback(() => {
			refetch();
		}, [refetch]),
	);

	const open = useCallback((b: Booking) => navigation.navigate("AcceptOrder", { bookingId: b._id }), [navigation]);

	let body: React.ReactNode;
	if (isLoading) body = <ListSkeleton rows={4} />;
	else if (error && !data)
		body = (
			<ErrorState
				title="Could not load available orders"
				message={getErrorMessage(error, "Check your connection and try again.")}
				onRetry={refetch}
				retrying={isFetching}
			/>
		);
	else if (!orders.length)
		body = (
			<EmptyState
				icon={AvailableOrdersIcon}
				title="No open orders right now"
				description="New orders for your services appear here as customers book them. Check that your services are switched on."
				action={
					<Button
						variant="secondary"
						onPress={() => navigation.navigate("ProviderHome", { screen: "HomeTab" })}
					>
						Review my services
					</Button>
				}
			/>
		);
	else
		body = (
			<Panel
				title="Open orders"
				subtitle={`${orders.length} ${orders.length === 1 ? "order" : "orders"} you can accept, soonest first`}
				flush
			>
				{orders.map((b, i) => (
					<OrderCard
						key={b._id}
						first={i === 0}
						booking={b}
						onPress={open}
						distance={describeDistance(position, b)}
					/>
				))}
			</Panel>
		);

	return (
		<Screen inTabs refreshing={isFetching && !isLoading} onRefresh={refetch}>
			<PageTitle
				title="Available orders"
				subtitle="Jobs near you that fit your services"
				actions={
					<Button
						size="sm"
						variant="secondary"
						icon={OrdersIcon}
						onPress={() => navigation.navigate("MyOrders")}
					>
						My orders
					</Button>
				}
			/>
			{body}
		</Screen>
	);
}
