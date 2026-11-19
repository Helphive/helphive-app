import { color } from "@/ui/tokens";
import { useState, useEffect, useCallback, useMemo } from "react";
import { View } from "react-native";
import CustomSnackbar from "@/ui/legacy/CustomSnackbar";
import { useGetUserBookingsQuery } from "@/features/customer/api";
import { selectBookingList } from "@/features/bookings/listSlice";
import { useDispatch, useSelector } from "react-redux";
import BookingCard, { BookingTab } from "@/features/bookings/components/BookingCard";
import SwipeTabs from "@/ui/legacy/SwipeTabs";
import TabPageList from "@/ui/legacy/TabPageList";
import { getDisplayStatus } from "@/lib/format";
import {
	setBookingId,
	setBookingInfo,
	setClientSecret,
	setPaymentIntentId,
	setPaymentStatus,
} from "@/features/booking/slice";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/navigation/types";

const TABS: { key: BookingTab; label: string }[] = [
	{ key: "history", label: "History" },
	{ key: "active", label: "Active" },
	{ key: "scheduled", label: "Scheduled" },
];

const EMPTY: Record<BookingTab, { icon: any; title: string; message: string }> = {
	history: { icon: "history", title: "No past bookings", message: "Completed and cancelled bookings show up here." },
	active: {
		icon: "briefcase-clock-outline",
		title: "Nothing in progress",
		message: "Bookings that are underway appear here.",
	},
	scheduled: {
		icon: "calendar-blank-outline",
		title: "No upcoming bookings",
		message: "Schedule a service from the home tab.",
	},
};

const keyExtractor = (item: any, index: number) => item?._id ?? String(index);

const Bookings = () => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const dispatch = useDispatch();
	const [refreshing, setRefreshing] = useState(false);
	const [snackbarVisible, setSnackbarVisible] = useState(false);

	const { error, refetch, isLoading } = useGetUserBookingsQuery();
	const bookingsList = useSelector(selectBookingList);

	// Expired, never-accepted bookings belong in history even if the API still lists them as scheduled.
	const lists = useMemo<Record<BookingTab, any[]>>(() => {
		const scheduled = bookingsList?.scheduled ?? [];
		const expired = scheduled.filter((b: any) => getDisplayStatus(b) === "expired");
		const history = bookingsList?.history ?? [];
		const known = new Set(history.map((b: any) => b?._id));
		return {
			history: [...expired.filter((b: any) => !known.has(b?._id)), ...history],
			active: bookingsList?.active ?? [],
			scheduled: scheduled.filter((b: any) => getDisplayStatus(b) !== "expired"),
		};
	}, [bookingsList]);

	const tabsMeta = useMemo(() => TABS.map((t) => ({ ...t, count: lists[t.key].length })), [lists]);

	useEffect(() => {
		if (error) setSnackbarVisible(true);
	}, [error]);

	useFocusEffect(
		useCallback(() => {
			refetch();
		}, [refetch]),
	);

	useEffect(() => {
		const unsubscribe = navigation.addListener("tabPress" as never, () => {
			refetch();
		});
		return unsubscribe;
	}, [navigation, refetch]);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await refetch();
		} finally {
			setRefreshing(false);
		}
	}, [refetch]);

	const handleBookingPress = useCallback(
		(booking: any, tab: BookingTab) => {
			if (tab === "scheduled") {
				dispatch(setBookingInfo({ ...booking, startDate: booking.startDate, startTime: booking.startDate }));
				const firstPayment = booking.payments?.[0];
				if (firstPayment) {
					dispatch(setBookingId(booking._id));
					dispatch(setPaymentIntentId(firstPayment.paymentIntentId));
					dispatch(setClientSecret(firstPayment.clientSecret));
					dispatch(setPaymentStatus(firstPayment.status));
				}
				navigation.navigate("BookingPayment");
			} else {
				navigation.navigate("BookingDetails", { bookingId: booking?._id });
			}
		},
		[dispatch, navigation],
	);

	const renderPage = useCallback(
		(key: string) => {
			const tab = key as BookingTab;
			return (
				<TabPageList
					data={lists[tab]}
					keyExtractor={keyExtractor}
					renderItem={({ item }) => (
						<BookingCard booking={item} tab={tab} onPress={(b) => handleBookingPress(b, tab)} />
					)}
					refreshing={refreshing}
					onRefresh={handleRefresh}
					loading={isLoading}
					empty={EMPTY[tab]}
				/>
			);
		},
		[lists, refreshing, handleRefresh, isLoading, handleBookingPress],
	);

	return (
		<View style={{ flex: 1, backgroundColor: color.canvas }}>
			<View className="flex flex-1">
				<SwipeTabs tabs={tabsMeta} renderPage={renderPage} />
			</View>
			<CustomSnackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				action={{
					label: "Retry",
					onPress: () => {
						refetch();
					},
				}}
			>
				Failed to load bookings. Please try again.
			</CustomSnackbar>
		</View>
	);
};

export default Bookings;
