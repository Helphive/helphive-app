import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, ScrollView, RefreshControl, PanResponder, Animated, Dimensions, Easing, Image } from "react-native";
import { Button, Text } from "react-native-paper";
import CustomSnackbar from "../../../../components/CustomSnackbar";
import withAuthCheck from "../../../../hocs/withAuthCheck";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "../../../../utils/theme";
import { useGetUserBookingsQuery } from "../../../../features/user/userApiSlice";
import { selectBookingList } from "../../../../features/booking/bookingsListSlice";
import { useSelector } from "react-redux";
import BookingCard from "./components/BookingCard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../utils/CustomTypes";

const vector1 = require("../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../assets/Logo/logo-light.png");

const Bookings = () => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	type BookingTab = "history" | "active" | "scheduled";
	const tabs = ["history", "active", "scheduled"] as BookingTab[];

	const [activeTab, setActiveTab] = useState<BookingTab>("history");
	const [refreshing, setRefreshing] = useState(false);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const slideAnim = useRef(new Animated.Value(0)).current;
	const borderAnim = useRef(new Animated.Value(0)).current;
	const screenWidth = Dimensions.get("window").width;
	const scrollViewRef = useRef<ScrollView>(null);
	const theme = useAppTheme();

	const { error, refetch, isFetching } = useGetUserBookingsQuery();
	const bookingsList = useSelector(selectBookingList);

	useEffect(() => {
		if (error) {
			setSnackbarVisible(true);
		}
	}, [error]);

	useFocusEffect(
		useCallback(() => {
			setRefreshing(true);
			refetch().finally(() => setRefreshing(false));
		}, [refetch]),
	);

	useEffect(() => {
		const unsubscribe = navigation.addListener("tabPress" as never, (_e: any) => {
			setRefreshing(true);
			refetch().finally(() => setRefreshing(false));
		});

		return unsubscribe;
	}, [navigation, refetch]);

	const handleRefresh = () => {
		setRefreshing(true);
		refetch().finally(() => {
			scrollViewRef.current?.scrollTo({ y: 0, animated: false });
			setRefreshing(false);
		});
	};

	const panResponder = PanResponder.create({
		onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
		onPanResponderMove: (evt, gestureState) => {
			// Restrict swipes to only left and right
			if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
				const newTranslateX = -tabs.indexOf(activeTab) * screenWidth + gestureState.dx;
				slideAnim.setValue(newTranslateX);
			}
		},
		onPanResponderRelease: (evt, gestureState) => {
			const currentIndex = tabs.indexOf(activeTab);
			const threshold = screenWidth / 8; // Set a threshold for swipe
			if (gestureState.dx > threshold && currentIndex > 0) {
				animateTabChange(currentIndex - 1, "right");
			} else if (gestureState.dx < -threshold && currentIndex < tabs.length - 1) {
				animateTabChange(currentIndex + 1, "left");
			} else {
				animateTabChange(currentIndex, "left");
			}
		},
		onPanResponderTerminate: () => {
			const currentIndex = tabs.indexOf(activeTab);
			animateTabChange(currentIndex, "left");
		},
	});

	const animateTabChange = (newIndex: number, _direction: "left" | "right") => {
		setActiveTab(tabs[newIndex]);
		const toValue = -newIndex * screenWidth;
		Animated.parallel([
			Animated.timing(slideAnim, {
				toValue,
				duration: 300,
				easing: Easing.out(Easing.ease),
				useNativeDriver: true,
			}),
			Animated.timing(borderAnim, {
				toValue: newIndex,
				duration: 300,
				easing: Easing.out(Easing.ease),
				useNativeDriver: false,
			}),
		]).start();
	};

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
				<View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
					<View style={{ flexDirection: "row", justifyContent: "space-around" }}>
						{tabs.map((tab: BookingTab, index) => (
							<View
								key={tab}
								style={{
									flex: 1,
								}}
							>
								<Button
									mode="text"
									onPress={() => {
										if (activeTab == tab) {
											scrollViewRef.current?.scrollTo({ y: 0, animated: false });
											handleRefresh();
										}
										animateTabChange(index, index > tabs.indexOf(activeTab) ? "left" : "right");
									}}
									style={{
										borderRadius: 0,
									}}
									labelStyle={{
										paddingVertical: 5,
										color: activeTab === tab ? theme.colors.primary : theme.colors.onBackground,
									}}
								>
									{tab.charAt(0).toUpperCase() + tab.slice(1)}
								</Button>
							</View>
						))}
						<Animated.View
							style={{
								position: "absolute",
								bottom: 0,
								left: borderAnim.interpolate({
									inputRange: [0, tabs.length - 1],
									outputRange: ["0%", "66.66%"],
								}),
								width: `${100 / tabs.length}%`,
								height: 2,
								backgroundColor: theme.colors.primary,
							}}
						/>
					</View>

					<View className="flex-1" {...panResponder.panHandlers}>
						<Animated.View
							style={{
								flexDirection: "row",
								width: screenWidth * tabs.length,
								transform: [
									{
										translateX: slideAnim,
									},
								],
							}}
						>
							{tabs.map((tab, index) => (
								<ScrollView
									key={index}
									refreshControl={
										<RefreshControl
											refreshing={isFetching || refreshing}
											onRefresh={handleRefresh}
											colors={[theme.colors.primary]}
										/>
									}
									showsHorizontalScrollIndicator={false}
									scrollEnabled={true}
									ref={scrollViewRef}
									className="flex-1 w-full"
								>
									<View key={index} style={{ width: screenWidth }}>
										<BookingCard tab={tab} bookingsList={bookingsList ? bookingsList[tab] : []} />
									</View>
								</ScrollView>
							))}
						</Animated.View>
					</View>
				</View>
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
