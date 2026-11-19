import { Button, PageTitle, color, space } from "@/ui";
import { OrdersIcon } from "@/ui/icons";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useAppTheme } from "@/ui/paperTheme";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useGetBookingsQuery } from "@/features/provider/api";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/navigation/types";
import OrderCard from "@/features/orders/components/OrderCard";
import TabPageList from "@/ui/legacy/TabPageList";
import CustomSnackbar from "@/ui/legacy/CustomSnackbar";

const keyExtractor = (item: any, index: number) => item?._id ?? String(index);

const Orders = () => {
	const theme = useAppTheme();
	const { data: bookings, refetch, isLoading, error } = useGetBookingsQuery();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const paidBookings = bookings?.paidBookings;
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await refetch();
		} finally {
			setRefreshing(false);
		}
	}, [refetch]);

	const handleOrderPress = useCallback(
		(booking: any) => navigation.navigate("AcceptOrder", { bookingId: booking._id }),
		[navigation],
	);
	const renderItem = useCallback(
		({ item }: { item: any }) => <OrderCard booking={item} onPress={handleOrderPress} />,
		[handleOrderPress],
	);

	useFocusEffect(
		useCallback(() => {
			refetch();
		}, [refetch]),
	);

	useEffect(() => {
		if (error) {
			setSnackbarVisible(true);
		}
	}, [error]);

	useEffect(() => {
		let isTabPressInProgress = false;

		const unsubscribe = navigation.addListener("tabPress" as never, async (_e: any) => {
			if (isTabPressInProgress) return;
			isTabPressInProgress = true;
			await refetch();
			isTabPressInProgress = false;
		});

		return unsubscribe;
	}, [navigation, refetch]);

	const handleMyOrdersPress = () => {
		navigation.navigate("MyOrders");
	};

	return (
		<View style={{ flex: 1, backgroundColor: color.canvas }}>
			<View style={{ padding: space[4], paddingBottom: space[2] }}>
				<PageTitle
					title="Available orders"
					actions={
						<Button size="sm" variant="secondary" icon={OrdersIcon} onPress={handleMyOrdersPress}>
							My orders
						</Button>
					}
				/>
			</View>
			<View className="flex flex-1">
				<View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
					<TabPageList
						data={Array.isArray(paidBookings) ? paidBookings : []}
						keyExtractor={keyExtractor}
						renderItem={renderItem}
						refreshing={refreshing}
						onRefresh={handleRefresh}
						loading={isLoading}
						empty={{
							icon: "clipboard-text-clock-outline",
							title: "No orders available",
							message: "Check back later for new orders.",
						}}
					/>
				</View>
				<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
					Failed to refresh bookings. Please try again.
				</CustomSnackbar>
			</View>
		</View>
	);
};

export default Orders;
