import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, View, RefreshControl, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import withAuthCheck from "../../../../../hocs/withAuthCheck";
import { useAppTheme } from "../../../../../utils/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useGetEarningsQuery } from "../../../../../features/provider/providerApiSlice";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import EarningsCard from "../components/EarningsCard";

const vector1 = require("../../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../../assets/Logo/logo-light.png");

const EarningsScreen = () => {
	const theme: any = useAppTheme();
	const { data: earningsData, refetch, isFetching, error } = useGetEarningsQuery();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const scrollViewRef = useRef<ScrollView>(null);
	const [snackbarVisible, setSnackbarVisible] = useState(false);

	const earnings = earningsData?.earnings;

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
		const unsubscribe = navigation.addListener("tabPress" as never, () => {
			refetch();
			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
		});

		return unsubscribe;
	}, [navigation, refetch]);

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
									Your Earnings
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
						{Array.isArray(earnings) && earnings.length > 0 ? (
							earnings.map((earning: any) => (
								<View
									key={earning._id}
									style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.onSurfaceDisabled }}
								>
									<EarningsCard earning={earning} />
								</View>
							))
						) : (
							<View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
								<Text
									style={{
										textAlign: "center",
										color: theme.colors.onBackground,
										fontFamily: theme.colors.fontSemiBold,
									}}
									variant="bodyLarge"
								>
									You haven't completed any orders yet
								</Text>
								<Text
									style={{
										textAlign: "center",
										color: theme.colors.onBackground,
										marginTop: 10,
										maxWidth: "80%",
									}}
								>
									Don't worry! Once you complete an order, you will see the upcoming amount here.
								</Text>
							</View>
						)}
					</View>
				</ScrollView>
				<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
					Failed to refresh earnings. Please try again.
				</CustomSnackbar>
			</View>
		</SafeAreaView>
	);
};

export default withAuthCheck(EarningsScreen);
