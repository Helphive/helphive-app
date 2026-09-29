import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import withAuthCheck from "../../../../../hocs/withAuthCheck";
import { useAppTheme } from "../../../../../utils/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useGetMyOrdersQuery } from "../../../../../features/provider/providerApiSlice";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import MyOrderCard from "../components/MyOrderCard";
import SwipeTabs from "../../../../../components/SwipeTabs";
import TabPageList from "../../../../../components/TabPageList";
import { getDisplayStatus } from "../../../../../utils/format";

const vector1 = require("../../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../../assets/Logo/logo-light.png");

type OrderTab = "active" | "completed" | "cancelled";

const TABS: { key: OrderTab; label: string }[] = [
	{ key: "active", label: "Active" },
	{ key: "completed", label: "Completed" },
	{ key: "cancelled", label: "Cancelled" },
];

const EMPTY: Record<OrderTab, { icon: any; title: string; message: string }> = {
	active: {
		icon: "briefcase-clock-outline",
		title: "No active orders",
		message: "Accepted orders that are upcoming or in progress appear here.",
	},
	completed: { icon: "check-circle-outline", title: "No completed orders", message: "Finished orders appear here." },
	cancelled: { icon: "close-circle-outline", title: "No cancelled orders", message: "Nothing has been cancelled." },
};

const keyExtractor = (item: any, index: number) => item?._id ?? String(index);

const Orders = () => {
	const theme: any = useAppTheme();
	const { data: bookings, refetch, isLoading, error } = useGetMyOrdersQuery();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const lists = useMemo<Record<OrderTab, any[]>>(() => {
		const out: Record<OrderTab, any[]> = { active: [], completed: [], cancelled: [] };
		(Array.isArray(bookings) ? bookings : []).forEach((b: any) => {
			const status = getDisplayStatus(b);
			if (status === "completed") out.completed.push(b);
			else if (status === "cancelled" || status === "expired") out.cancelled.push(b);
			else out.active.push(b);
		});
		return out;
	}, [bookings]);

	const tabsMeta = useMemo(() => TABS.map((t) => ({ ...t, count: lists[t.key].length })), [lists]);

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

	const handlePress = useCallback(
		(booking: any) => navigation.navigate("MyOrderDetails", { bookingId: booking._id }),
		[navigation],
	);
	const renderItem = useCallback(
		({ item }: { item: any }) => <MyOrderCard booking={item} onPress={handlePress} />,
		[handlePress],
	);

	const renderPage = useCallback(
		(key: string) => (
			<TabPageList
				data={lists[key as OrderTab]}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				refreshing={refreshing}
				onRefresh={handleRefresh}
				loading={isLoading}
				empty={EMPTY[key as OrderTab]}
			/>
		),
		[lists, renderItem, refreshing, handleRefresh, isLoading],
	);

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />

			<View className="flex flex-1">
				<View className="relative">
					<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
						<View className="flex flex-row justify-between items-center gap-2 min-h-[40px] w-full">
							<TouchableOpacity
								className="flex-row justify-start"
								onPress={() => {
									navigation.goBack();
								}}
							>
								<MaterialIcons name="chevron-left" size={30} color={theme.colors.onPrimary} />
								<Image source={logo} className="h-8 w-8 mr-2" />
								<Text
									variant="titleLarge"
									style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
									className="text-left"
								>
									My Orders
								</Text>
							</TouchableOpacity>
						</View>
					</View>
					<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
				</View>
				<SwipeTabs tabs={tabsMeta} renderPage={renderPage} />
				<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
					Failed to refresh bookings. Please try again.
				</CustomSnackbar>
			</View>
		</SafeAreaView>
	);
};

export default withAuthCheck(Orders);
