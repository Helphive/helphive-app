import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Share, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useGetBookingReceiptQuery } from "../../features/receipt/receiptApiSlice";
import ActionBar from "../../components/details/ActionBar";
import DetailsHeader from "../../components/details/DetailsHeader";
import ErrorRetry from "../../components/details/ErrorRetry";
import { PAGE_BACKGROUND, SCREEN_PADDING } from "../../components/details/tokens";
import CustomSnackbar from "../../components/CustomSnackbar";
import ReceiptBody from "../../components/receipt/ReceiptBody";
import ReceiptSkeleton from "../../components/receipt/ReceiptSkeleton";
import { buildReceiptText } from "../../components/receipt/receiptText";

const ReceiptScreen = () => {
	const route = useRoute();
	const { bookingId } = route.params as { bookingId: string };
	const { data, error, isLoading, isFetching, refetch } = useGetBookingReceiptQuery(bookingId, {
		refetchOnMountOrArgChange: true,
	});
	const [snackbarMessage, setSnackbarMessage] = useState("");

	const receipt = data?.receipt;

	const handleShare = useCallback(async () => {
		if (!receipt) return;
		try {
			await Share.share({
				title: `HelpHive receipt ${receipt.receiptNumber}`,
				message: buildReceiptText(receipt),
			});
		} catch (err) {
			console.error("Error sharing receipt:", err);
			setSnackbarMessage("Could not open the share sheet.");
		}
	}, [receipt]);

	return (
		<View style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}>
			<DetailsHeader title="Receipt" />
			{receipt ? (
				<>
					<ScrollView
						contentContainerStyle={{ padding: SCREEN_PADDING }}
						showsVerticalScrollIndicator={false}
						refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
					>
						<ReceiptBody receipt={receipt} />
					</ScrollView>
					<ActionBar actions={[{ label: "Share receipt", icon: "share-variant", onPress: handleShare }]} />
				</>
			) : isLoading ? (
				<ReceiptSkeleton />
			) : (
				<ErrorRetry error={error} onRetry={refetch} />
			)}
			<CustomSnackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage("")} duration={3000}>
				{snackbarMessage}
			</CustomSnackbar>
		</View>
	);
};

export default ReceiptScreen;
