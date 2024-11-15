import React, { useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Button, Text, TextInput, HelperText } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import MapView, { Marker, Region } from "react-native-maps";
import axios from "axios";
import SelectLocationModal from "./select-location";

const Step2Content = ({
	onPrevious,
	setSnackbarVisible,
	setSnackbarMessage,
	startDate,
	setStartDate,
	startTime,
	setStartTime,
	selectedService,
	rate,
	hours,
	setHours,
	address,
	setAddress,
	dateError,
	setDateError,
	addressError,
	setAddressError,
	latitude,
	setLatitude,
	longitude,
	setLongitude,
	handleBooking,
	isBookingLoading,
}: {
	onPrevious: () => void;
	setSnackbarVisible: (visible: boolean) => void;
	setSnackbarMessage: (message: string) => void;
	startDate: Date | null;
	setStartDate: (date: Date | null) => void;
	startTime: Date | null;
	setStartTime: (time: Date | null) => void;
	selectedService: number | null;
	rate: string;
	hours: number;
	setHours: (hours: number) => void;
	address: string;
	setAddress: (address: string) => void;
	dateError: string | null;
	setDateError: (error: string | null) => void;
	addressError: string | null;
	setAddressError: (error: string | null) => void;
	latitude: number | null;
	setLatitude: (lat: number | null) => void;
	longitude: number | null;
	setLongitude: (lng: number | null) => void;
	handleBooking: () => void;
	isBookingLoading: boolean;
}) => {
	const theme = useAppTheme();

	const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

	const fetchAddressFromLatLng = async (latitude: number, longitude: number) => {
		try {
			const response = await axios.get(
				`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
			);
			if (response.data.results.length > 0) {
				const address = response.data.results[0].formatted_address;
				setAddress(address);
			} else {
				setLatitude(null);
				setLongitude(null);
				setAddress("");
				setSnackbarMessage("No address found for this location.");
				setSnackbarVisible(true);
			}
		} catch (error) {
			setLatitude(null);
			setLongitude(null);
			setAddress("");
			setSnackbarMessage("Failed to fetch address. Please try again.");
			setSnackbarVisible(true);
		}
	};

	const [currentRegion, setCurrentRegion] = React.useState<Region | null>(null);

	useEffect(() => {
		if (latitude !== null && longitude !== null) {
			setCurrentRegion({
				latitude,
				longitude,
				latitudeDelta: 0.0922,
				longitudeDelta: 0.0421,
			});
		} else {
			Location.getCurrentPositionAsync({}).then((location) => {
				setCurrentRegion({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
					latitudeDelta: 0.01,
					longitudeDelta: 0.01,
				});
			});
		}
	}, [latitude, longitude]);

	const [isStartDatePickerVisible, setStartDatePickerVisibility] = React.useState(false);
	const [isStartTimePickerVisible, setStartTimePickerVisibility] = React.useState(false);
	const [isLocationModalVisible, setLocationModalVisibility] = React.useState(false);

	const handleConfirmStartDate = (event: any, selectedDate?: Date) => {
		setStartDatePickerVisibility(false);
		if (event.type === "set" && selectedDate) {
			setStartDate(selectedDate);
			setStartTime(null);
		}
	};

	const handleConfirmStartTime = (event: any, selectedTime?: Date) => {
		setStartTimePickerVisibility(false);
		if (event.type === "set" && selectedTime) {
			const now = new Date();
			const minStartDateTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
			const selectedDateTime = new Date(startDate || now);
			selectedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

			if (selectedDateTime < minStartDateTime) {
				setSnackbarMessage("Start date and time must be at least 3 hours from now.");
				setSnackbarVisible(true);
			} else {
				setStartTime(selectedTime);
			}
		}
	};

	const handleBook = () => {
		let valid = true;

		if (!startDate || !startTime) {
			setDateError("Please select a valid start date and time.");
			valid = false;
		} else {
			setDateError(null);
		}

		if (!address) {
			setLatitude(null);
			setLongitude(null);
			setAddressError("Please enter a valid address.");
			valid = false;
		} else {
			setAddressError(null);
		}

		if (latitude === null || longitude === null) {
			setSnackbarMessage("Please select a valid location.");
			setSnackbarVisible(true);
			valid = false;
		}

		if (valid) {
			handleBooking();
		}
	};

	const useCurrentLocation = async () => {
		const { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			setSnackbarMessage("Permission to access location was denied");
			setSnackbarVisible(true);
			return;
		}

		const location = await Location.getCurrentPositionAsync({});
		const { latitude, longitude } = location.coords;

		setLatitude(latitude);
		setLongitude(longitude);
		await fetchAddressFromLatLng(latitude, longitude);
	};

	return (
		<ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
			<View className="pb-8">
				<Text variant="titleLarge" style={{ fontFamily: theme.colors.fontBold, marginBottom: 12 }}>
					Enter Booking Info
				</Text>
				<Text style={{ fontFamily: theme.colors.fontSemiBold, marginBottom: 6 }}>Start Date</Text>
				<TouchableOpacity
					onPress={() => setStartDatePickerVisibility(true)}
					style={{
						flexDirection: "row",
						alignItems: "center",
						backgroundColor: theme.colors.surface,
						borderColor: theme.colors.bodyColor,
						borderWidth: 1,
						padding: 10,
						borderRadius: 8,
					}}
				>
					<MaterialIcons name="event" size={20} color={theme.colors.primary} />
					<Text style={{ marginLeft: 8, color: theme.colors.bodyColor }}>
						{startDate
							? startDate.toLocaleDateString("en-US", {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
								})
							: "Select Start Date"}
					</Text>
				</TouchableOpacity>
				{isStartDatePickerVisible && (
					<DateTimePicker
						value={startDate || new Date()}
						mode="date"
						display="default"
						onChange={handleConfirmStartDate}
					/>
				)}
				<Text style={{ fontFamily: theme.colors.fontSemiBold, marginBottom: 6, marginTop: 12 }}>
					Start Time
				</Text>
				<TouchableOpacity
					onPress={() => {
						if (!startDate) {
							setSnackbarMessage("Please select a start date first.");
							setSnackbarVisible(true);
						} else {
							setStartTimePickerVisibility(true);
						}
					}}
					style={{
						flexDirection: "row",
						alignItems: "center",
						backgroundColor: theme.colors.surface,
						borderColor: theme.colors.bodyColor,
						borderWidth: 1,
						padding: 10,
						borderRadius: 8,
					}}
				>
					<MaterialIcons name="access-time" size={20} color={theme.colors.primary} />
					<Text style={{ marginLeft: 8, color: theme.colors.bodyColor }}>
						{startTime
							? startTime.toLocaleTimeString("en-US", {
									hour: "2-digit",
									minute: "2-digit",
									hour12: true,
								})
							: "Select Start Time"}
					</Text>
				</TouchableOpacity>
				{isStartTimePickerVisible && (
					<DateTimePicker
						value={startTime || new Date()}
						mode="time"
						display="default"
						onChange={handleConfirmStartTime}
					/>
				)}
				<HelperText type="error" visible={!!dateError}>
					{dateError}
				</HelperText>
				<Text style={{ fontFamily: theme.colors.fontSemiBold, marginBottom: 2 }}>Hours Needed</Text>
				<View className="flex-row">
					<TextInput
						className="mr-1 w-28"
						label="Enter hours"
						value={hours.toString()}
						onChangeText={(text) => {
							const parsedHours = parseInt(text);
							if (!isNaN(parsedHours) && parsedHours <= 1000) {
								setHours(parsedHours);
							} else {
								setHours(1);
							}
						}}
						mode="outlined"
						keyboardType="numeric"
						theme={{ colors: { primary: theme.colors.primary } }}
					/>
					<View className="flex-1 flex-row justify-center items-center">
						<Text style={{ fontFamily: theme.colors.fontSemiBold }} variant="bodyLarge">
							Total Charges:{" "}
						</Text>
						<Text style={{ fontFamily: theme.colors.fontRegular }} variant="bodyLarge">
							${(Number(rate) * hours).toFixed(2)}
						</Text>
					</View>
				</View>
				<Text style={{ fontFamily: theme.colors.fontSemiBold, marginBottom: 2 }}>Booking Address</Text>
				<TextInput
					label="Enter address"
					value={address}
					onChange={() => {
						setAddress("");
					}}
					mode="outlined"
					multiline
					numberOfLines={5}
					editable={false}
					error={!!addressError}
					theme={{ colors: { primary: theme.colors.primary } }}
				/>
				<HelperText style={{ marginBottom: 8 }} type="error" visible={!!addressError}>
					{addressError}
				</HelperText>
				<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
					<TouchableOpacity
						style={{ flexDirection: "row", alignItems: "center" }}
						onPress={() => setLocationModalVisibility(true)}
					>
						<MaterialIcons name="place" size={20} color={theme.colors.primary} />
						<Text style={{ color: theme.colors.primary, marginLeft: 4 }}>Choose on Map</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={{ flexDirection: "row", alignItems: "center" }}
						onPress={useCurrentLocation}
					>
						<MaterialIcons name="my-location" size={20} color={theme.colors.primary} />
						<Text style={{ color: theme.colors.primary, marginLeft: 4 }}>Use Current Location</Text>
					</TouchableOpacity>
				</View>
				<View
					style={{
						width: "100%",
						height: 200,
						backgroundColor: theme.colors.background,
						borderRadius: 10,
						overflow: "hidden",
					}}
				>
					<MapView
						style={{ flex: 1 }}
						region={{
							latitude: currentRegion?.latitude || 31.5497,
							longitude: currentRegion?.longitude || 74.3436,
							latitudeDelta: 0.01,
							longitudeDelta: 0.01,
						}}
						scrollEnabled={false}
						zoomEnabled={false}
					>
						{currentRegion && <Marker coordinate={currentRegion} />}
					</MapView>
				</View>
				<SelectLocationModal
					visible={isLocationModalVisible}
					onClose={() => setLocationModalVisibility(false)}
					onSelectLocation={({ latitude, longitude }: { latitude: number; longitude: number }) => {
						setLatitude(latitude);
						setLongitude(longitude);
						fetchAddressFromLatLng(latitude, longitude);
						setLocationModalVisibility(false);
					}}
				/>
				<View className="mt-4 flex-row justify-between">
					<Button
						mode="outlined"
						onPress={onPrevious}
						theme={{
							roundness: 2,
						}}
						style={{ flex: 1, marginRight: 4 }}
					>
						<Text style={{ fontFamily: theme.colors.fontBold, color: theme.colors.onSurface, padding: 5 }}>
							Previous
						</Text>
					</Button>
					<Button
						mode="contained"
						onPress={handleBook}
						disabled={
							!startDate ||
							!startTime ||
							!selectedService ||
							hours < 1 ||
							hours > 1000 ||
							Number(rate) < 20 ||
							Number(rate) > 2000 ||
							!address ||
							latitude === null ||
							longitude === null ||
							!!dateError ||
							!!addressError ||
							isBookingLoading
						}
						loading={isBookingLoading}
						theme={{
							roundness: 2,
						}}
						style={{ flex: 1, marginLeft: 4 }}
					>
						<Text
							style={{
								fontFamily: theme.colors.fontBold,
								color: isBookingLoading ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary,
								padding: 5,
							}}
						>
							Book
						</Text>
					</Button>
				</View>
			</View>
		</ScrollView>
	);
};

export default Step2Content;
