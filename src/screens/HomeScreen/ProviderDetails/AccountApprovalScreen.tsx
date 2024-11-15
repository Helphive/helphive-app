import React, { useState } from "react";
import { Image, View } from "react-native";
import { Button, HelperText, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../utils/CustomTypes";
import { useAppTheme } from "../../../utils/theme";
import { useAccountApprovalScreenMutation } from "../../../features/provider/providerApiSlice";

type AccountApprovalScreenProps = {
	userDetails: any;
};

const AccountApprovalScreen = ({ userDetails }: AccountApprovalScreenProps) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const theme = useAppTheme();
	const primaryColorHex = theme.colors.primary;

	const [accountApproval, { isLoading }] = useAccountApprovalScreenMutation();
	const [accountApprovalError, setAccountApprovalError] = useState<string | null>(null);

	// Parse the hex color string into RGB components
	const r = parseInt(primaryColorHex.substring(1, 3), 16);
	const g = parseInt(primaryColorHex.substring(3, 5), 16);
	const b = parseInt(primaryColorHex.substring(5, 7), 16);

	const xOctagon = require("../../../../assets/icons/approval-screens/check-circle.png");

	const beginYourJourney = async () => {
		setAccountApprovalError(null);
		try {
			await accountApproval().unwrap();
			navigation.reset({
				index: 0,
				routes: [
					{
						name: "ProviderHome",
						params: { userDetails },
					},
				],
			});
		} catch (error: any) {
			console.log("Error: ", error);
			if (error?.status === "FETCH_ERROR") {
				setAccountApprovalError("Please check your internet connection.");
			} else {
				setAccountApprovalError("An error occurred while processing request.");
			}
		}
	};

	return (
		<SafeAreaView style={{ backgroundColor: theme.colors.background }}>
			<View className="mx-4 flex justify-center items-start h-full">
				<View className="w-full flex-1 justify-center">
					<View className="flex justify-center items-center mb-4">
						<View
							style={{
								backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
								padding: 15,
								borderRadius: 100,
							}}
						>
							<Image source={xOctagon} style={{ width: 40, height: 40 }} />
						</View>
					</View>
					<Text
						variant="titleMedium"
						style={{
							fontFamily: theme.colors.fontSemiBold,
							color: theme.colors.onBackground,
							textAlign: "center",
						}}
						className="mb-2"
					>
						Congratulations! your profile has been approved! 🎉
					</Text>
					<Text
						variant="bodyMedium"
						style={{
							fontFamily: theme.colors.fontRegular,
							color: theme.colors.bodyColor,
							textAlign: "center",
						}}
					>
						Start accepting opportunities and connect with hotels in need today!
					</Text>
				</View>
				<View className="w-full flex items-center">
					<HelperText type="error" className="">
						{accountApprovalError}
					</HelperText>
				</View>
				<Button
					onPress={beginYourJourney}
					mode="contained"
					className="w-full mb-4"
					theme={{ roundness: 2 }}
					loading={isLoading}
				>
					<Text
						style={{
							color: theme.colors.buttonText,
							fontFamily: theme.colors.fontBold,
							padding: 5,
						}}
					>
						Begin Your Journey
					</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default AccountApprovalScreen;
