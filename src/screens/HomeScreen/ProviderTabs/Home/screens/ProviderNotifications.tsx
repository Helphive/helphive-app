import React, { useCallback, useRef, useState } from "react";
import { View, ScrollView, RefreshControl, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../../../../utils/theme";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "../../../../../features/auth/authApiSlice";
import NotificationCard from "../../../../../components/NotificationCard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import withAuthCheck from "../../../../../hocs/withAuthCheck";

const vector1 = require("../../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../../assets/Logo/logo-light.png");

const ProviderNotificationsScreen = () => {
	const theme: any = useAppTheme();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const scrollViewRef = useRef<ScrollView>(null);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const { data: notificationsData, refetch, isFetching } = useGetNotificationsQuery();
	const [markAsRead] = useMarkNotificationReadMutation();

	const handleNotificationPress = async (notification: any) => {
		try {
			if (!notification.read) {
				await markAsRead({ notificationId: notification._id });
			}

			if (notification.screen && notification.data) {
				navigation.navigate(notification.screen as any, notification.data as any);
			}
		} catch (error) {
			console.error("Error processing notification:", error);
			setSnackbarVisible(true);
		}
	};

	useFocusEffect(
		useCallback(() => {
			refetch();
			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
		}, [refetch]),
	);

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />

			<View className="flex flex-1">
				<View className="relative">
					<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
						<View className="flex flex-row justify-between items-center gap-2 min-h-[40px] w-full">
							<TouchableOpacity className="flex-row justify-start" onPress={() => navigation.goBack()}>
								<MaterialIcons name="chevron-left" size={30} color={theme.colors.onPrimary} />
								<Image source={logo} className="h-8 w-8 mr-2" />
								<Text
									variant="titleLarge"
									style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
									className="text-left"
								>
									Notifications
								</Text>
							</TouchableOpacity>
						</View>
					</View>
					<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
				</View>

				<ScrollView
					ref={scrollViewRef}
					contentContainerStyle={{ flexGrow: 1 }}
					className="px-4 py-2"
					style={{ backgroundColor: theme.colors.background }}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[theme.colors.primary]} />
					}
				>
					{notificationsData?.notifications?.length > 0 ? (
						notificationsData.notifications.map((notification: any) => (
							<NotificationCard
								key={notification._id}
								notification={notification}
								onPress={() => handleNotificationPress(notification)}
							/>
						))
					) : (
						<View className="flex-1 items-center justify-center">
							<Text
								style={{
									textAlign: "center",
									color: theme.colors.onBackground,
									fontFamily: theme.colors.fontSemiBold,
								}}
								variant="bodyLarge"
							>
								No notifications yet
							</Text>
						</View>
					)}
				</ScrollView>

				<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
					Failed to process notification
				</CustomSnackbar>
			</View>
		</SafeAreaView>
	);
};

export default withAuthCheck(ProviderNotificationsScreen);
