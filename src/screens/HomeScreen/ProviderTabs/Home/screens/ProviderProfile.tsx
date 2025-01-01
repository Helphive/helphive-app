import React, { FC, useState } from "react";
import { View, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Avatar, Button, Text, TextInput, HelperText, Icon } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useDispatch } from "react-redux";
import { useLogoutMutation, useUpdateProfileMutation } from "../../../../../features/auth/authApiSlice";
import { deleteRefreshToken, getRefreshToken } from "../../../../../app/securestore/secureStoreUtility";
import { logOut } from "../../../../../features/auth/authSlice";
import { MaterialIcons } from "@expo/vector-icons";
import { getGcloudBucketHelphiveUsersUrl } from "../../../../../utils/gcloud-strings";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import * as ImagePicker from "expo-image-picker";
import SelectDropdown from "react-native-select-dropdown";
import CustomSnackbar from "../../../../../components/CustomSnackbar";

import { countryList, stateList, punjabCityList } from "../../../ProviderDetails/utils/countryData";
import {
	validateFirstName,
	validateLastName,
	validateEmail,
	validatePhone,
	validateStreet,
	validateCountry,
	validateState,
	validateCity,
} from "../../../../../utils/validation/textValidations";

const vector1 = require("../../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../../assets/cloud vectors/vector-2.png");
const camera = require("../../../../../../assets/icons/camera-icon.png");
const profile = require("../../../../../../assets/icons/profile/profile-gray.png");
const mail = require("../../../../../../assets/icons/profile/mail.png");
const phoneIcon = require("../../../../../../assets/icons/profile/phone.png");
const mapPin = require("../../../../../../assets/icons/profile/map-pin.png");
const home = require("../../../../../../assets/icons/profile/home.png");

interface Props {
	userDetails: any;
}

