import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import {
	Button,
	Checkbox,
	HelperText,
	Text,
	TextInput,
	Avatar,
	Provider as PaperProvider,
	Icon,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import SelectDropdown from "react-native-select-dropdown";

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../utils/CustomTypes";
import { useAppTheme } from "../../../utils/theme";
import { useRequestProviderAccountMutation } from "../../../features/provider/providerApiSlice";

import { countryList, stateList, punjabCityList } from "./utils/countryData";

import {
	validateFirstName,
	validateLastName,
	validateEmail,
	validatePhone,
	validateCountry,
	validateState,
	validateCity,
	validateStreet,
	validateJobTypes,
	validateId,
	validateDbs,
	validateResume,
	validateProfile,
} from "./utils/FormValidation";

import UploadModal from "./components/UploadModal";
import ProfileUploadModal from "./components/ProfileUploadModal";
import TermsAgreementModal from "./components/TermsAgreementModal";
import { logOut } from "../../../features/auth/authSlice";
import { deleteRefreshToken, getRefreshToken } from "../../../app/securestore/secureStoreUtility";
import { useDispatch } from "react-redux";
import { useLogoutMutation } from "../../../features/auth/authApiSlice";

const vector1 = require("../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../assets/cloud vectors/vector-2.png");
const profile = require("../../../../assets/icons/profile-icon.png");
const camera = require("../../../../assets/icons/camera-icon.png");
const document = require("../../../../assets/icons/document-icon.png");
const pageUpload = require("../../../../assets/icons/page-upload.png");
const sofa = require("../../../../assets/icons/sofa.png");
const door = require("../../../../assets/icons/door.png");
const bed = require("../../../../assets/icons/bed.png");

type ProviderDetailsScreenProps = {
	userDetails: any;
};

const ProviderDetailsScreen = ({ userDetails }: ProviderDetailsScreenProps) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const [requestProviderAccount, { isLoading: isRequestProviderAccountLoading }] =
		useRequestProviderAccountMutation();

	const theme = useAppTheme();

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

	const [providerDetails, setProviderDetails] = useState({
		firstName: "",
		firstNameError: "",
		lastName: "",
		lastNameError: "",
		email: "",
		emailError: "",
		profile: null as any,
		profileError: "",
		phone: "",
		phoneError: "",
		country: "united kingdom",
		countryError: "",
		state: "",
		stateError: "",
		city: "",
		cityError: "",
		street: "",
		streetError: "",
		id: null as any,
		idError: "",
		dbs: null as any,
		dbsError: "",
		jobTypes: {
			publicAreaAttendant: false,
			roomAttendant: false,
			linenPorter: false,
		},
		jobTypesError: "",
		resume: null as any,
		resumeError: "",
	});

	useEffect(() => {
		setProviderDetails((prevState) => ({
			...prevState,
			firstName: userDetails?.firstName || "",
			lastName: userDetails?.lastName || "",
			email: userDetails?.email || "",
		}));
	}, [userDetails]);

	const [showDropdown, setShowDropdown] = useState({
		country: false,
		state: false,
		city: false,
	});

	const [idModalVisible, setIdModalVisible] = useState(false);
	const [dbsModalVisible, setDbsModalVisible] = useState(false);
	const [resumeModalVisible, setResumeModalVisible] = useState(false);
	const [profileModalVisible, setProfileModalVisible] = useState(false);
	const [termsAgreementModalVisible, setTermsAgreementModalVisible] = useState(false);

	const [termsAgreement, setTermsAgreement] = useState(false);

	const handleTermsAgreementModalVisible = async (value: boolean) => {
		setTermsAgreementModalVisible(value);
		if (termsAgreement) {
			try {
				const formData = new FormData();

				formData.append("firstName", providerDetails.firstName);
				formData.append("lastName", providerDetails.lastName);
				formData.append("email", providerDetails.email);
				formData.append("phone", providerDetails.phone);
				formData.append("country", providerDetails.country);
				formData.append("state", providerDetails.state);
				formData.append("city", providerDetails.city);
				formData.append("street", providerDetails.street);
				formData.append("id", {
					uri: providerDetails.id.assets[0].uri,
					name: providerDetails.id.assets[0].fileName || providerDetails.id.assets[0].name,
					type: providerDetails.id.assets[0].mimeType,
				} as any);
				formData.append("dbs", {
					uri: providerDetails.dbs.assets[0].uri,
					name: providerDetails.dbs.assets[0].fileName || providerDetails.dbs.assets[0].name,
					type: providerDetails.dbs.assets[0].mimeType,
				} as any);
				formData.append("resume", {
					uri: providerDetails.resume.assets[0].uri,
					name: providerDetails.resume.assets[0].fileName || providerDetails.resume.assets[0].name,
					type: providerDetails.resume.assets[0].mimeType,
				} as any);
				formData.append("profile", {
					uri: providerDetails.profile.assets[0].uri,
					name: providerDetails.profile.assets[0].fileName || providerDetails.profile.assets[0].name,
					type: providerDetails.profile.assets[0].mimeType,
				} as any);
				formData.append("jobTypes", JSON.stringify(providerDetails.jobTypes));

				await requestProviderAccount(formData).unwrap();
				navigation.reset({
					index: 0,
					routes: [{ name: "AccountPending" }],
				});
			} catch (error) {
				console.error("Error requesting provider account:", error);
				if ((error as any).response) {
					const errorText = await (error as any).response.text();
					console.error("Error response text:", errorText);
				}
			}
		}
	};

	const handleSetId = (document: any) => {
		setProviderDetails((prevState) => ({
			...prevState,
			id: document,
		}));
	};

	const handleSetDbs = (document: any) => {
		setProviderDetails((prevState) => ({
			...prevState,
			dbs: document,
		}));
	};

	const handleSetResume = (document: any) => {
		setProviderDetails((prevState) => ({
			...prevState,
			resume: document,
		}));
	};

	const handleSetProfile = (document: any) => {
		setProviderDetails((prevState) => ({
			...prevState,
			profile: document,
		}));
	};

	const getFileNameFromUri = (result: any) => {
		return result.assets[0].fileName || result.assets[0].name;
	};

	const handleSubmit = async () => {
		const updateProviderDetails = async () => {
			try {
				const idError = await validateId(providerDetails.id);
				const dbsError = await validateDbs(providerDetails.dbs);
				const resumeError = await validateResume(providerDetails.resume);
				const profileError = await validateProfile(providerDetails.profile);

				setProviderDetails((prevState) => ({
					...prevState,
					firstNameError: validateFirstName(prevState.firstName),
					lastNameError: validateLastName(prevState.lastName),
					emailError: validateEmail(prevState.email),
					phoneError: validatePhone(prevState.phone),
					countryError: validateCountry(prevState.country),
					stateError: validateState(prevState.state),
					cityError: validateCity(prevState.city),
					streetError: validateStreet(prevState.street),
					jobTypesError: validateJobTypes(prevState.jobTypes),
					idError,
					dbsError,
					resumeError,
					profileError,
				}));
			} catch (error) {
				console.error("Error updating provider details:", error);
			}
		};

		await updateProviderDetails();

		if (
			!providerDetails.firstNameError.length ||
			!providerDetails.lastNameError.length ||
			!providerDetails.emailError.length ||
			!providerDetails.phoneError.length ||
			!providerDetails.countryError.length ||
			!providerDetails.stateError.length ||
			!providerDetails.cityError.length ||
			!providerDetails.streetError.length ||
			!providerDetails.jobTypesError.length ||
			!providerDetails.idError.length ||
			!providerDetails.dbsError.length ||
			!providerDetails.resumeError.length
		) {
			setTermsAgreementModalVisible(true);
		}
	};

	return (
		<SafeAreaView className="h-full w-full" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />
			<ScrollView className="">
				<View className="relative flex justify-center items-center h-[300px]">
					<View style={{ position: "absolute", top: 0, right: 0, margin: 10 }}>
						<Button mode="text" textColor="white" theme={{ roundness: 2 }} onPress={handleLogout}>
							Logout
						</Button>
					</View>
					<Text
						variant="titleLarge"
						style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
						className="mb-2 text-center max-w-[320px]"
					>
						Let&apos;s start by completing your profile!
					</Text>
					<Text
						variant="bodyLarge"
						style={{ fontFamily: theme.colors.fontRegular, color: theme.colors.onPrimary }}
						className="mb-6 text-center max-w-[320px]"
					>
						We&apos;ll need your phone number, address, photo/scan of your ID & your DBS certificate, and
						your resume
					</Text>
					<Image source={vector1} className="w-full absolute top-[70px] left-[0px] -z-10" />
					<Image source={vector2} className="w-full h-[250px] absolute top-[130px] right-0 -z-10" />
				</View>
				<View className="relative bg-white h-full w-full flex justify-start items-center">
					<View className="w-full flex justify-center items-center">
						<TouchableOpacity
							className="absolute -top-12"
							activeOpacity={1}
							onPress={() => setProfileModalVisible(true)}
						>
							{!providerDetails.profile ? (
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
									source={{ uri: providerDetails.profile?.assets[0]?.uri }}
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
						{providerDetails.profileError && (
							<View className="w-full flex justify-center items-center absolute top-12">
								<HelperText type="error">{providerDetails.profileError}</HelperText>
							</View>
						)}
					</View>

					<View className="mt-20 w-full px-4">
						<TextInput
							value={providerDetails.firstName + " " + providerDetails.lastName}
							onChangeText={(value) =>
								setProviderDetails((prevState) => ({ ...prevState, firstName: value, lastName: value }))
							}
							mode="outlined"
							label="Full Name"
							placeholder="Enter full name..."
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							right={<TextInput.Icon icon="account-circle" />}
							error={!!providerDetails.firstNameError}
							editable={false}
						/>
						{providerDetails.firstNameError && (
							<View className="w-full">
								<HelperText type="error">{providerDetails.firstNameError}</HelperText>
							</View>
						)}
						<TextInput
							value={providerDetails.email}
							onChangeText={(value) =>
								setProviderDetails((prevState) => ({ ...prevState, email: value }))
							}
							mode="outlined"
							label="Email"
							textContentType="emailAddress"
							placeholder="Enter email..."
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							right={<TextInput.Icon icon="email" />}
							error={!!providerDetails.emailError}
							editable={false}
						/>
						{providerDetails.emailError && (
							<View className="w-full">
								<HelperText type="error">{providerDetails.emailError}</HelperText>
							</View>
						)}
						<View className="flex flex-row justify-start items-center mt-4 mb-3">
							<Image source={profile} className="h-8 w-8 m-2" />
							<Text
								style={{ color: theme.colors.onBackground, fontFamily: theme.colors.fontSemiBold }}
								variant="titleMedium"
							>
								Contact & Address
							</Text>
						</View>
						<TextInput
							value={providerDetails.phone}
							onChangeText={(value) =>
								setProviderDetails((prevState) => ({ ...prevState, phone: value }))
							}
							mode="outlined"
							label="Phone Number"
							textContentType="telephoneNumber"
							placeholder="Enter phone number..."
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							left={<TextInput.Icon icon="phone" />}
							error={!!providerDetails.phoneError}
						/>
						{providerDetails.phoneError && (
							<View className="w-full">
								<HelperText type="error">{providerDetails.phoneError}</HelperText>
							</View>
						)}
						<View className="mb-2"></View>
						<View className="mb-2">
							<SelectDropdown
								data={countryList}
								onSelect={(selectedItem: { label: string; value: string }, index: number) => {
									setProviderDetails((prevState) => ({
										...prevState,
										country: selectedItem.value || "",
									}));
								}}
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
											borderColor: theme.colors.bodyColor,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 18,
												fontWeight: "500",
												color: theme.colors.bodyColor,
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
												fontSize: 18,
												fontWeight: "500",
												color: theme.colors.bodyColor,
												textAlign: "left",
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
							{providerDetails.countryError && (
								<View className="w-full">
									<HelperText type="error">{providerDetails.countryError}</HelperText>
								</View>
							)}
						</View>
						<View className="mb-2">
							<SelectDropdown
								data={stateList}
								onSelect={(selectedItem: { label: string; value: string }, index: number) => {
									setProviderDetails((prevState) => ({
										...prevState,
										state: selectedItem.value || "",
									}));
								}}
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
											borderColor: theme.colors.bodyColor,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 18,
												fontWeight: "500",
												color: theme.colors.bodyColor,
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
												fontSize: 18,
												fontWeight: "500",
												color: theme.colors.bodyColor,
												textAlign: "left",
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
							{providerDetails.stateError && (
								<View className="w-full">
									<HelperText type="error">{providerDetails.stateError}</HelperText>
								</View>
							)}
						</View>
						<View className="mb-2">
							<SelectDropdown
								data={providerDetails.state === "punjab" ? punjabCityList : []}
								onSelect={(selectedItem: { label: string; value: string }, index: number) => {
									setProviderDetails((prevState) => ({
										...prevState,
										city: selectedItem.value || "",
									}));
								}}
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
											borderColor: theme.colors.bodyColor,
										}}
									>
										<Text
											style={{
												flex: 1,
												fontSize: 18,
												fontWeight: "500",
												color: theme.colors.bodyColor,
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
												fontSize: 18,
												fontWeight: "500",
												color: theme.colors.bodyColor,
												textAlign: "left",
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
							{providerDetails.cityError && (
								<View className="w-full">
									<HelperText type="error">{providerDetails.cityError}</HelperText>
								</View>
							)}
						</View>
						<TextInput
							value={providerDetails.street}
							onChangeText={(value) =>
								setProviderDetails((prevState) => ({ ...prevState, street: value }))
							}
							mode="outlined"
							label="Street Address"
							textContentType="streetAddressLine1"
							placeholder="Enter street address..."
							className="w-full"
							placeholderTextColor={theme.colors.placeholder}
							left={<TextInput.Icon icon="home" />}
							error={!!providerDetails.streetError}
						/>
						{providerDetails.streetError && (
							<View className="w-full">
								<HelperText type="error">{providerDetails.streetError}</HelperText>
							</View>
						)}
						<View className="flex flex-row justify-start items-center my-4">
							<Image source={document} className="h-8 w-8 m-2" />
							<Text
								style={{ color: theme.colors.onBackground, fontFamily: theme.colors.fontSemiBold }}
								variant="titleMedium"
							>
								ID & DBS Certificate
							</Text>
						</View>
						<View className="w-full flex justify-center items-center mb-5">
							{!providerDetails.id ? (
								<TouchableOpacity
									onPress={() => setIdModalVisible(true)}
									style={{
										borderColor: theme.colors.primary,
										borderWidth: 2,
										borderRadius: 10,
										borderStyle: "dotted",
										width: "100%",
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										padding: 20,
										gap: 8,
									}}
								>
									<Image source={pageUpload} className="w-12 h-12" />
									<Text
										style={{
											color: theme.colors.onBackground,
											fontFamily: theme.colors.fontMedium,
										}}
										variant="titleMedium"
									>
										Upload your ID
									</Text>
									<Text style={{ color: theme.colors.bodyColor }}>
										Supported JPG, PNG, JPEG & PDF. Max 10 mb.
									</Text>
								</TouchableOpacity>
							) : (
								<View
									style={{
										width: "100%",
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
										borderColor: theme.colors.bodyColor,
										borderWidth: 1,
										borderRadius: 10,
										padding: 20,
									}}
								>
									<View className="flex-1 flex-row items-center">
										<Image source={document} style={{ height: 64, width: 64, marginRight: 8 }} />
										<Text
											numberOfLines={2}
											ellipsizeMode="tail"
											variant="bodySmall"
											style={{ flexShrink: 1 }}
										>
											{getFileNameFromUri(providerDetails.id)}
										</Text>
									</View>
									<Button theme={{ roundness: 2 }} onPress={() => setIdModalVisible(true)}>
										<Text
											style={{
												fontFamily: theme.colors.fontSemiBold,
												color: theme.colors.primary,
											}}
										>
											Retake
										</Text>
									</Button>
								</View>
							)}
							{providerDetails.idError && (
								<View className="w-full">
									<HelperText type="error">{providerDetails.idError}</HelperText>
								</View>
							)}
						</View>
						<View className="w-full flex justify-center items-center">
							{!providerDetails.dbs ? (
								<TouchableOpacity
									onPress={() => setDbsModalVisible(true)}
									style={{
										borderColor: theme.colors.primary,
										borderWidth: 2,
										borderRadius: 10,
										borderStyle: "dotted",
										width: "100%",
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										padding: 20,
										gap: 8,
									}}
								>
									<Image source={pageUpload} className="w-12 h-12" />
									<Text
										style={{
											color: theme.colors.onBackground,
											fontFamily: theme.colors.fontMedium,
										}}
										variant="titleMedium"
									>
										Upload your DBS Certificate
									</Text>
									<Text style={{ color: theme.colors.bodyColor }}>
										Supported JPG, PNG, JPEG & PDF. Max 10 mb.
									</Text>
								</TouchableOpacity>
							) : (
								<View
									style={{
										width: "100%",
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
										borderColor: theme.colors.bodyColor,
										borderWidth: 1,
										borderRadius: 10,
										padding: 20,
									}}
								>
									<View className="flex-1 flex-row items-center">
										<Image source={document} className="h-16 w-16 mr-2" />
										<Text
											numberOfLines={2}
											ellipsizeMode="tail"
											variant="bodySmall"
											style={{ flexShrink: 1 }}
										>
											{getFileNameFromUri(providerDetails.dbs)}
										</Text>
									</View>
									<Button theme={{ roundness: 2 }} onPress={() => setDbsModalVisible(true)}>
										<Text
											style={{
												fontFamily: theme.colors.fontSemiBold,
												color: theme.colors.primary,
											}}
										>
											Retake
										</Text>
									</Button>
								</View>
							)}
							{providerDetails.dbsError && (
								<View className="w-full">
									<HelperText type="error">{providerDetails.dbsError}</HelperText>
								</View>
							)}
						</View>
						<View className="flex flex-row justify-start items-center my-4">
							<Image source={document} className="h-8 w-8 m-2" />
							<Text
								style={{ color: theme.colors.onBackground, fontFamily: theme.colors.fontSemiBold }}
								variant="titleMedium"
							>
								Type of Jobs(s) & Resume
							</Text>
						</View>
						<Text style={{ color: theme.colors.bodyColor }} className="w-full text-center mb-5">
							What type of job(s) are you taking?
						</Text>
						<View
							className="w-full flex flex-row justify-between items-center p-1 mb-2"
							style={{
								borderWidth: 1,
								borderRadius: 10,
								borderColor: providerDetails.jobTypes.publicAreaAttendant
									? theme.colors.primary
									: theme.colors.bodyColor,
							}}
						>
							<View className="flex flex-row justify-center items-center">
								<View className="ml-2">
									<Image source={sofa} className="h-6 w-6" />
								</View>
								<Text style={{ color: theme.colors.bodyColor, marginLeft: 8 }}>
									Public Area Attendant
								</Text>
							</View>
							<Checkbox
								status={providerDetails.jobTypes.publicAreaAttendant ? "checked" : "unchecked"}
								onPress={() => {
									setProviderDetails((prevState) => ({
										...prevState,
										jobTypes: {
											...prevState.jobTypes,
											publicAreaAttendant: !prevState.jobTypes.publicAreaAttendant,
										},
									}));
								}}
							/>
						</View>
						<View
							className="w-full flex flex-row justify-between items-center p-1 mb-2"
							style={{
								borderWidth: 1,
								borderRadius: 10,
								borderColor: providerDetails.jobTypes.roomAttendant
									? theme.colors.primary
									: theme.colors.bodyColor,
							}}
						>
							<View className="flex flex-row justify-center items-center">
								<View className="ml-2">
									<Image source={door} className="h-6 w-6" />
								</View>
								<Text style={{ color: theme.colors.bodyColor, marginLeft: 8 }}>Room Attendant</Text>
							</View>
							<Checkbox
								status={providerDetails.jobTypes.roomAttendant ? "checked" : "unchecked"}
								onPress={() => {
									setProviderDetails((prevState) => ({
										...prevState,
										jobTypes: {
											...prevState.jobTypes,
											roomAttendant: !prevState.jobTypes.roomAttendant,
										},
									}));
								}}
							/>
						</View>
						<View
							className="w-full flex flex-row justify-between items-center p-1"
							style={{
								borderWidth: 1,
								borderRadius: 10,
								borderColor: providerDetails.jobTypes.linenPorter
									? theme.colors.primary
									: theme.colors.bodyColor,
							}}
						>
							<View className="flex flex-row justify-center items-center">
								<View className="ml-2">
									<Image source={bed} className="h-6 w-6" />
								</View>
								<Text style={{ color: theme.colors.bodyColor, marginLeft: 8 }}>Linen Porter</Text>
							</View>
							<Checkbox
								status={providerDetails.jobTypes.linenPorter ? "checked" : "unchecked"}
								onPress={() => {
									setProviderDetails((prevState) => ({
										...prevState,
										jobTypes: {
											...prevState.jobTypes,
											linenPorter: !prevState.jobTypes.linenPorter,
										},
									}));
								}}
							/>
						</View>
						{providerDetails.jobTypesError && (
							<View className="w-full">
								<HelperText type="error">{providerDetails.jobTypesError}</HelperText>
							</View>
						)}
						<Text style={{ color: theme.colors.bodyColor }} className="w-full text-center my-5">
							Upload your resume as a proof to your legibility
						</Text>
						<View className="w-full flex justify-center items-center">
							{!providerDetails.resume ? (
								<TouchableOpacity
									onPress={() => setResumeModalVisible(true)}
									style={{
										borderColor: theme.colors.primary,
										borderWidth: 2,
										borderRadius: 10,
										borderStyle: "dotted",
										width: "100%",
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										padding: 20,
										gap: 8,
									}}
								>
									<Image source={pageUpload} className="w-12 h-12" />
									<Text
										style={{
											color: theme.colors.onBackground,
											fontFamily: theme.colors.fontMedium,
										}}
										variant="titleMedium"
									>
										Upload your Resume
									</Text>
									<Text style={{ color: theme.colors.bodyColor }}>
										Supported JPG, PNG, JPEG & PDF. Max 10 mb.
									</Text>
								</TouchableOpacity>
							) : (
								<View
									style={{
										width: "100%",
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
										borderColor: theme.colors.bodyColor,
										borderWidth: 1,
										borderRadius: 10,
										padding: 20,
									}}
								>
									<View className="flex-1 flex-row items-center">
										<Image source={document} className="h-16 w-16 mr-2" />
										<Text
											numberOfLines={2}
											ellipsizeMode="tail"
											variant="bodySmall"
											style={{ flexShrink: 1 }}
										>
											{getFileNameFromUri(providerDetails.resume)}
										</Text>
									</View>
									<Button theme={{ roundness: 2 }} onPress={() => setResumeModalVisible(true)}>
										<Text
											style={{
												fontFamily: theme.colors.fontSemiBold,
												color: theme.colors.primary,
											}}
										>
											Retake
										</Text>
									</Button>
								</View>
							)}
							{providerDetails.resumeError && (
								<View className="w-full">
									<HelperText type="error">{providerDetails.resumeError}</HelperText>
								</View>
							)}
						</View>
						<Button
							mode="contained"
							className="w-full mt-3"
							theme={{ roundness: 2 }}
							onPress={handleSubmit}
							disabled={isRequestProviderAccountLoading}
							loading={isRequestProviderAccountLoading}
							key={isRequestProviderAccountLoading ? "loading" : "loaded"}
						>
							<Text
								style={{
									color: !isRequestProviderAccountLoading
										? theme.colors.buttonText
										: theme.colors.onSurfaceDisabled,
									fontFamily: theme.colors.fontBold,
									padding: 5,
								}}
							>
								{!isRequestProviderAccountLoading ? "Submit" : "Submitting..."}
							</Text>
						</Button>
					</View>
					<UploadModal
						modalVisible={idModalVisible}
						setModalVisible={setIdModalVisible}
						document={providerDetails.id}
						setDocument={handleSetId}
					/>
					<UploadModal
						modalVisible={dbsModalVisible}
						setModalVisible={setDbsModalVisible}
						document={providerDetails.dbs}
						setDocument={handleSetDbs}
					/>
					<UploadModal
						modalVisible={resumeModalVisible}
						setModalVisible={setResumeModalVisible}
						document={providerDetails.resume}
						setDocument={handleSetResume}
					/>
					<ProfileUploadModal
						modalVisible={profileModalVisible}
						setModalVisible={setProfileModalVisible}
						document={providerDetails.profile}
						setDocument={handleSetProfile}
					/>
					<TermsAgreementModal
						modalVisible={termsAgreementModalVisible}
						setModalVisible={handleTermsAgreementModalVisible}
						confirmation={termsAgreement}
						setConfirmation={setTermsAgreement}
					/>
					<View className="pb-10"></View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default ProviderDetailsScreen;
