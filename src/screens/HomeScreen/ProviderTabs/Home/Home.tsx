import React, { useState, useEffect, useRef } from "react";
import { Image, Platform, View, TouchableOpacity, ScrollView, Switch } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../../../utils/theme";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { useDispatch, useSelector } from "react-redux";
import {
	setAvailability,
	setJobTypes,
	setCurrentLocation,
	selectAvailability,
	selectJobTypes,
	selectCurrentLocation,
} from "../../../../features/provider/providerSlice";

import Map from "./components/Map";
import CustomSnackbar from "../../../../components/CustomSnackbar";

import services from "../../../../utils/services";
import { getGcloudBucketHelphiveUsersUrl } from "../../../../utils/gcloud-strings";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../utils/CustomTypes";
import { useNavigation } from "@react-navigation/native";

const vector1 = require("../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../assets/Logo/logo-light.png");
const profileWhite = require("../../../../../assets/icons/profile-icon-white.png");
const notificationWhite = require("../../../../../assets/icons/notification-white.png");
const verifiedIcon = require("../../../../../assets/icons/verified.png");
const startIcon = require("../../../../../assets/icons/star.png");

const Home = ({ userDetails }: { userDetails: any }) => {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

	const websocketUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL || "";
	const websocketEndpoint = `${websocketUrl}/provider-availability?email=${encodeURIComponent(userDetails?.email)}`;

	const theme = useAppTheme();
	const jobTypesFromStore = useSelector(selectJobTypes);
	const isAvailableFromStore = useSelector(selectAvailability);
	const currentLocationFromStore = useSelector(selectCurrentLocation);
	const dispatch = useDispatch();
	const [showSnackbar, setShowSnackbar] = useState(false);
	const ws = useRef<WebSocket | null>(null);

	const [isAvailable, setIsAvailable] = useState(isAvailableFromStore);
	const [jobTypes, setJobTypesState] = useState(jobTypesFromStore);
	const [latitude, setLatitude] = useState<number | null>(currentLocationFromStore.latitude);
	const [longitude, setLongitude] = useState<number | null>(currentLocationFromStore.longitude);

	const email = userDetails?.email || "";
	const truncatedEmail = email.length > 25 ? `${email.substring(0, 27)}...` : email;
	const profile = userDetails?.profile ? `${getGcloudBucketHelphiveUsersUrl(userDetails.profile)}` : "";

	const sendAvailability = (jobTypes: any, latitude: number | null, longitude: number | null) => {
		if (ws.current && ws.current.readyState === WebSocket.OPEN) {
			const selectedJobs = [];
			if (jobTypes.publicAreaAttendant) selectedJobs.push(1);
			if (jobTypes.roomAttendant) selectedJobs.push(2);
			if (jobTypes.linenPorter) selectedJobs.push(3);

			const message = JSON.stringify({
				isProviderAvailable: isAvailable,
				currentLocation: { latitude, longitude },
				selectedJobs,
			});
			ws.current.send(message);
		}
	};

	const toggleJobType = (serviceName: string) => {
		setJobTypesState((prevJobTypes: any) => {
			const updatedJobTypes = {
				...prevJobTypes,
				[serviceName]: !prevJobTypes[serviceName],
			};
			if (Object.values(updatedJobTypes).filter(Boolean).length === 0) {
				return prevJobTypes;
			}
			dispatch(setJobTypes(updatedJobTypes));
			return updatedJobTypes;
		});
	};

	useEffect(() => {
		const connectWebSocket = () => {
			if (ws.current) return;

			ws.current = new WebSocket(websocketEndpoint);

			ws.current.onopen = () => {
				console.log("WebSocket connection opened");
				sendAvailability(jobTypes, latitude, longitude);
			};

			ws.current.onclose = () => {
				console.log("WebSocket connection closed");
				dispatch(setAvailability(false));
			};

			ws.current.onerror = (error) => {
				console.log("WebSocket error:", error);
				setShowSnackbar(true);
				dispatch(setAvailability(false));
			};

			ws.current.onmessage = (event) => {
				console.log("Message from server:", event.data);
			};
		};

		if (isAvailable) {
			if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
				connectWebSocket();
			}
		} else {
			if (ws.current && ws.current.readyState === WebSocket.OPEN) {
				ws.current.close();
				ws.current = null;
			}
		}

		return () => {
			if (ws.current) {
				ws.current.close();
				ws.current = null;
			}
		};
	}, [isAvailable, latitude, longitude]);

	useEffect(() => {
		if (ws.current && ws.current.readyState === WebSocket.OPEN) {
			sendAvailability(jobTypes, latitude, longitude);
		}
	}, [jobTypes]);

	useEffect(() => {
		const updateLocation = async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				console.error("Permission to access location was denied");
				return;
			}

			const location = await Location.getCurrentPositionAsync({});
			setLatitude(location.coords.latitude);
			setLongitude(location.coords.longitude);
			dispatch(setCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude }));
		};

		updateLocation();

		const locationSubscription = Location.watchPositionAsync(
			{ accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
			(newLocation) => {
				setLatitude(newLocation.coords.latitude);
				setLongitude(newLocation.coords.longitude);
				dispatch(
					setCurrentLocation({
						latitude: newLocation.coords.latitude,
						longitude: newLocation.coords.longitude,
					}),
				);
			},
		);

		return () => {
			locationSubscription.then((subscription) => subscription.remove());
		};
	}, [latitude, longitude]);

	return (
		<SafeAreaView className="h-full w-full" style={{ backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />
			<View className="relative ">
				<View className="flex flex-row justify-between items-center px-4 pt-6 pb-4">
					<View className="flex flex-row justify-start items-center gap-2">
						<Image source={logo} className="h-8 w-8" />
						<Text
							variant="titleLarge"
							style={{ fontFamily: theme.colors.fontSemiBold, color: theme.colors.onPrimary }}
							className="text-center"
						>
							Helphive
						</Text>
						<Text
							variant="bodyLarge"
							style={{ fontFamily: theme.colors.fontRegular, color: theme.colors.onPrimary }}
							className="text-center"
						>
							Provider
						</Text>
					</View>
					<View className="flex flex-row gap-3">
						<Image source={notificationWhite} className="h-7 w-7" />
						<TouchableOpacity onPress={() => navigation.navigate("ProviderProfile", { userDetails })}>
							<Image source={profileWhite} className="h-7 w-7" />
						</TouchableOpacity>
					</View>
				</View>
				<Image source={vector1} className="w-full absolute top-[-40px] left-[0px] -z-10" />
				<Image source={vector2} className="w-full h-[250px] absolute top-[20px] right-0 -z-10" />
			</View>
			<View className="h-full" style={{ backgroundColor: theme.colors.background }}>
				<Map />
				<View className="w-full absolute top-0">
					<View
						className="my-6 mx-4 rounded-xl py-4 px-4"
						style={{
							backgroundColor: theme.colors.background,
							...Platform.select({
								ios: {
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.25,
									shadowRadius: 3.84,
								},
								android: {
									elevation: 5,
								},
							}),
						}}
					>
						<View className="w-full flex flex-row justify-between items-center">
							<View className="flex flex-row">
								<View className="relative mr-4">
									{profile && (
										<Image source={{ uri: profile }} className="h-12 w-12 rounded-full bg-black" />
									)}
									<View
										className="absolute bottom-0 -right-1 rounded-full p-[3px]"
										style={{ backgroundColor: theme.colors.background }}
									>
										<Image source={verifiedIcon} className=" w-4 h-4 " />
									</View>
								</View>
								<View className="flex">
									<Text
										variant="titleMedium"
										style={{
											fontFamily: theme.colors.fontSemiBold,
											color: theme.colors.onBackground,
										}}
									>
										{userDetails?.firstName} {userDetails?.lastName}
									</Text>
									<Text
										variant="bodySmall"
										style={{
											color: theme.colors.bodyColor,
										}}
									>
										{truncatedEmail}
									</Text>
								</View>
							</View>
							<View className="flex flex-row justify-center items-center">
								<Image source={startIcon} className="h-6 w-6 mr-1" />
								<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onBackground }}>
									{userDetails?.rating ? userDetails?.rating?.toFixed(1) : "4.0"}
								</Text>
							</View>
						</View>
					</View>
				</View>
				<View className="w-full absolute bottom-20">
					<View
						className="my-6 mx-4 rounded-xl py-4 px-4"
						style={{
							backgroundColor: theme.colors.background,
							...Platform.select({
								ios: {
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.25,
									shadowRadius: 3.84,
								},
								android: {
									elevation: 3,
								},
							}),
						}}
					>
						<View className="flex gap-2">
							<View className="flex flex-row justify-between items-center">
								<View>
									<Text
										variant="titleMedium"
										style={{
											fontFamily: theme.colors.fontSemiBold,
											color: theme.colors.onBackground,
										}}
									>
										Availability
									</Text>
									<Text
										style={{
											color: theme.colors.bodyColor,
										}}
									>
										You are {isAvailable ? "available" : "unavailable"}
									</Text>
								</View>
								<View style={{}}>
									<Switch
										value={isAvailable}
										onValueChange={(newValue) => {
											setIsAvailable(newValue);
											dispatch(setAvailability(newValue));
										}}
										trackColor={{
											false: theme.colors.onSurfaceDisabled,
											true: theme.colors.primary,
										}}
										thumbColor={isAvailable ? theme.colors.onPrimary : theme.colors.onPrimary}
										style={{
											transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
										}}
									/>
								</View>
							</View>
							<Text variant="bodySmall" style={{ color: theme.colors.bodyColor, textAlign: "center" }}>
								What job(s) are you taking?
							</Text>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								className="flex flex-row max-w-full"
							>
								{services.map((service, index) => {
									const formattedServiceName = service.name
										.replace(/\s+/g, "")
										.replace(/([A-Z])/g, (match, p1, offset) =>
											offset === 0 ? p1.toLowerCase() : p1,
										) as keyof typeof jobTypes;
									const isDisabled = !userDetails?.jobTypes[formattedServiceName];
									const isActive = jobTypes[formattedServiceName];

									return (
										<TouchableOpacity
											key={index}
											onPress={() => !isDisabled && toggleJobType(formattedServiceName)}
											activeOpacity={isDisabled ? 1 : 0.7}
											style={{
												marginLeft: index === 0 ? 0 : 4,
												marginRight: index === services.length - 1 ? 0 : 4,
												marginTop: 10,
											}}
										>
											<View
												className={`flex flex-1 justify-around items-center p-2 w-32 h-24 ${isDisabled ? "opacity-50" : ""}`}
												style={{
													borderColor:
														isDisabled || !isActive
															? theme.colors.onSurfaceDisabled
															: theme.colors.primary,
													borderWidth: 1,
													borderRadius: 10,
													backgroundColor: isDisabled
														? theme.colors.surfaceDisabled
														: theme.colors.background,
												}}
											>
												<Image
													source={
														isDisabled || !isActive ? service.disabledIcon : service.icon
													}
													className="h-10 w-10"
												/>
												<Text
													variant="bodySmall"
													style={{
														fontFamily: theme.colors.fontMedium,
														color: isDisabled
															? theme.colors.onSurfaceDisabled
															: theme.colors.onBackground,
													}}
													className="text-center"
												>
													{service.name}
												</Text>
											</View>
										</TouchableOpacity>
									);
								})}
							</ScrollView>
						</View>
					</View>
				</View>
			</View>
			<View className="h-full px-4" style={{ backgroundColor: theme.colors.background }}></View>
			{showSnackbar && (
				<CustomSnackbar visible={showSnackbar} onDismiss={() => setShowSnackbar(false)} duration={3000}>
					Error updating availability.
				</CustomSnackbar>
			)}
		</SafeAreaView>
	);
};

export default Home;