const Profile: FC<Props> = ({ userDetails }) => {
	const theme = useAppTheme();
	const user = userDetails?.user;
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const [firstName, setFirstName] = useState(user.firstName);
	const [lastName, setLastName] = useState(user.lastName);
	const [email, _setEmail] = useState(user.email);
	const [phone, setPhone] = useState(user.phone);
	const [street, setStreet] = useState(user.street || "");
	const [profileImage, setProfileImage] = useState(getGcloudBucketHelphiveUsersUrl(user.profile));

	const [errors, setErrors] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		street: "",
		country: "",
		state: "",
		city: "",
	});

	const [country, setCountry] = useState(user.country || "");
	const [state, setState] = useState(user.state || "");
	const [city, setCity] = useState(user.city || "");

	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");

	const dispatch = useDispatch();
	const [logout, { error }] = useLogoutMutation();
	const [updateProfile, { isLoading }] = useUpdateProfileMutation();

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

	const handleImagePick = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			allowsMultipleSelection: false,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		});

		if (!result.canceled && result.assets && result.assets.length > 0) {
			setProfileImage(result.assets[0].uri);
		}
	};

	const validate = () => {
		let valid = true;
		const newErrors = {
			firstName: validateFirstName(firstName),
			lastName: validateLastName(lastName),
			email: validateEmail(email),
			phone: validatePhone(phone),
			street: validateStreet(street),
			country: validateCountry(country),
			state: validateState(state),
			city: validateCity(city),
		};

		setErrors(newErrors);

		for (const key in newErrors) {
			if (newErrors[key as keyof typeof newErrors]) {
				valid = false;
				break;
			}
		}

		return valid;
	};

	const handleUpdate = async () => {
		if (validate()) {
			const formData = new FormData();
			formData.append("firstName", firstName);
			formData.append("lastName", lastName);
			formData.append("phone", phone);
			formData.append("street", street);
			formData.append("country", country);
			formData.append("state", state);
			formData.append("city", city);

			if (profileImage && !profileImage.includes("https")) {
				const response = await fetch(profileImage);
				const blob = await response.blob();
				const fileName = profileImage.split("/").pop() || "profile.jpg";
				formData.append("profile", {
					uri: profileImage,
					name: fileName,
					type: blob.type,
				} as any);
			}

			try {
				await updateProfile(formData).unwrap();
				setSnackbarMessage("Profile updated successfully!");
				setSnackbarVisible(true);
			} catch (error) {
				console.error("Update failed", error);
				setSnackbarMessage("Profile update failed!");
				setSnackbarVisible(true);
			}
		}
	};

	return (
		<SafeAreaView className="h-full w-full" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				<View className="relative flex justify-center items-center h-[200px]">
					<View
						style={{
							position: "absolute",
							width: "100%",
							top: 0,
							right: 0,
							padding: 10,
							display: "flex",
							flexDirection: "row",
							justifyContent: "space-between",
						}}
					>
						<TouchableOpacity
							style={{ flexDirection: "row", justifyContent: "flex-start" }}
							onPress={() => {
								navigation.goBack();
							}}
						>
							<MaterialIcons name="chevron-left" size={30} color={theme.colors.onPrimary} />
						</TouchableOpacity>
						<Button mode="text" textColor="white" theme={{ roundness: 2 }} onPress={handleLogout}>
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
				<View className="relative bg-white flex-1 w-full justify-start items-center">
					<View className="w-full flex justify-center items-center">
						<TouchableOpacity
							className="absolute -top-12"
							activeOpacity={1}
							onPress={handleImagePick}
							disabled={isLoading}
						>
							{!user?.profile && profileImage.includes("https") ? (
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
									source={{ uri: profileImage }}
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
							<View
								className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-1 border-2 border-white z-10"
								style={{ backgroundColor: theme.colors.primary }}
							>
								<Image source={camera} className="w-full h-full" />
							</View>
						</TouchableOpacity>
					</View>

					<View className="mt-20 w-full px-4">
						<TextInput
							value={firstName}
							mode="outlined"
							label="First Name"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							right={
								<TextInput.Icon
									icon={() => <Image source={profile} style={{ width: 30, height: 30 }} />}
								/>
							}
							editable={!isLoading}
							onChangeText={setFirstName}
						/>
						{errors.firstName ? <HelperText type="error">{errors.firstName}</HelperText> : null}
						<TextInput
							value={lastName}
							mode="outlined"
							label="Last Name"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							right={
								<TextInput.Icon
									icon={() => <Image source={profile} style={{ width: 30, height: 30 }} />}
								/>
							}
							editable={!isLoading}
							onChangeText={setLastName}
						/>
						{errors.lastName ? <HelperText type="error">{errors.lastName}</HelperText> : null}
						<TextInput
							value={email}
							mode="outlined"
							label="Email"
							textContentType="emailAddress"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							right={
								<TextInput.Icon
									icon={() => <Image source={mail} style={{ width: 25, height: 25 }} />}
								/>
							}
							editable={false}
						/>
						{errors.email ? <HelperText type="error">{errors.email}</HelperText> : null}
						<View className="flex flex-row justify-start items-center mt-4 mb-3">
							<Image source={mapPin} style={{ width: 25, height: 25, marginRight: 5 }} />
							<Text
								style={{ color: theme.colors.onBackground, fontFamily: theme.colors.fontSemiBold }}
								variant="titleMedium"
							>
								Contact & Address
							</Text>
						</View>
						<TextInput
							value={phone}
							mode="outlined"
							label="Phone Number"
							textContentType="telephoneNumber"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							left={
								<TextInput.Icon
									icon={() => <Image source={phoneIcon} style={{ width: 25, height: 25 }} />}
								/>
							}
							editable={!isLoading}
							onChangeText={setPhone}
						/>
						{errors.phone ? <HelperText type="error">{errors.phone}</HelperText> : null}
						<TextInput
							value={street}
							mode="outlined"
							label="Street Address"
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							left={
								<TextInput.Icon
									icon={() => <Image source={home} style={{ width: 25, height: 25 }} />}
								/>
							}
							editable={!isLoading}
							onChangeText={setStreet}
						/>
						{errors.street ? <HelperText type="error">{errors.street}</HelperText> : null}
						<View style={{ marginBottom: 5, marginTop: 5 }}>
							<SelectDropdown
								data={countryList}
								onSelect={(selectedItem: { label: string; value: string }, _index: number) => {
									setCountry(selectedItem.value || "");
									setState("");
									setCity("");
								}}
								disabled={isLoading}
								defaultValue={
									user?.country
										? {
												label: user?.country.charAt(0).toUpperCase() + user?.country.slice(1),
												value: user?.country.toLowerCase(),
											}
										: null
								}
								renderButton={(
									selectedItem: { label: string; value: string } | null,
									isOpened: boolean,
								) => (
									<View
										style={{
											width: "100%",
											height: 50,
											backgroundColor: theme.colors.background,
											borderRadius: 8,
											flexDirection: "row",
											justifyContent: "space-between",
											alignItems: "center",
											paddingHorizontal: 12,
											borderWidth: 1,
											borderColor: errors.country ? theme.colors.error : theme.colors.outline,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 16,
												fontWeight: "500",
												color: selectedItem ? theme.colors.onSurface : theme.colors.onSurface,
												textAlign: "left",
											}}
										>
											{selectedItem ? selectedItem.label : "Select Country"}
										</Text>
										<Icon source={isOpened ? "chevron-up" : "chevron-down"} size={28} />
									</View>
								)}
								renderItem={(
									item: { label: string; value: string },
									_index: number,
									isSelected: boolean,
								) => (
									<View
										style={{
											width: "100%",
											flexDirection: "row",
											paddingHorizontal: 12,
											justifyContent: "space-between",
											alignItems: "center",
											paddingVertical: 8,
											backgroundColor: isSelected ? "#D2D9DF" : theme.colors.background,
											borderBottomColor: theme.colors.bodyColor,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 16,
												fontWeight: "500",
												color: theme.colors.bodyColor,
												textAlign: "left",
												padding: 5,
											}}
										>
											{item.label}
										</Text>
										{isSelected && <Icon source="check" size={20} color={theme.colors.primary} />}
									</View>
								)}
								showsVerticalScrollIndicator={false}
								dropdownStyle={{
									backgroundColor: theme.colors.background,
									borderRadius: 8,
								}}
							/>
							{errors.country && (
								<View className="w-full">
									<HelperText type="error">{errors.country}</HelperText>
								</View>
							)}
						</View>
						<View style={{ marginBottom: 5 }}>
							<SelectDropdown
								data={stateList}
								onSelect={(selectedItem: { label: string; value: string }, _index: number) => {
									setState(selectedItem.value || "");
									setCity("");
								}}
								disabled={!country || isLoading}
								defaultValue={
									user?.state
										? {
												label: user?.state.charAt(0).toUpperCase() + user?.state.slice(1),
												value: user?.state.toLowerCase(),
											}
										: null
								}
								renderButton={(
									selectedItem: { label: string; value: string } | null,
									isOpened: boolean,
								) => (
									<View
										style={{
											width: "100%",
											height: 50,
											backgroundColor: theme.colors.background,
											borderRadius: 8,
											flexDirection: "row",
											justifyContent: "space-between",
											alignItems: "center",
											paddingHorizontal: 12,
											borderWidth: 1,
											borderColor: errors.state ? theme.colors.error : theme.colors.outline,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 16,
												fontWeight: "500",
												color: selectedItem ? theme.colors.onSurface : theme.colors.onSurface,
												textAlign: "left",
											}}
										>
											{selectedItem ? selectedItem.label : "Select State"}
										</Text>
										<Icon source={isOpened ? "chevron-up" : "chevron-down"} size={28} />
									</View>
								)}
								renderItem={(
									item: { label: string; value: string },
									index: number,
									isSelected: boolean,
								) => (
									<View
										style={{
											width: "100%",
											flexDirection: "row",
											paddingHorizontal: 12,
											justifyContent: "space-between",
											alignItems: "center",
											paddingVertical: 8,
											backgroundColor: isSelected ? "#D2D9DF" : theme.colors.background,
											borderBottomColor: theme.colors.bodyColor,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 16,
												fontWeight: "500",
												color: theme.colors.bodyColor,
												textAlign: "left",
												padding: 5,
											}}
										>
											{item.label}
										</Text>
										{isSelected && <Icon source="check" size={20} color={theme.colors.primary} />}
									</View>
								)}
								showsVerticalScrollIndicator={false}
								dropdownStyle={{
									backgroundColor: theme.colors.background,
									borderRadius: 8,
								}}
							/>
							{errors.state && (
								<View className="w-full">
									<HelperText type="error">{errors.state}</HelperText>
								</View>
							)}
						</View>
						<View style={{ marginBottom: 5 }}>
							<SelectDropdown
								data={state === "punjab" ? punjabCityList : []}
								onSelect={(selectedItem: { label: string; value: string }, index: number) => {
									setCity(selectedItem.value || "");
								}}
								disabled={!state || isLoading}
								defaultValue={
									user?.city
										? {
												label: user?.city.charAt(0).toUpperCase() + user?.city.slice(1),
												value: user?.city.toLowerCase(),
											}
										: null
								}
								renderButton={(
									selectedItem: { label: string; value: string } | null,
									isOpened: boolean,
								) => (
									<View
										style={{
											width: "100%",
											height: 50,
											backgroundColor: theme.colors.background,
											borderRadius: 8,
											flexDirection: "row",
											justifyContent: "space-between",
											alignItems: "center",
											paddingHorizontal: 12,
											borderWidth: 1,
											borderColor: errors.city ? theme.colors.error : theme.colors.outline,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 16,
												fontWeight: "500",
												color: selectedItem ? theme.colors.onSurface : theme.colors.onSurface,
												textAlign: "left",
											}}
										>
											{selectedItem ? selectedItem.label : "Select City"}
										</Text>
										<Icon source={isOpened ? "chevron-up" : "chevron-down"} size={28} />
									</View>
								)}
								renderItem={(
									item: { label: string; value: string },
									index: number,
									isSelected: boolean,
								) => (
									<View
										style={{
											width: "100%",
											flexDirection: "row",
											paddingHorizontal: 12,
											justifyContent: "space-between",
											alignItems: "center",
											paddingVertical: 8,
											backgroundColor: isSelected ? "#D2D9DF" : theme.colors.background,
											borderBottomColor: theme.colors.bodyColor,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 16,
												fontWeight: "500",
												color: theme.colors.bodyColor,
												textAlign: "left",
												padding: 5,
											}}
										>
											{item.label}
										</Text>
										{isSelected && <Icon source="check" size={20} color={theme.colors.primary} />}
									</View>
								)}
								showsVerticalScrollIndicator={false}
								dropdownStyle={{
									backgroundColor: theme.colors.background,
									borderRadius: 8,
								}}
							/>
							{errors.city && (
								<View className="w-full">
									<HelperText type="error">{errors.city}</HelperText>
								</View>
							)}
						</View>
					</View>
					<Button
						mode="contained"
						theme={{ roundness: 2 }}
						onPress={handleUpdate}
						style={{ marginTop: 20, width: 200 }}
						disabled={isLoading}
						loading={isLoading}
					>
						{isLoading ? "Updating..." : "Update Profile"}
					</Button>
					<View className="pb-10"></View>
				</View>
			</ScrollView>
			<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>
				{snackbarMessage}
			</CustomSnackbar>
		</SafeAreaView>
	);
};

export default Profile;
