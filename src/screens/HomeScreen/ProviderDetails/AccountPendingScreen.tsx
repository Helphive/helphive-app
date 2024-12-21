import React from "react";
import { Image, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { useAppTheme } from "../../../utils/theme";
import { logOut } from "../../../features/auth/authSlice";
import { useLogoutMutation } from "../../../features/auth/authApiSlice";
import { deleteRefreshToken, getRefreshToken } from "../../../app/securestore/secureStoreUtility";

const AccountPendingScreen = () => {
	const theme = useAppTheme();
	const primaryColorHex = theme.colors.primary;

	// Parse the hex color string into RGB components
	const r = parseInt(primaryColorHex.substring(1, 3), 16);
	const g = parseInt(primaryColorHex.substring(3, 5), 16);
	const b = parseInt(primaryColorHex.substring(5, 7), 16);

	const xOctagon = require("../../../../assets/icons/approval-screens/paper.png");

	const dispatch = useDispatch();
	const [logout, { error }] = useLogoutMutation();

	const handleLogout = async () => {
		try {
			const refreshToken = await getRefreshToken();
			await logout({ refreshToken: refreshToken }).unwrap();
			dispatch(logOut());
			await deleteRefreshToken();
		} catch (err) {
			console.error("Logout failed", err || error);
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
						Your profile is submitted for review
					</Text>
					<Text
						variant="bodyMedium"
						style={{
							fontFamily: theme.colors.fontRegular,
							color: theme.colors.bodyColor,
							textAlign: "center",
						}}
					>
						Please wait for up to 3 business days for the confirmation
					</Text>
				</View>
				<View className="w-full flex justify-center items-center">
					<Button onPress={handleLogout} mode="text" className="mb-4" theme={{ roundness: 2 }}>
						<Text
							style={{
								color: theme.colors.primary,
								textDecorationLine: "underline",
								padding: 5,
							}}
						>
							Logout
						</Text>
					</Button>
				</View>
			</View>
		</SafeAreaView>
	);
};

export default AccountPendingScreen;
