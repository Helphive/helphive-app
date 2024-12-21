import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, View, RefreshControl, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import withAuthCheck from "../../../../hocs/withAuthCheck";
import { useAppTheme } from "../../../../utils/theme";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useGetBookingsQuery } from "../../../../features/provider/providerApiSlice";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../utils/CustomTypes";
import OrderCard from "./components/OrderCard";
import CustomSnackbar from "../../../../components/CustomSnackbar";

const vector1 = require("../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../assets/Logo/logo-light.png");
const filterIcon = require("../../../../../assets/icons/filter.png");

const Orders = () => {
	const theme = useAppTheme();
	const { data: bookings, refetch, isFetching, error } = useGetBookingsQuery();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const paidBookings = bookings?.paidBookings;
	const scrollViewRef = useRef<ScrollView>(null);
	const [snackbarVisible, setSnackbarVisible] = useState(false);

	useFocusEffect(
		useCallback(() => {
			refetch();
			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
			isTabPressInProgress = false;
		});

		return unsubscribe;
	}, [navigation, refetch]);

	const handleMyOrdersPress = () => {
		navigation.navigate("MyOrders");
	};

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />

			<View className="flex flex-1">
				<View className="relative">
					<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
						<View className="flex flex-row justify-between items-center gap-2 min-h-[40px] w-full">
							<View className="flex-row justify-start">
								<Image source={logo} className="h-8 w-8 mr-2" />
								<Text
									variant="titleLarge"
									style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
									className="text-left"
								>
									Orders
								</Text>
							</View>
							<TouchableOpacity className="flex flex-row" onPress={handleMyOrdersPress}>
								<Text style={{ color: theme.colors.onPrimary }} className="mr-2">
									My Orders
								</Text>
								<Image source={filterIcon} className="h-7 w-7" />
							</TouchableOpacity>
						</View>
					</View>
					<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
				</View>
				<ScrollView
					ref={scrollViewRef}
					contentContainerStyle={{ flexGrow: 1 }}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isFetching}
							onRefresh={() => {
								refetch();
								scrollViewRef.current?.scrollTo({ y: 0, animated: true });
							}}
							colors={[theme.colors.primary]}
						/>
					}
				>
					<View className="flex-1 px-4 py-2" style={{ backgroundColor: theme.colors.background }}>
						{Array.isArray(paidBookings) && paidBookings.length > 0 ? (
							paidBookings.map((booking: any) => <OrderCard key={booking._id} booking={booking} />)
						) : (
							<View className="flex justify-center items-center flex-1">
								<Text
									style={{
										textAlign: "center",
										color: theme.colors.onBackground,
										fontFamily: theme.colors.fontSemiBold,
									}}
									variant="bodyLarge"
								>
									No orders available
								</Text>
								<Text
									style={{
										textAlign: "center",
										color: theme.colors.onBackground,
										marginTop: 10,
									}}
								>
									Check back later for new orders
								</Text>
							</View>
						)}
					</View>
				</ScrollView>
				<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
					Failed to refresh bookings. Please try again.
				</CustomSnackbar>
			</View>
		</SafeAreaView>
	);
};

export default withAuthCheck(Orders);
