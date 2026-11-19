import { useEnsurePermission } from "@/services/permissions";
import { color } from "@/ui/tokens";
import { useState, useEffect } from "react";
import { Image, Platform, View, TouchableOpacity, ScrollView, Switch } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "@/ui/paperTheme";
import * as Location from "expo-location";
import { useDispatch, useSelector } from "react-redux";
import {
	setAvailability,
	setJobTypes,
	setCurrentLocation,
	selectAvailability,
	selectJobTypes,
	selectCurrentLocation,
} from "@/features/provider/slice";

import Map from "@/features/provider/components/AvailabilityMap";
import CustomSnackbar from "@/ui/legacy/CustomSnackbar";

import services from "@/lib/services";
import { getGcloudBucketHelphiveUsersUrl } from "@/lib/gcloud";
import { useAuthCheck } from "@/features/auth/useAuthCheck";
import useProviderAvailabilitySocket from "@/features/availability/useAvailabilitySocket";

const verifiedIcon = require("../../../../assets/icons/verified.png");
const startIcon = require("../../../../assets/icons/star.png");

const OFFLINE_MESSAGE = "You went offline: we could not reach the server. Check your connection and toggle again.";
const UPDATE_FAILED_MESSAGE = "We could not update your availability. Please try again.";

const Home = () => {
	const ensurePermission = useEnsurePermission();
	const { userDetails } = useAuthCheck();

	const websocketUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL || "wss://api.helphive.himaiz.com";
	const websocketEndpoint = `${websocketUrl}/provider-availability`;

	const theme = useAppTheme();
	const jobTypesFromStore = useSelector(selectJobTypes);
	const isAvailableFromStore = useSelector(selectAvailability);
	const currentLocationFromStore = useSelector(selectCurrentLocation);
	const dispatch = useDispatch();
	const [showSnackbar, setShowSnackbar] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState(OFFLINE_MESSAGE);

	const [isAvailable, setIsAvailable] = useState(isAvailableFromStore);
	const [jobTypes, setJobTypesState] = useState(jobTypesFromStore);
	const [latitude, setLatitude] = useState<number | null>(currentLocationFromStore.latitude);
	const [longitude, setLongitude] = useState<number | null>(currentLocationFromStore.longitude);

	const email = userDetails?.email || "";
	const truncatedEmail = email.length > 25 ? `${email.substring(0, 27)}...` : email;
	const profile = userDetails?.profile ? `${getGcloudBucketHelphiveUsersUrl(userDetails.profile)}` : "";

	const selectedJobs: number[] = [];
	if (jobTypes.publicAreaAttendant) selectedJobs.push(1);
	if (jobTypes.roomAttendant) selectedJobs.push(2);
	if (jobTypes.linenPorter) selectedJobs.push(3);

	// One authenticated socket while available. Location and job-type changes are sent over it rather than
	// reconnecting: every reconnect made the server's close handler mark the provider offline again.
	useProviderAvailabilitySocket({
		enabled: isAvailable,
		url: websocketEndpoint,
		payload: { isProviderAvailable: isAvailable, latitude, longitude, selectedJobs },
		onGiveUp: () => {
			setSnackbarMessage(OFFLINE_MESSAGE);
			setShowSnackbar(true);
			setIsAvailable(false);
			dispatch(setAvailability(false));
		},
		onServerError: () => {
			setSnackbarMessage(UPDATE_FAILED_MESSAGE);
			setShowSnackbar(true);
		},
	});

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

	// One location watcher for the screen, started only once permission is granted (starting it before the
	// permission answer made it fail and never start again). The last known position is used straight away so the
	// map does not wait on a fresh fix.
	useEffect(() => {
		let disposed = false;
		let subscription: Location.LocationSubscription | null = null;

		const apply = (coords: { latitude: number; longitude: number }) => {
			if (disposed) return;
			setLatitude(coords.latitude);
			setLongitude(coords.longitude);
			dispatch(setCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude }));
		};

		const start = async () => {
			try {
				if (!(await ensurePermission("location"))) {
					console.log("Permission to access location was denied");
					return;
				}
				const last = await Location.getLastKnownPositionAsync({}).catch(() => null);
				if (last) apply(last.coords);
				if (disposed) return;
				const started = await Location.watchPositionAsync(
					{ accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
					(newLocation) => apply(newLocation.coords),
				);
				if (disposed) started.remove();
				else subscription = started;
			} catch (error) {
				console.log("Could not watch the location:", error);
			}
		};

		start();

		return () => {
			disposed = true;
			subscription?.remove();
		};
	}, []);

	return (
		<View style={{ flex: 1, backgroundColor: color.canvas }}>
			<View className="h-full" style={{ backgroundColor: theme.colors.background }}>
				<Map latitude={latitude} longitude={longitude} />
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
									const isDisabled = !userDetails?.jobTypes?.[formattedServiceName];
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
					{snackbarMessage}
				</CustomSnackbar>
			)}
		</View>
	);
};

export default Home;
