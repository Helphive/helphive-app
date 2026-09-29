import React, { FC, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { Avatar, Button, HelperText, Text, TextInput } from "react-native-paper";
import { useDispatch } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { useLogoutMutation, useUpdateProfileMutation } from "../../features/auth/authApiSlice";
import { deleteRefreshToken, getRefreshToken } from "../../app/securestore/secureStoreUtility";
import { logOut } from "../../features/auth/authSlice";
import { getGcloudBucketHelphiveUsersUrl } from "../../utils/gcloud-strings";
import { useAppTheme } from "../../utils/theme";
import CustomSnackbar from "../CustomSnackbar";
import DetailsHeader from "../details/DetailsHeader";
import InfoCard from "../details/InfoCard";
import { PAGE_BACKGROUND, SCREEN_PADDING } from "../details/tokens";
import { countryList, stateList, punjabCityList } from "../../screens/HomeScreen/ProviderDetails/utils/countryData";
import {
	validateFirstName,
	validateLastName,
	validateEmail,
	validatePhone,
	validateStreet,
	validateCountry,
	validateState,
	validateCity,
} from "../../utils/validation/textValidations";
import SelectField from "./SelectField";

const camera = require("../../../assets/icons/camera-icon.png");

const EMPTY_ERRORS = {
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	street: "",
	country: "",
	state: "",
	city: "",
};

const FieldError = ({ message }: { message?: string }) =>
	message ? <HelperText type="error">{message}</HelperText> : null;

// Shared profile editor used by the customer Profile tab and the provider profile screen.
const ProfileForm: FC<{ userDetails: any }> = ({ userDetails }) => {
	const theme = useAppTheme();
	const user = userDetails?.user;

	const [firstName, setFirstName] = useState(user.firstName);
	const [lastName, setLastName] = useState(user.lastName);
	const [email] = useState(user.email);
	const [phone, setPhone] = useState(user.phone);
	const [street, setStreet] = useState(user.street || "");
	const [country, setCountry] = useState(user.country || "");
	const [state, setState] = useState(user.state || "");
	const [city, setCity] = useState(user.city || "");
	const [profileImage, setProfileImage] = useState(getGcloudBucketHelphiveUsersUrl(user.profile));
	const [errors, setErrors] = useState(EMPTY_ERRORS);
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
		const next = {
			firstName: validateFirstName(firstName),
			lastName: validateLastName(lastName),
			email: validateEmail(email),
			phone: validatePhone(phone),
			street: validateStreet(street),
			country: validateCountry(country),
			state: validateState(state),
			city: validateCity(city),
		};
		setErrors(next);
		return !Object.values(next).some(Boolean);
	};

	const handleUpdate = async () => {
		if (!validate()) return;
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
			formData.append("profile", { uri: profileImage, name: fileName, type: blob.type } as any);
		}

		try {
			await updateProfile(formData).unwrap();
			setSnackbarMessage("Profile updated successfully!");
		} catch (err) {
			console.error("Update failed", err);
			setSnackbarMessage("Profile update failed!");
		}
	};

	const showPlaceholderAvatar = !user?.profile && profileImage.includes("https");

	return (
		<View style={{ flex: 1, backgroundColor: PAGE_BACKGROUND }}>
			<DetailsHeader
				title="Your profile"
				right={
					<Button mode="text" textColor="white" onPress={handleLogout} disabled={isLoading}>
						Logout
					</Button>
				}
			/>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<ScrollView
					contentContainerStyle={{ padding: SCREEN_PADDING, gap: 16, paddingBottom: 32 }}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={{ alignItems: "center" }}>
						<Pressable
							onPress={handleImagePick}
							disabled={isLoading}
							accessibilityRole="button"
							accessibilityLabel="Change profile photo"
							style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
						>
							{showPlaceholderAvatar ? (
								<Avatar.Icon
									size={96}
									icon="account"
									color="#98A2B3"
									style={{ backgroundColor: "#F2F4F7" }}
								/>
							) : (
								<Image
									source={{ uri: profileImage }}
									style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#F2F4F7" }}
								/>
							)}
							<View
								style={{
									position: "absolute",
									right: 0,
									bottom: 0,
									height: 32,
									width: 32,
									borderRadius: 16,
									padding: 6,
									borderWidth: 2,
									borderColor: "#fff",
									backgroundColor: theme.colors.primary,
								}}
							>
								<Image source={camera} style={{ width: "100%", height: "100%" }} />
							</View>
						</Pressable>
						<Text
							style={{
								marginTop: 8,
								fontFamily: theme.colors.fontSemiBold,
								fontSize: 18,
								color: theme.colors.onBackground,
							}}
						>
							{firstName} {lastName}
						</Text>
					</View>

					<InfoCard title="Personal details">
						<TextInput
							value={firstName}
							mode="outlined"
							label="First name"
							editable={!isLoading}
							onChangeText={setFirstName}
							error={!!errors.firstName}
							left={<TextInput.Icon icon="account-outline" />}
						/>
						<FieldError message={errors.firstName} />
						<TextInput
							value={lastName}
							mode="outlined"
							label="Last name"
							style={{ marginTop: 8 }}
							editable={!isLoading}
							onChangeText={setLastName}
							error={!!errors.lastName}
							left={<TextInput.Icon icon="account-outline" />}
						/>
						<FieldError message={errors.lastName} />
						<TextInput
							value={email}
							mode="outlined"
							label="Email"
							style={{ marginTop: 8 }}
							textContentType="emailAddress"
							editable={false}
							left={<TextInput.Icon icon="email-outline" />}
						/>
						<FieldError message={errors.email} />
					</InfoCard>

					<InfoCard title="Contact and address">
						<TextInput
							value={phone}
							mode="outlined"
							label="Phone number"
							textContentType="telephoneNumber"
							keyboardType="phone-pad"
							editable={!isLoading}
							onChangeText={setPhone}
							error={!!errors.phone}
							left={<TextInput.Icon icon="phone-outline" />}
						/>
						<FieldError message={errors.phone} />
						<TextInput
							value={street}
							mode="outlined"
							label="Street address"
							style={{ marginTop: 8 }}
							editable={!isLoading}
							onChangeText={setStreet}
							error={!!errors.street}
							left={<TextInput.Icon icon="home-outline" />}
						/>
						<FieldError message={errors.street} />
						<SelectField
							data={countryList}
							placeholder="Select country"
							initialValue={user?.country}
							disabled={isLoading}
							error={errors.country}
							onSelect={(value) => {
								setCountry(value);
								setState("");
								setCity("");
							}}
						/>
						<SelectField
							data={stateList}
							placeholder="Select state"
							initialValue={user?.state}
							disabled={!country || isLoading}
							error={errors.state}
							onSelect={(value) => {
								setState(value);
								setCity("");
							}}
						/>
						<SelectField
							data={state === "punjab" ? punjabCityList : []}
							placeholder="Select city"
							initialValue={user?.city}
							disabled={!state || isLoading}
							error={errors.city}
							onSelect={setCity}
						/>
					</InfoCard>

					<Button
						mode="contained"
						onPress={handleUpdate}
						disabled={isLoading}
						loading={isLoading}
						contentStyle={{ paddingVertical: 6 }}
						labelStyle={{ fontFamily: theme.colors.fontBold, fontSize: 15 }}
					>
						{isLoading ? "Updating..." : "Update profile"}
					</Button>
				</ScrollView>
			</KeyboardAvoidingView>
			<CustomSnackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage("")} duration={3000}>
				{snackbarMessage}
			</CustomSnackbar>
		</View>
	);
};

export default ProfileForm;
