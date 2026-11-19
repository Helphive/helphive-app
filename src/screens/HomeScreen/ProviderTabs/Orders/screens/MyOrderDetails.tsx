import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { providerApiSlice, useGetProviderBookingByIdQuery } from "../../../../../features/provider/providerApiSlice";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import ActionBar from "../../../../../components/details/ActionBar";
import BookingDetailsBody from "../../../../../components/details/BookingDetailsBody";
import DetailsHeader from "../../../../../components/details/DetailsHeader";
import DetailsSkeleton from "../../../../../components/details/DetailsSkeleton";
import ErrorRetry from "../../../../../components/details/ErrorRetry";
import { getDetailView } from "../../../../../components/details/detailView";
import { PAGE_BACKGROUND } from "../../../../../components/details/tokens";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import useOrderActionBar from "../components/useOrderActionBar";

const MyOrderDetails = () => {
	const route = useRoute();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const { bookingId } = route.params as any;

	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	// Cached per booking: reopening shows the last result at once and refetches in the background.
	const { currentData, error, refetch } = useGetProviderBookingByIdQuery(
		{ bookingId },
		{ skip: !bookingId, refetchOnMountOrArgChange: true },
	);

	// My Orders already holds this order, so the first open can show it while the details load. (Reads the cache only.)
	const { listed } = providerApiSlice.endpoints.getMyOrders.useQueryState(undefined, {
		selectFromResult: ({ data }) => ({
			listed: Array.isArray(data) ? data.find((b: any) => b?._id === bookingId) : undefined,
		}),
	});

	const booking = currentData?.booking ?? listed;

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

	const { actions, hint, dialog } = useOrderActionBar(booking, refresh, setSnackbarMessage);

	const handleChat = () => navigation.navigate("ProviderHome", { screen: "ProviderTabsChat" });

	const view = getDetailView({ booking, fresh: currentData, error });

	return (
		<View style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}>
			<DetailsHeader title="Order details" />
			{view === "content" ? (
				<>
					<ScrollView
						contentContainerStyle={{ paddingBottom: 16 }}
						showsVerticalScrollIndicator={false}
						refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
					>
						<BookingDetailsBody booking={booking} role="provider" onChat={handleChat} />
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

export default MyOrderDetails;
