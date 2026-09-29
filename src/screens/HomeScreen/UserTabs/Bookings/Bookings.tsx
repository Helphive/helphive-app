import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Image } from "react-native";
import { Text } from "react-native-paper";
import CustomSnackbar from "../../../../components/CustomSnackbar";
import withAuthCheck from "../../../../hocs/withAuthCheck";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "../../../../utils/theme";
import { useGetUserBookingsQuery } from "../../../../features/user/userApiSlice";
import { selectBookingList } from "../../../../features/booking/bookingsListSlice";
import { useDispatch, useSelector } from "react-redux";
import BookingCard, { BookingTab } from "./components/BookingCard";
import SwipeTabs from "../../../../components/SwipeTabs";
import TabPageList from "../../../../components/TabPageList";
import { getDisplayStatus } from "../../../../utils/format";
import {
	setBookingId,
	setBookingInfo,
	setClientSecret,
	setPaymentIntentId,
	setPaymentStatus,
} from "../../../../features/booking/bookingSlice";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../utils/CustomTypes";

const vector1 = require("../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../assets/Logo/logo-light.png");

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
	const theme = useAppTheme();
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
		<SafeAreaView className="flex-1 " style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />
			<View className="flex flex-1">
				<View className="relative">
					<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
						<View className="flex flex-row justify-start items-center gap-2 min-h-[40px]">
							<Image source={logo} className="h-8 w-8" />
							<Text
								variant="titleLarge"
								style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
								className="text-left"
							>
								Bookings
							</Text>
						</View>
					</View>
					<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
				</View>
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
		</SafeAreaView>
	);
};

export default withAuthCheck(Bookings);
