import React, { useState, useEffect, useRef } from "react";
import { View, Image, TouchableOpacity, Linking, ScrollView, ActivityIndicator } from "react-native";
import { Avatar, Button, Text } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";
import { useRoute, useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import services from "../../../../../utils/services";
import { getGcloudBucketHelphiveUsersUrl } from "../../../../../utils/gcloud-strings";
import {
	useGetProviderBookingByIdMutation,
	useStartBookingMutation,
} from "../../../../../features/provider/providerApiSlice";
import { useCompleteBookingMutation, useCancelBookingMutation } from "../../../../../features/auth/authApiSlice";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";

const calendarIcon = require("../../../../../../assets/icons/bookings/calendar.png");
const locationIcon = require("../../../../../../assets/icons/bookings/location.png");

const vector1 = require("../../../../../../assets/cloud vectors/vector-1.png");
const vector2 = require("../../../../../../assets/cloud vectors/vector-2.png");
const logo = require("../../../../../../assets/Logo/logo-light.png");

const MyOrderDetails = () => {
	const route = useRoute();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const { bookingId } = route.params as any;

	const theme = useAppTheme();
	const scrollViewRef = useRef<ScrollView>(null);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [isStartingJob, setIsStartingJob] = useState(false);
	const [isCompletingJob, setIsCompletingJob] = useState(false);
	const [isCancellingJob, setIsCancellingJob] = useState(false);

	const [getProviderBookingById, { data, error, isLoading: isBookingLoading }] = useGetProviderBookingByIdMutation();
	const [startBooking] = useStartBookingMutation();
	const [completeBooking] = useCompleteBookingMutation();
	const [cancelBooking] = useCancelBookingMutation();

	const booking = data?.booking;

	useEffect(() => {
		if (bookingId) {
			getProviderBookingById({ bookingId }).catch((err) => {
				console.error("Error fetching booking:", err);
				setSnackbarMessage("An error occurred while fetching the booking details.");
				setSnackbarVisible(true);
			});
		}
	}, [bookingId]);

	const profile = getGcloudBucketHelphiveUsersUrl(booking?.userId?.profile);

	useEffect(() => {
		if (error) {
			console.error("Error fetching booking details:", error);
			setSnackbarMessage("An error occurred while fetching the booking details.");
			setSnackbarVisible(true);
		}
	}, [error]);

	const handleStartJob = async () => {
		if (booking?.status === "pending") {
			setIsStartingJob(true);
			try {
				const result = await startBooking({ bookingId }).unwrap();
				if (result.error) {
					throw new Error(result.error);
				}
				await getProviderBookingById({ bookingId }).unwrap();
			} catch (err) {
				console.error("Error starting booking:", err);
				setSnackbarMessage("An error occurred while starting the booking.");
				setSnackbarVisible(true);
			} finally {
				setIsStartingJob(false);
			}
		}
	};

	const handleCompleteJob = async () => {
		if (booking?.status === "in progress") {
			setIsCompletingJob(true);
			try {
				const result = await completeBooking({ bookingId }).unwrap();
				if (result.error) {
					throw new Error(result.error);
				}
				await getProviderBookingById({ bookingId }).unwrap();
			} catch (err) {
				console.error("Error completing booking:", err);
				setSnackbarMessage("An error occurred while completing the booking.");
				setSnackbarVisible(true);
			} finally {
				setIsCompletingJob(false);
			}
		}
	};

	const handleCancelBooking = async () => {
		if (booking?.status === "pending") {
			setIsCancellingJob(true);
			try {
				const result = await cancelBooking({ bookingId }).unwrap();
				if (result.error) {
					throw new Error(result.error);
				}
				await getProviderBookingById({ bookingId }).unwrap();
			} catch (err) {
				console.error("Error cancelling booking:", err);
				setSnackbarMessage("An error occurred while cancelling the booking.");
				setSnackbarVisible(true);
			} finally {
				setIsCancellingJob(false);
			}
		}
	};

	if (isBookingLoading || !booking) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</View>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
			<StatusBar backgroundColor={theme.colors.primary} />

			<View style={{ flex: 1 }}>
				<View style={{ position: "relative" }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							paddingHorizontal: 16,
							paddingTop: 24,
							paddingBottom: 16,
						}}
					>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								gap: 8,
								minHeight: 40,
								width: "100%",
							}}
						>
							<TouchableOpacity
								style={{ flexDirection: "row", justifyContent: "flex-start" }}
								onPress={() => {
									navigation.goBack();
								}}
							>
								<MaterialIcons name="chevron-left" size={30} color={theme.colors.onPrimary} />
								<Image source={logo} style={{ height: 32, width: 32, marginRight: 8 }} />
								<Text
									variant="titleLarge"
									style={{
										fontFamily: theme.colors.fontSemiBold,
										color: theme.colors.onPrimary,
										textAlign: "left",
									}}
								>
									Order Status
								</Text>
							</TouchableOpacity>
						</View>
					</View>
					<Image
						source={vector1}
						style={{ width: "100%", position: "absolute", top: -40, left: 0, zIndex: -10 }}
					/>
					<Image
						source={vector2}
						style={{ width: "100%", height: 250, position: "absolute", top: 20, right: 0, zIndex: -10 }}
					/>
				</View>
				<View
					style={{
						position: "absolute",
						top: "20%",
						bottom: 0,
						left: 0,
						right: 0,
						backgroundColor: "white",
						zIndex: -5,
					}}
				/>
				<ScrollView
					ref={scrollViewRef}
					contentContainerStyle={{ flexGrow: 1 }}
					showsVerticalScrollIndicator={false}
				>
					<View
						style={{
							padding: 20,
							borderRadius: 20,
							backgroundColor: theme.colors.background,
						}}
						className="mx-4"
					>
						<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
							<Text
								style={{
									backgroundColor:
										booking?.status === "completed"
											? theme.colors.success
											: booking?.status === "cancelled"
												? theme.colors.error
												: theme.colors.warning,
									color: theme.colors.onPrimary,
									paddingVertical: 4,
									paddingHorizontal: 8,
									borderRadius: 16,
									fontFamily: theme.colors.fontMedium,
									fontSize: 14,
								}}
							>
								{booking?.status}
							</Text>
						</View>
						<View style={{ flexDirection: "row", alignItems: "center" }}>
							{services.map((service) => {
								if (service.id === booking?.service?.id) {
									return (
										<View
											key={service.id}
											style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
										>
											<Text
												style={{ flex: 1, fontSize: 18, fontFamily: theme.colors.fontSemiBold }}
											>
												{service.name}
											</Text>
											<Text variant="bodyLarge">#{booking?._id.slice(-6).toUpperCase()}</Text>
										</View>
									);
								}
								return null;
							})}
						</View>
						<View style={{ marginBottom: 16 }}>
							<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
								<Image source={calendarIcon} style={{ width: 20, height: 20, marginRight: 8 }} />
								<Text variant="bodyLarge">
									{new Date(booking?.startDate).toLocaleString(undefined, {
										timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
										hour12: true,
									})}
								</Text>
							</View>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginBottom: 8,
									flexWrap: "wrap",
								}}
							>
								<Image source={locationIcon} style={{ width: 20, height: 20, marginRight: 8 }} />
								<Text variant="bodyLarge" style={{ flex: 1 }} numberOfLines={2} ellipsizeMode="tail">
									{booking?.address}
								</Text>
							</View>
						</View>
						<View style={{ height: 150, marginBottom: 16, borderRadius: 10, overflow: "hidden" }}>
							<TouchableOpacity
								style={{ flex: 1 }}
								onPress={() => {
									const url = `https://www.google.com/maps/search/?api=1&query=${booking?.latitude},${booking?.longitude}`;
									Linking.openURL(url);
								}}
							>
								<MapView
									style={{ flex: 1 }}
									initialRegion={{
										latitude: booking?.latitude,
										longitude: booking?.longitude,
										latitudeDelta: 0.0922,
										longitudeDelta: 0.0421,
									}}
									scrollEnabled={false}
									zoomEnabled={false}
									rotateEnabled={false}
									pitchEnabled={false}
								>
									<Marker
										coordinate={{
											latitude: booking?.latitude,
											longitude: booking?.longitude,
										}}
										title="Booking Location"
										description={booking?.address}
									/>
								</MapView>
							</TouchableOpacity>
						</View>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginBottom: 16,
								padding: 15,
								backgroundColor: theme.colors.surface,
								borderRadius: 20,
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.25,
								shadowRadius: 3.84,
								elevation: 5,
							}}
						>
							{!booking?.userId?.profile ? (
								<View style={{ marginRight: 8 }}>
									<Avatar.Icon
										icon="account-circle"
										style={{
											backgroundColor: "white",
											height: 60,
											width: 60,
											borderWidth: 2,
											borderColor: "#BEBEBE",
										}}
										color="#BEBEBE"
										size={80}
									/>
								</View>
							) : (
								<View style={{ marginRight: 8 }}>
									<Image
										source={{ uri: profile }}
										style={{
											width: 60,
											height: 60,
											borderWidth: 2,
											borderColor: theme.colors.onPrimary,
											backgroundColor: theme.colors.background,
											borderRadius: 40,
											overflow: "hidden",
										}}
									/>
								</View>
							)}
							<View style={{ flex: 1 }}>
								<Text style={{ fontFamily: theme.colors.fontSemiBold }} variant="bodyLarge">
									{booking?.userId?.firstName} {booking?.userId?.lastName}
								</Text>
								<Text
									style={{ fontSize: 14, color: theme.colors.bodyColor }}
									numberOfLines={1}
									ellipsizeMode="tail"
								>
									{booking?.userId?.email}
								</Text>
							</View>
						</View>
						{(booking?.status == "pending" || booking?.status == "in progress") && (
							<View className="mt-4 flex-row justify-between">
								<Button
									mode="contained"
									onPress={() => {}}
									theme={{
										roundness: 2,
									}}
									style={{ flex: 1, marginRight: 4 }}
									icon={({ size, color }) => <Feather name="phone-call" size={size} color={color} />}
								>
									<Text
										style={{
											fontFamily: theme.colors.fontBold,
											color: isBookingLoading
												? theme.colors.onSurfaceDisabled
												: theme.colors.onPrimary,
											paddingVertical: 5,
										}}
									>
										Call
									</Text>
								</Button>
								<Button
									mode="outlined"
									onPress={() => {}}
									theme={{
										roundness: 2,
									}}
									style={{ flex: 1, marginLeft: 4 }}
									icon={({ size }) => (
										<Ionicons
											name="chatbubble-ellipses-outline"
											size={size}
											color={theme.colors.onBackground}
										/>
									)}
								>
									<Text
										style={{
											fontFamily: theme.colors.fontBold,
											color: theme.colors.onSurface,
											paddingVertical: 5,
										}}
									>
										Chat
									</Text>
								</Button>
							</View>
						)}
					</View>
					<View className="px-4 pb-4">
						<Text
							variant="titleMedium"
							style={{
								fontFamily: theme.colors.fontBold,
								color: theme.colors.onBackground,
								marginBottom: 8,
							}}
						>
							Price Details
						</Text>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								Rate
							</Text>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								${booking?.rate || 0} / hour
							</Text>
						</View>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								Hours
							</Text>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								{booking?.hours || 0}
							</Text>
						</View>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								Amount
							</Text>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								${(booking?.hours * booking?.rate).toFixed(2) || 0}
							</Text>
						</View>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								Platform Fee (20%)
							</Text>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								-${(booking?.hours * booking?.rate * 0.2).toFixed(2) || 0}
							</Text>
						</View>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								Total Receivable
							</Text>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								${(booking?.hours * booking?.rate * 0.8).toFixed(2) || 0}
							</Text>
						</View>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								Discount
							</Text>
							<Text style={{ fontFamily: theme.colors.fontMedium, color: theme.colors.onSurface }}>
								0%
							</Text>
						</View>
						<View className="mt-4 flex-row justify-between">
							{booking?.status === "pending" && (
								<Button
									mode="contained"
									onPress={handleStartJob}
									theme={{
										roundness: 2,
									}}
									style={{ flex: 1, marginRight: 4 }}
									icon={({ size, color }) => <Ionicons name="play" size={size} color={color} />}
									loading={isStartingJob}
									disabled={isStartingJob || booking?.userApprovalRequested}
									key={isStartingJob ? "isStartingJob" : "isNotStartingJob"}
								>
									<Text
										style={{
											fontFamily: theme.colors.fontBold,
											color:
												isStartingJob || booking?.userApprovalRequested
													? theme.colors.onSurfaceDisabled
													: theme.colors.onPrimary,
											paddingVertical: 5,
										}}
									>
										Start Job
									</Text>
								</Button>
							)}
							{booking?.status === "in progress" && (
								<Button
									mode="contained"
									onPress={handleCompleteJob}
									theme={{
										roundness: 2,
									}}
									style={{ flex: 1, marginRight: 4 }}
									icon={({ size, color }) => (
										<Ionicons name="checkmark-done" size={size} color={color} />
									)}
									loading={isCompletingJob}
									disabled={isCompletingJob}
									key={isCompletingJob ? "isCompletingJob" : "isNotCompletingJob"}
								>
									<Text
										style={{
											fontFamily: theme.colors.fontBold,
											color: isCompletingJob
												? theme.colors.onSurfaceDisabled
												: theme.colors.onPrimary,
											paddingVertical: 5,
										}}
									>
										Complete Job
									</Text>
								</Button>
							)}
							{booking?.status === "pending" && (
								<Button
									mode="outlined"
									onPress={handleCancelBooking}
									theme={{
										roundness: 2,
									}}
									style={{ flex: 1, marginLeft: 4 }}
									icon={({ size }) => (
										<MaterialIcons name="cancel" size={size} color={theme.colors.onBackground} />
									)}
									loading={isCancellingJob}
									disabled={isCancellingJob}
									key={isCancellingJob ? "isCancellingJob" : "isNotCancellingJob"}
								>
									<Text
										style={{
											fontFamily: theme.colors.fontBold,
											color: theme.colors.onSurface,
											paddingVertical: 5,
										}}
									>
										Cancel Booking
									</Text>
								</Button>
							)}
						</View>
					</View>
				</ScrollView>
				<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
					{snackbarMessage}
				</CustomSnackbar>
			</View>
		</SafeAreaView>
	);
};

export default MyOrderDetails;
