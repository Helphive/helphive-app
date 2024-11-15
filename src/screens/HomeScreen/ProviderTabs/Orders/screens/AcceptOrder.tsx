import React, { useState, useEffect } from "react";
import { View, Image, TouchableOpacity, Linking, ScrollView, ActivityIndicator } from "react-native";
import { Avatar, Button, Text } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";
import { useRoute, useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import services from "../../../../../utils/services";
import { TextInput } from "react-native-gesture-handler";
import { getGcloudBucketHelphiveUsersUrl } from "../../../../../utils/gcloud-strings";
import {
	useAcceptBookingMutation,
	useGetProviderBookingByIdMutation,
} from "../../../../../features/provider/providerApiSlice";
import CustomSnackbar from "../../../../../components/CustomSnackbar";
import { RootStackParamList } from "../../../../../utils/CustomTypes";
import { StackNavigationProp } from "@react-navigation/stack";

const calendarIcon = require("../../../../../../assets/icons/bookings/calendar.png");
const locationIcon = require("../../../../../../assets/icons/bookings/location.png");
const timeCircleIcon = require("../../../../../../assets/icons/bookings/time-circle.png");

const AcceptOrder = () => {
	const route = useRoute();
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const { bookingId } = route.params as any;

	const theme = useAppTheme();
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");

	const [getProviderBookingById, { data, error, isLoading: isBookingLoading }] = useGetProviderBookingByIdMutation();
	const [acceptBooking, { isLoading }] = useAcceptBookingMutation();

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

	const handleAccept = async () => {
		try {
			await acceptBooking({ bookingId: booking._id }).unwrap();
			navigation.goBack();
		} catch (error: any) {
			console.error("Error accepting booking:", error);
			if (error.status === 400 && error.data?.message) {
				setSnackbarMessage(error.data.message);
			} else {
				setSnackbarMessage("An error occurred while accepting the booking.");
			}
			setSnackbarVisible(true);
		}
	};

	const handleDecline = () => {
		navigation.goBack();
	};

	if (isBookingLoading || !booking) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</View>
		);
	}

	return (
		<View style={{ backgroundColor: theme.colors.background, overflow: "visible" }} className="flex-1">
			<View style={{ alignItems: "center", paddingTop: 10 }}>
				<View style={{ width: 60, height: 4, backgroundColor: "#ccc", borderRadius: 2.5, marginBottom: 15 }} />
				<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
					<Avatar.Icon
						icon="bell-ring"
						size={40}
						color={theme.colors.onBackground}
						style={{ backgroundColor: theme.colors.background, position: "absolute", left: -40 }}
					/>
					<Text style={{ fontFamily: theme.colors.fontBold, textAlign: "center" }} variant="titleLarge">
						New Order
					</Text>
				</View>
			</View>
			<ScrollView style={{ flex: 1, paddingBottom: 8 }}>
				<View style={{ paddingHorizontal: 16 }}>
					<View style={{ flexDirection: "row", alignItems: "center", marginVertical: 16 }}>
						{services.map((service) => {
							if (service.id === booking?.service?.id) {
								return (
									<View key={service.id} className="flex flex-row align-middle">
										<Text style={{ flex: 1, fontSize: 18, fontFamily: theme.colors.fontSemiBold }}>
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
						<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
							<Image source={locationIcon} style={{ width: 20, height: 20, marginRight: 8 }} />
							<Text variant="bodyLarge" numberOfLines={2} ellipsizeMode="tail">
								{booking?.address}
							</Text>
						</View>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 8,
							}}
						>
							<View style={{ flexDirection: "row", alignItems: "center" }}>
								<Image source={timeCircleIcon} style={{ width: 20, height: 20, marginRight: 8 }} />
								<Text variant="bodyLarge">
									{booking?.hours} hrs{" "}
									<Text
										variant="bodyLarge"
										style={{ marginRight: 8, fontFamily: theme.colors.fontSemiBold }}
									>
										{" "}
										@
									</Text>
									<Text variant="bodyLarge"> ${booking?.rate}/hr</Text>
								</Text>
							</View>
							<View style={{ flexDirection: "row", alignItems: "center" }}>
								<Text variant="bodyLarge">
									<Text variant="bodyLarge" style={{ fontFamily: theme.colors.fontSemiBold }}>
										Total:{" "}
									</Text>
									${(booking?.rate * booking?.hours).toFixed(2)}
								</Text>
							</View>
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
					<View style={{ marginBottom: 16 }}>
						<Text variant="bodyLarge" style={{ marginBottom: 8, fontFamily: theme.colors.fontSemiBold }}>
							Memo
						</Text>
						<TextInput
							placeholder="No additional information provided"
							editable={false}
							multiline={true}
							numberOfLines={4}
							style={{
								backgroundColor: theme.colors.surface,
								padding: 10,
								borderRadius: 10,
								borderWidth: 1,
								borderColor: theme.colors.bodyColor,
								textAlignVertical: "top",
								fontFamily: theme.colors.fontRegular,
							}}
						/>
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
				</View>
			</ScrollView>
			<View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingVertical: 16 }}>
				<Button
					mode="contained"
					className="w-full mb-2"
					theme={{ roundness: 2 }}
					onPress={handleAccept}
					disabled={isLoading}
					loading={isLoading}
				>
					<Text
						style={{
							fontFamily: theme.colors.fontBold,
							padding: 5,
							color: isLoading ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary,
						}}
					>
						Accept
					</Text>
				</Button>
				<Button mode="outlined" className="w-full" theme={{ roundness: 2 }} onPress={handleDecline}>
					<Text
						style={{
							color: theme.colors.onBackground,
							fontFamily: theme.colors.fontBold,
							padding: 5,
						}}
					>
						Decline
					</Text>
				</Button>
			</View>
			<CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
				{snackbarMessage}
			</CustomSnackbar>
		</View>
	);
};

export default AcceptOrder;
