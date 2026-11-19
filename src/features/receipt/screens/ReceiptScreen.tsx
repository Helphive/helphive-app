import React from "react";
import { Share, StyleSheet, View } from "react-native";
import { Button, ErrorState, Panel, Screen, ScreenHeader, Skeleton, space, useToast } from "@/ui";
import { ShareIcon } from "@/ui/icons";
import { getErrorMessage } from "@/services/api/errors";
import type { RootScreenProps } from "@/navigation/types";
import { useGetBookingReceiptQuery } from "../api";
import { ReceiptBody } from "../components/ReceiptBody";
import { buildReceiptText } from "../components/receiptText";

/** A booking's receipt, for the customer and the provider. Shared as plain text through the system share sheet. */
export default function ReceiptScreen({ route }: RootScreenProps<"Receipt">) {
	const { bookingId } = route.params;
	const toast = useToast();
	const { data, error, isLoading, isFetching, refetch } = useGetBookingReceiptQuery(bookingId, {
		refetchOnMountOrArgChange: true,
	});
	const receipt = data?.receipt;

	const share = async () => {
		if (!receipt) return;
		try {
			await Share.share({
				title: `HelpHive receipt ${receipt.receiptNumber}`,
				message: buildReceiptText(receipt),
			});
		} catch {
			toast.error("Could not open the share sheet. Try again.");
		}
	};

	if (receipt) {
		return (
			<Screen
				header={<ScreenHeader title="Receipt" />}
				refreshing={isFetching}
				onRefresh={() => void refetch()}
				footer={
					<Button icon={ShareIcon} onPress={() => void share()} style={styles.flex}>
						Share receipt
					</Button>
				}
			>
				<ReceiptBody receipt={receipt} />
			</Screen>
		);
	}

	return (
		<Screen header={<ScreenHeader title="Receipt" />}>
			{isLoading ? (
				<Panel>
					<View
						accessibilityRole="progressbar"
						accessibilityLabel="Loading the receipt"
						style={styles.skeleton}
					>
						<Skeleton width="40%" height={22} />
						<Skeleton width="25%" />
						<Skeleton height={110} radius={10} />
						<Skeleton height={150} radius={10} />
					</View>
				</Panel>
			) : (
				<ErrorState
					title="Could not load this receipt"
					message={getErrorMessage(error, "Something went wrong on our side. Try again in a moment.")}
					onRetry={() => void refetch()}
					retrying={isFetching}
				/>
			)}
		</Screen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	skeleton: { gap: space[3] },
});
