import React from "react";
import { Image, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../utils/CustomTypes";
import { useAppTheme } from "../../../utils/theme";

type AccountRejectedScreenProps = {
	userDetails: any;
};

const AccountRejectedScreen = ({ userDetails }: AccountRejectedScreenProps) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const theme = useAppTheme();
	const primaryColorHex = theme.colors.primary;

	// Parse the hex color string into RGB components
	const r = parseInt(primaryColorHex.substring(1, 3), 16);
	const g = parseInt(primaryColorHex.substring(3, 5), 16);
	const b = parseInt(primaryColorHex.substring(5, 7), 16);

	const xOctagon = require("../../../../assets/icons/approval-screens/x-octagon.png");
	const infoSquare = require("../../../../assets/icons/info-square.png");

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
						Sorry, your submission was rejected
					</Text>
					<Text
						variant="bodyMedium"
						style={{
							fontFamily: theme.colors.fontRegular,
							color: theme.colors.bodyColor,
							textAlign: "center",
						}}
						className="mb-4"
					>
						Please find the reason on the memo from our reviewer below. You can always revise and resubmit
						your profile anytime
					</Text>
					<View className="flex flex-row justify-center items-center">
						<Image source={infoSquare} style={{ width: 25, height: 25 }} />
						<Text
							variant="bodyMedium"
							style={{
								fontFamily: theme.colors.fontRegular,
								color: theme.colors.error,
								textAlign: "center",
							}}
							className="ml-2"
						>
							{userDetails?.rejectReason || "No reason provided"}
						</Text>
					</View>
				</View>
				<Button
					onPress={() => {
						navigation.reset({
							index: 0,
							routes: [
								{
									name: "ProviderDetails",
									params: { userDetails },
								},
							],
						});
					}}
					mode="contained"
					className="w-full mb-4"
					theme={{ roundness: 2 }}
				>
					<Text
						style={{
							color: theme.colors.buttonText,
							fontFamily: theme.colors.fontBold,
							padding: 5,
						}}
					>
						Try Again
					</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default AccountRejectedScreen;
