import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useGetProviderBookingByIdMutation } from "../../../../../features/provider/providerApiSlice";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import ActionBar from "../../../../../components/details/ActionBar";
import BookingDetailsBody from "../../../../../components/details/BookingDetailsBody";
import DetailsHeader from "../../../../../components/details/DetailsHeader";
import DetailsSkeleton from "../../../../../components/details/DetailsSkeleton";
import ErrorRetry from "../../../../../components/details/ErrorRetry";
import { PAGE_BACKGROUND } from "../../../../../components/details/tokens";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import useOrderActionBar from "../components/useOrderActionBar";

const MyOrderDetails = () => {
	const route = useRoute();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const { bookingId } = route.params as any;

	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [getProviderBookingById, { error, isLoading }] = useGetProviderBookingByIdMutation();

	const [snapshot, setSnapshot] = useState<any>(null);
	const booking = snapshot?.booking;

	// Keep the last successful response so refreshes after an action do not flash the skeleton.
	const load = useCallback(async () => {
		const result = await getProviderBookingById({ bookingId }).unwrap();
		setSnapshot(result);
		return result;
	}, [bookingId, getProviderBookingById]);

	useEffect(() => {
		if (bookingId) load().catch((err) => console.error("Error fetching booking:", err));
	}, [bookingId, load]);

	const { actions, hint, dialog } = useOrderActionBar(booking, load, setSnackbarMessage);

	const handleChat = () => navigation.navigate("ProviderHome", { screen: "ProviderTabsChat" });

	return (
		<View style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}>
			<DetailsHeader title="Order details" />
			{booking ? (
				<>
					<ScrollView
						contentContainerStyle={{ paddingBottom: 16 }}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl refreshing={isLoading} onRefresh={() => load().catch(() => {})} />
						}
					>
						<BookingDetailsBody booking={booking} role="provider" onChat={handleChat} />
					</ScrollView>
					<ActionBar actions={actions} hint={hint} />
				</>
			) : error ? (
				<ErrorRetry error={error} onRetry={() => load().catch(() => {})} />
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

export default MyOrderDetails;
