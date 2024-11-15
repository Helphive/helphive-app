import React, { FC } from "react";
import { View, Image, ScrollView, TouchableOpacity } from "react-native";
import { Avatar, Button, Text, TextInput } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useDispatch } from "react-redux";
import { useLogoutMutation } from "../../../../../features/auth/authApiSlice";
import { deleteRefreshToken, getRefreshToken } from "../../../../../app/securestore/secureStoreUtility";
import { logOut } from "../../../../../features/auth/authSlice";
import { MaterialIcons } from "@expo/vector-icons";
import { getGcloudBucketHelphiveUsersUrl } from "../../../../../utils/gcloud-strings";

const vector1 = require("../../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../../assets/cloud vectors/vector-2.png");

interface Props {
	userDetails: any;
}

const Profile: FC<Props> = ({ userDetails }) => {
	const theme = useAppTheme();
	const user = userDetails?.user;

	const profile = getGcloudBucketHelphiveUsersUrl(user.profile);

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
		<SafeAreaView className="h-full w-full" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				<View className="relative flex justify-center items-center h-[200px]">
					<View style={{ position: "absolute", top: 0, right: 0, margin: 10 }}>
						<Button mode="text" textColor="white" onPress={handleLogout}>
							Logout
						</Button>
					</View>
					<Text
						variant="titleLarge"
						style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
						className="mb-2 text-center max-w-[320px]"
					>
						Welcome to your profile!
					</Text>
					<Image source={vector1} className="w-full absolute top-[70px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[130px] right-0 -z-10" />
				</View>
				<View className="relative bg-white flex-1 w-full justify-start items-center min-h-screen">
					<View className="w-full flex justify-center items-center">
						<TouchableOpacity className="absolute -top-12" activeOpacity={1}>
							{!user.profile ? (
								<Avatar.Icon
									icon="account-circle"
									color="#BEBEBE"
									style={{
										backgroundColor: theme.colors.background,
										height: 100,
										width: 100,
									}}
									size={165}
								/>
							) : (
								<Image
									source={{ uri: profile }}
									style={{
										width: 100,
										height: 100,
										borderWidth: 3,
										borderColor: theme.colors.onPrimary,
										backgroundColor: theme.colors.background,
										borderRadius: 100,
										overflow: "hidden",
									}}
								/>
							)}
						</TouchableOpacity>
					</View>

					<View className="mt-20 w-full px-4">
						<TextInput
							value={user.firstName + " " + user.lastName}
							mode="outlined"
							label="Full Name"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							right={<TextInput.Icon icon="account-circle" />}
							editable={false}
						/>
						<TextInput
							value={user.email}
							mode="outlined"
							label="Email"
							textContentType="emailAddress"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							right={<TextInput.Icon icon="email" />}
							editable={false}
						/>
						<View className="flex flex-row justify-start items-center mt-4 mb-3">
							<MaterialIcons
								name="contact-mail"
								size={24}
								color={theme.colors.onBackground}
								style={{ margin: 8 }}
							/>
							<Text
								style={{ color: theme.colors.onBackground, fontFamily: theme.colors.fontSemiBold }}
								variant="titleMedium"
							>
								Contact & Address
							</Text>
						</View>
						<TextInput
							value={user.phone}
							mode="outlined"
							label="Phone Number"
							textContentType="telephoneNumber"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							left={<TextInput.Icon icon="phone" />}
							editable={false}
						/>
						<TextInput
							value={`${user?.street || ""}${user?.street && user?.city ? ", " : ""}${user?.city || ""}${user?.city && user?.state ? ", " : ""}${user?.state || ""}${user?.state && user?.country ? ", " : ""}${user?.country || ""}`}
							mode="outlined"
							label="Address"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							multiline
							numberOfLines={4}
							left={<TextInput.Icon icon="home" />}
							editable={false}
						/>
					</View>
					<View className="pb-10"></View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default Profile;
