import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
	Button,
	EmptyState,
	ErrorState,
	ListSkeleton,
	Notice,
	PageTitle,
	Panel,
	Screen,
	Text,
	space,
	makeStyles,
} from "@/ui";
import { BookingsIcon } from "@/ui/icons";
import { getDisplayStatus } from "@/lib/format";
import { getErrorMessage } from "@/services/api/errors";
import type { CustomerTabProps } from "@/navigation/types";
import { useGetUserBookingsQuery } from "@/features/customer/api";
import type { Booking } from "@/features/customer/types";
import { BookingCard } from "../components/BookingCard";
import { ListTabs } from "../components/ListTabs";

type Tab = "active" | "scheduled" | "history";

const TABS: { key: Tab; label: string }[] = [
	{ key: "active", label: "Active" },
	{ key: "scheduled", label: "Scheduled" },
	{ key: "history", label: "History" },
];

const COPY: Record<Tab, { title: string; empty: string; hint: string }> = {
	active: {
		title: "Active bookings",
		empty: "No active bookings",
		hint: "Bookings a provider has accepted will show up here.",
	},
	scheduled: {
		title: "Scheduled bookings",
		empty: "Nothing scheduled",
		hint: "Bookings waiting for a provider to accept them will show up here.",
	},
	history: {
		title: "Booking history",
		empty: "No booking history yet",
		hint: "Completed, cancelled and expired bookings will show up here.",
	},
};

const PAGE_SIZE = 20;

/** By what the customer sees: expired bookings go to history even while the API still lists them as scheduled. */
const bucketOf = (b: Booking): Tab => {
	const s = getDisplayStatus(b);
	if (s === "completed" || s === "cancelled" || s === "expired") return "history";
	return s === "scheduled" ? "scheduled" : "active";
};

/** Customer bookings in three tabs (the web's "Your bookings"). */
export default function BookingsScreen({ navigation, route }: CustomerTabProps<"BookingsTab">) {
	const styles = useStyles();
	const root = useNavigation();
	const [tab, setTab] = useState<Tab>(route.params?.tab ?? "active");
	const [visible, setVisible] = useState(PAGE_SIZE);
	const { data, error, isLoading, isFetching, refetch } = useGetUserBookingsQuery();

	useEffect(() => {
		if (route.params?.tab) setTab(route.params.tab);
	}, [route.params?.tab]);
	useEffect(() => setVisible(PAGE_SIZE), [tab]);
	useFocusEffect(
		useCallback(() => {
			void refetch();
		}, [refetch]),
	);

	const buckets = useMemo(() => {
		const out: Record<Tab, Booking[]> = { active: [], scheduled: [], history: [] };
		if (!data) return out;
		const seen = new Set<string>();
		for (const b of [...data.active, ...data.scheduled, ...data.history]) {
			if (seen.has(b._id)) continue;
			seen.add(b._id);
			out[bucketOf(b)].push(b);
		}
		const byStartDesc = (a: Booking, b: Booking) => b.startDate.localeCompare(a.startDate);
		out.active.sort(byStartDesc);
		out.scheduled.sort(byStartDesc);
		out.history.sort(byStartDesc);
		return out;
	}, [data]);

	const open = useCallback((b: Booking) => root.navigate("BookingDetails", { bookingId: b._id }), [root]);

	const list = buckets[tab];
	const copy = COPY[tab];
	const shown = list.slice(0, visible);

	return (
		<Screen inTabs refreshing={isFetching && !isLoading} onRefresh={() => void refetch()}>
			<PageTitle title="Your bookings" subtitle="Track bookings from request to completion." />
			<ListTabs
				tabs={TABS.map((t) => ({ ...t, count: data ? buckets[t.key].length : undefined }))}
				value={tab}
				onChange={setTab}
			/>

			{isLoading ? (
				<ListSkeleton rows={3} />
			) : !data ? (
				<ErrorState
					title="Could not load your bookings"
					message={getErrorMessage(error, "Something went wrong on our side. Try again in a moment.")}
					onRetry={() => void refetch()}
					retrying={isFetching}
				/>
			) : (
				<>
					{error && !isFetching ? (
						<Notice tone="warning" title="Showing the last list">
							{getErrorMessage(error, "Could not refresh your bookings.")}
						</Notice>
					) : null}
					<Panel
						title={copy.title}
						flush
						actions={
							list.length > 0 ? (
								<Text variant="small">{`${list.length} ${list.length === 1 ? "booking" : "bookings"}`}</Text>
							) : undefined
						}
					>
						{list.length === 0 ? (
							<EmptyState
								bare
								icon={BookingsIcon}
								title={copy.empty}
								description={copy.hint}
								action={<Button onPress={() => navigation.navigate("BookTab")}>Book a service</Button>}
							/>
						) : (
							<>
								{shown.map((b, i) => (
									<BookingCard key={b._id} booking={b} first={i === 0} onPress={open} />
								))}
								{list.length > shown.length ? (
									<View style={styles.more}>
										<Button variant="text" onPress={() => setVisible((v) => v + PAGE_SIZE)}>
											Show more
										</Button>
									</View>
								) : null}
							</>
						)}
					</Panel>
				</>
			)}
		</Screen>
	);
}

const useStyles = makeStyles(({ color }) => ({
	more: { borderTopWidth: 1, borderTopColor: color.line, padding: space[2], alignItems: "center" },
}));
