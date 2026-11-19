import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Button, EmptyState, ErrorState, ListSkeleton, Panel, Screen, ScreenHeader, SelectableTileGroup } from "@/ui";
import { AvailableOrdersIcon, OrdersIcon, SuccessIcon } from "@/ui/icons";
import { getErrorMessage } from "@/services/api/errors";
import { useGetMyOrdersQuery } from "@/features/provider/api";
import type { RootScreenProps } from "@/navigation/types";
import OrderCard from "../components/OrderCard";
import { orderTabOf, type OrderTab } from "../orderUtils";
import type { Booking } from "../types";

const TABS: { value: OrderTab; label: string }[] = [
	{ value: "active", label: "Active" },
	{ value: "completed", label: "Completed" },
	{ value: "cancelled", label: "Cancelled" },
];

const EMPTY: Record<OrderTab, { title: string; description: string }> = {
	active: { title: "No active orders", description: "Orders you accept appear here until they are completed." },
	completed: { title: "No completed orders", description: "Finished jobs appear here with their receipts." },
	cancelled: { title: "No cancelled orders", description: "Cancelled and expired orders appear here." },
};

/** The provider's accepted orders, split into active, completed and cancelled. */
export default function MyOrdersScreen({ navigation }: RootScreenProps<"MyOrders">) {
	const [tab, setTab] = useState<OrderTab>("active");
	const { data, error, isLoading, isFetching, refetch } = useGetMyOrdersQuery();

	useFocusEffect(
		useCallback(() => {
			refetch();
		}, [refetch]),
	);

	const lists = useMemo(() => {
		const out: Record<OrderTab, Booking[]> = { active: [], completed: [], cancelled: [] };
		for (const b of data ?? []) out[orderTabOf(b)].push(b);
		// Active soonest first; history most recent first.
		out.completed.reverse();
		out.cancelled.reverse();
		return out;
	}, [data]);

	const open = useCallback((b: Booking) => navigation.navigate("MyOrderDetails", { bookingId: b._id }), [navigation]);
	const shown = lists[tab];

	let body: React.ReactNode;
	if (isLoading) body = <ListSkeleton rows={4} />;
	else if (error && !data)
		body = (
			<ErrorState
				title="Could not load your orders"
				message={getErrorMessage(error, "Check your connection and try again.")}
				onRetry={refetch}
				retrying={isFetching}
			/>
		);
	else if (!shown.length)
		body = (
			<EmptyState
				icon={tab === "completed" ? SuccessIcon : OrdersIcon}
				title={EMPTY[tab].title}
				description={EMPTY[tab].description}
				action={
					tab === "active" ? (
						<Button
							variant="secondary"
							icon={AvailableOrdersIcon}
							onPress={() => navigation.navigate("ProviderHome", { screen: "OrdersTab" })}
						>
							Browse available orders
						</Button>
					) : undefined
				}
			/>
		);
	else
		body = (
			<Panel flush>
				{shown.map((b, i) => (
					<OrderCard key={b._id} first={i === 0} booking={b} onPress={open} showStatus />
				))}
			</Panel>
		);

	return (
		<Screen header={<ScreenHeader title="My orders" />} refreshing={isFetching && !isLoading} onRefresh={refetch}>
			<SelectableTileGroup
				accessibilityLabel="Order status"
				size="compact"
				columns={3}
				value={tab}
				onChange={setTab}
				options={TABS.map((t) => ({
					value: t.value,
					title: isLoading ? t.label : `${t.label} ${lists[t.value].length}`,
				}))}
			/>
			{body}
		</Screen>
	);
}
